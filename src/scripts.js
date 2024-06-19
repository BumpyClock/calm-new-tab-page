// Path: scripts.js
const SUBSCRIBED_FEEDS_KEY = "subscribedFeeds";
const DISCOVERED_FEEDS_KEY = "discoveredFeeds";
const FEED_DISCOVERY_KEY = "feedDiscoveryPref"; // By default feed discovery is enabled
const FEED_DETAILS_KEY = "feedDetails";
const SEARCH_PREFERENCE_KEY = "searchPref";
const feedContainer = document.getElementById("feed-container");
const welcomePage = document.getElementById("welcome-page");
const settingsPage = document.getElementById("settings-page");
const refreshTimer = 15 * 60 * 1000; //fifteen minutes
const NTP_PERMISSION_DEFAULT = false;
var NTP_PERMISSON;
let startY; // Variable to store the start Y position of the touch
let feedsCache = null;
let cachedCards = null; // Store the cards in an array to avoid re-creating them for every new tab
let initialLoad = true;


defaultFeeds = [
  "http://www.theverge.com/rss/index.xml",
  "https://www.vox.com/rss/index.xml"
];

// JSON array for holding default feeds url array
let feedList = {
  subscribedFeeds: [],
  suggestedFeeds: []
};
let msnry;

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "welcome.html" });
    setFeedDiscovery(true);
    setSearchPreference(false);
    getSubscribedFeeds();
  }
});

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then(function (registration) {
      console.log("Service Worker registered with scope:", registration.scope);
      if (!navigator.serviceWorker.controller) {
        window.location.reload();
      }
    })
    .catch(function (error) {
      console.log("Service Worker registration failed:", error);
    });
}

navigator.serviceWorker.addEventListener("controllerchange", function () {
  if (this.controller.state === "activated") {
    refreshFeeds();
  }
});


// Create a BroadcastChannel object
const channel = new BroadcastChannel("rss_feeds_channel");
const CARD_CACHE_NAME = "card-items-cache";

// Declare a cache object outside the showReaderView function
const siteInfoCache = {};
let mostVisitedSitesCache = null;

let lastRefreshed = new Date(); // 
const getGreeting = () => {
  const date = new Date();
  const hours = date.getHours();

  if (hours < 12) {
    return "Good morning";
  } else if (hours < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const setGreeting = () => {
    const greeting = getGreeting();
    document.title = `${greeting} - New Tab`;
  };
  // Welcome screen logic
  if (welcomePage) {
    setupWelcomePage();
    discoverFeeds();
    setGreeting();
  }
  // setGreeting();
  if (feedContainer) {
    // Main page
    await setupNTP();
  } else if (settingsPage) {
    // Settings page
    setupSettingsPage();
  }
  // await  showLoadingState();
  if (document.querySelector("#settings-button")) {
    document.getElementById("settings-button").addEventListener("click", () => {
      window.location.href = "settings.html";
    });
  }

  setInterval(autoRefreshFeed, refreshTimer);
});

function hideSearch() {
  const searchContainer = document.getElementById("search-wrapper");
  searchContainer.innerHTML = "";
}
function showSearch() {
  const searchContainer = document.getElementById("search-wrapper");
  searchContainer.innerHTML = `<div class="input-holder">
  <input type="text" id="search-input" class="search-input" placeholder="Type to search" />
  <button id="search-button" class="search-icon" ><span></span></button>
</div>
`;
  handleSearch();
}

async function setupSearch() {
  const searchPref = getSearchPreference();
  try {
  } catch (error) {
    console.error("Error getting search preference: ", error);
  }
  if (searchPref) {
    console.log("searchPref is true, showing search");
    showSearch();
  } else {
    hideSearch();
  }
}

// on exit, clear old caches
window.addEventListener("unload", async () => {
  cachedCards = [];
  await clearCache();
  localStorage.removeItem("mostVisitedSitesCache");
});

function shouldRefreshFeeds() {
  const currentTimestamp = new Date().getTime();
  console.log(`'lastRefreshed' is ${lastRefreshed}`);
  // If lastRefreshed isn't set, set it to current time and clear the cache
  if (!lastRefreshed) {
    lastRefreshed = currentTimestamp;
    clearCache();
    console.log("lastRefreshed is not set, setting it to current time");
    return false;
  }
  // If lastRefreshed is older than 15 minutes, refresh
  return currentTimestamp - lastRefreshed > refreshTimer;
}

async function autoRefreshFeed() {
  console.log("AutoRefresh triggered auto Refreshing Feeds");
  refreshFeeds();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "readableContentFetched") {
    const article = message.article;
    // Update the modal window with the readable content
  }
});


function loadSubscribedFeeds() {
  const feedContainer = document.getElementById("feed-container");
  feedContainer.innerHTML = "";
  !shouldRefreshFeeds() && feedsCache
    ? (renderFeed(cachedCards), setLastRefreshedTimestamp(lastRefreshed))
    : refreshFeeds();
}

async function refreshFeeds() {
  try {
      const { subscribedFeeds } = await getSubscribedFeeds();
      const serviceWorker = navigator.serviceWorker.controller;
      if (!serviceWorker) {
          throw new Error("Service worker is not active or not controlled.");
      }
      feedList.subscribedFeeds = subscribedFeeds;
      lastRefreshed = new Date().getTime();
      serviceWorker.postMessage({
          action: "fetchRSS",
          feedUrls: feedList.subscribedFeeds
      });
  } catch (error) {
      console.error("Failed to refresh feeds:", error);
  }
}


function discoverFeeds() {
  const serviceWorker = navigator.serviceWorker.controller;
  if (serviceWorker) {
    console.log("Sending message to service worker to discover feeds");
    chrome.topSites.get(function (topSites) {
      const discoverUrls = topSites
        .filter(site => {
          const url = new URL(site.url);
          return !url.protocol.startsWith('chrome-extension') && !url.hostname.match(/^[\d.]+$/);
        })
        .map(site => site.url);
      serviceWorker.postMessage({ action: "discoverFeeds", discoverUrls });
    });
  } else {
    console.error("Service worker is not active or not controlled.");
  }
}

async function updateDisplayOnNewTab() {
  const cachedCards = await getCachedRenderedCards();
  if (cachedCards) {
    renderFeed(cachedCards);
  } else {
    loadSubscribedFeeds();
  }
}

function initializeMasonry() {
 msnry = new Masonry(feedContainer, {
    itemSelector: ".card",
    columnWidth: ".card",
    gutter: 24,
    transitionDuration: '0.08s', // set the transition duration
    stagger: 5, // set the stagger delay
    fitwidth: true,
    isFitWidth: true,
});
  document.querySelectorAll(".masonry-item").forEach(item => {
    item.addEventListener("load", () => {
      msnry.layout();
      setupParallaxEffect(item.parentElement.parentElement);
      item.parentElement.classList.remove("loading");
    });
  });
  const debouncedLayout = debounce(() => {
    msnry.layout();
  }, 300);
  window.addEventListener("resize", debouncedLayout);
}

async function renderFeed(feeditems = null, feedDetails = null, cachedCards = null) {
  if (cachedCards) {
    console.log("rendering feed from cache");
    feedContainer.innerHTML = cachedCards;
    initializeMasonry();
    await cacheRenderedCards(feedContainer.innerHTML);
    feedContainer.style.opacity = "1";
    setLastRefreshedTimestamp(lastRefreshed);
  } else {
    feedsCache = feeditems;
    let cardCount = 0;
    const fragment = document.createDocumentFragment();
    for (const item of feeditems) {
      const card = await createCard(item, feedDetails);
      if (card instanceof Node) {
        fragment.appendChild(card);
        cardCount++;
      } else {
        console.error("Card is not a valid DOM Node:", card);
      }
    }
    console.log(`rendered ${cardCount} cards`);
    if (feedContainer) {
      feedContainer.innerHTML = "";
    }
    feedContainer.appendChild(fragment);
    await cacheRenderedCards(feedContainer.innerHTML);
    setLastRefreshedTimestamp(lastRefreshed);
    feedContainer.style.opacity = "1";
    initializeMasonry();
  }
}

function setupParallaxEffect(card) {
  const imageContainer = card.querySelector("#thumbnail-image");

  if (imageContainer) {
    const imageContainerStyle = imageContainer.style;

    card.addEventListener("mouseover", () => {
      imageContainerStyle.transition = "transform 0.25s ease-in";
      imageContainerStyle.transform = "scale(1.05)";
    });

    card.addEventListener("mousemove", e => {
      const cardRect = card.getBoundingClientRect();
      const xVal = (e.clientX - cardRect.left) / cardRect.width;
      const yVal = (e.clientY - cardRect.top) / cardRect.height;

      const xOffset = -(xVal - 0.5) * 20;
      const yOffset = -(yVal - 0.5) * 20;

      imageContainerStyle.objectPosition = `${50 + xOffset}% ${50 + yOffset}%`;
    });

    card.addEventListener("mouseleave", () => {
      imageContainerStyle.transform = "scale(1)";
      imageContainerStyle.backgroundPosition = "center center";
    });
  }
}

navigator.serviceWorker.addEventListener("message", async function (event) {
  if (event.data.action === "rssUpdate") {
    let response = JSON.parse(event.data.data);
    console.log(`feed refresh from service worker: ${response}`);
    const { feedDetails, feedItems } = processRSSData(response);
    setFeedDetails(feedDetails);
    setFeedItems(feedItems);
    if(feedContainer){
    try {
      await renderFeed(feedItems, feedDetails).catch(error => {
        console.error("Error rendering the feed:", error);
      });
    } catch (error) {
      console.log("feed container not found:", error);
    }
  } else if (settingsPage) {
    await displaySubscribedFeeds();
  }
  }
});

navigator.serviceWorker.addEventListener('message', event => {
  if (event.data.action === 'discoveredFeeds') {
    console.log('Received discovered feeds:', event.data.feedUrls);
    // Do something with event.data.feeds...
  }
});

async function getWebsiteTitle(url) {
  try {
    // console.log("getting website title for;" + url);
    const parsedUrl = new URL(url);
    const rootDomain = `${parsedUrl.protocol}//${parsedUrl.host}`;

    const response = await fetch(rootDomain);
    const tempElement = document.createElement("div");
    const text = await response.text();

    // Use a more specific regular expression to match the title tag
    const matches = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    tempElement.innerHTML = matches && matches[1] ? matches[1] : rootDomain;

    return tempElement.textContent;
  } catch (e) {
    console.error("Failed to get website title:", url, e);
    return url;
  }
}

//listen for messages from broadcast channel
channel.addEventListener("message", event => {
  if (event.data.action === "shareFeeds" && event.data.feeds) {
    const currentTimestamp = new Date().getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    if (currentTimestamp - event.data.lastRefreshed > fifteenMinutes) {
      // Refresh the feed
      loadSubscribedFeeds();
    } else {
      const { feedDetails, feedItems } = processRSSData(response);
      if (document.getElementById("#feed-container")) {
        renderFeed(feedDetails, feedItems);
        setLastRefreshedTimestamp(new Date(event.data.lastRefreshed));
      }
    }
  }
});

function processRSSData(rssData) {
  // Initialize arrays to hold the processed feed details and items
  const feedDetails = [];
  const feedItems = [];

  if (rssData && rssData.feedDetails && rssData.items) {
    // Process the feed details
    rssData.feedDetails.forEach(feed => {
      const { siteTitle, feedTitle, feedUrl, description, author, lastUpdated, lastRefreshed, favicon } = feed;
      feedDetails.push({ siteTitle, feedTitle, feedUrl, description, author, lastUpdated, lastRefreshed, favicon });
    });

    // Process the feed items
    rssData.items.forEach(item => {
      const { id, title, siteTitle, feedUrl, feedTitle, favicon, thumbnail,thumbnailColor, link, author, published, created, category, content, media, enclosures, podcastInfo } = item;
      const publishedDate = published && !isNaN(Date.parse(published)) ? new Date(published).toISOString() : null;
      const createdDate = created && !isNaN(Date.parse(created)) ? new Date(created).toISOString() : null;
      feedItems.push({ id, title, siteTitle, feedUrl, feedTitle, favicon, thumbnail,thumbnailColor, link, author, published: publishedDate, created: createdDate, category, content, media, enclosures, podcastInfo });
    });

    if (feedItems.length > 0) {
      feedItems.sort((a, b) => new Date(b.published) - new Date(a.published));
    }
  }

  // Return the processed data
  return { feedDetails, feedItems };
}

// Search code

function handleSearch() {
  const searchInput = document.getElementById("search-input");
  const searchEngineSelect = document.getElementById("search-engine");
  const searchButton = document.getElementById("search-button");

  searchButton.addEventListener("click", () => {
    const query = searchInput.value;
    // const searchEngineURL = searchEngineSelect.value;
    const searchEngineURL = "https://www.google.com/search?q=";
    const searchURL = searchEngineURL + encodeURIComponent(query);
    window.open(searchURL, "_blank");
  });

  searchInput.addEventListener("keyup", event => {
    if (event.key === "Enter") {
      searchButton.click();
    }
  });
}

// Add this function to remove a feed
function removeFeed(feedURL) {
  const feeds = getSubscribedFeeds().subscribedFeeds;
  const updatedFeeds = feeds.filter(url => url !== feedURL);
  setSubscribedFeeds(updatedFeeds);
}

// Show Top Sites
async function initializeMostVisitedSitesCache() {
  mostVisitedSitesCache = await new Promise(resolve => {
    chrome.topSites.get(async sites => {
      const siteCards = await Promise.all(
        sites
          .filter(site => !site.url.startsWith("chrome-extension://"))
          .slice(0, 10)
          .map(async site => {
            const siteCard = await createMostVisitedSiteCard(site);
            return siteCard;
          })
      );
      setTopSitesCache(siteCards);
      mostVisitedSitesCache = siteCards;
      resolve(siteCards);
    });
  });

  // Call fetchMostVisitedSites to display the most visited sites once the cache is initialized
  fetchMostVisitedSites();
}

function setTopSitesCache(sitecards) {
  // console.log(sitecards);
  localStorage.setItem("mostVisitedSites", JSON.stringify(sitecards));
}
function getTopSitesCache() {
  if (!localStorage.getItem("mostVisitedSites")) {
    return null;
  } else {
    return JSON.parse(localStorage.getItem("mostVisitedSites"));
  }
}
async function createMostVisitedSiteCard(site) {
  const siteUrl = new URL(site.url);
  const mainDomain = siteUrl.hostname;
  const siteCard = document.createElement("div");
  siteCard.className = "site-card";
  const sitefaviconUrl = await getSiteFavicon(mainDomain);
  //send a get request to get the favicon url from http://192.168.1.51:3000/get-favicon?url=${mainDomain}
  siteCard.innerHTML = `
  <a href="${site.url}" class="site-link">
  <img src="${sitefaviconUrl}" alt="${site.title} Favicon" class="site-favicon lazyload">
    <div class="site-title"><p>${site.title}</p></div>
    
  </a>      <div class="site-card-background-image-container lazyload" style="background-image: url('${sitefaviconUrl}');"></div>

`;
  return siteCard;
}

async function getSiteFavicon(mainDomain) {
  // Add http:// to the start of the URL if it's not already there
  if (!mainDomain.startsWith("http://") && !mainDomain.startsWith("https://")) {
    mainDomain = "http://" + mainDomain;
  }

  try {
    // Check if mainDomain is a valid URL
    new URL(mainDomain);
  } catch (_) {
    console.log("Invalid URL:", mainDomain);
    // If it's not a valid URL, return an empty string
    return "";
  }

  // Check if mainDomain ends with a valid domain extension
  const domainPattern = /\.[a-z]{2,}$/i;
  if (!domainPattern.test(mainDomain)) {
    console.log("Invalid domain:", mainDomain);
    // If it doesn't end with a valid domain extension, return an empty string
    return "";
  }

  try {
    const response = await fetch(
      `https://www.google.com/s2/favicons?domain=${mainDomain}&sz=256`
    );
    if (!response.ok) {
      try {
        //remove http:// or https:// from the start of the URL if it's there
        if (mainDomain.startsWith("http://")) {
          mainDomain = mainDomain.replace("http://", "");
        } else if (mainDomain.startsWith("https://")) {
          mainDomain = mainDomain.replace("https://", "");
        }
        const response = await fetch(`https://icon.horse/icon/${mainDomain}`);
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.log("Error fetching favicon from both iconhorse and google");
      }
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    // console.log("Failed to fetch favicon for:", mainDomain);
  }
}

function fetchMostVisitedSites(siteCards) {
  if (!mostVisitedSitesCache) {
    console.error("Most visited sites cache is not initialized");
    initializeMostVisitedSitesCache();

    return;
  }

  const mostVisitedSitesContainer = document.querySelector(
    ".most-visited-sites-container"
  );
  mostVisitedSitesContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (const siteCard of mostVisitedSitesCache) {
    fragment.appendChild(siteCard);
  }
  mostVisitedSitesContainer.appendChild(fragment);

  // mostVisitedSitesCache.forEach((siteCard) => {
  //   mostVisitedSitesContainer.appendChild(siteCard.cloneNode(true));
  // });
}

//cache favicons for improve perf
async function cacheFavicon(domain) {
  const response = await getSiteFavicon(domain);
  localStorage.setItem(`favicon-${domain}`, response.url);
  return dataURL;
}

function setLastRefreshedTimestamp(lastRefreshed) {
  const timestampDiv = document.getElementById(
    "last-refreshed-timestamp-container"
  );
  lastRefreshed = new Date(lastRefreshed);
timestampDiv.textContent = `Last refreshed: ${lastRefreshed.toLocaleTimeString()}`;}

if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({ action: "fetchBingImage" });

  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data.action === "bingImageResponse") {
      const imageDetails = {
        imageBlob: event.data.imageBlob,
        title: event.data.title,
        copyright: event.data.copyright
      };
      // console.log(JSON.stringify(imageDetails));
      setBingImage(imageDetails);
    }
  });
}

function setBingImage(imageDetails) {
  if(feedContainer){
  // console.log(`setBingImage: ${JSON.stringify(imageDetails)}`);
  const bgContainer = document.querySelector(".background-image-container");
  const imageUrl = URL.createObjectURL(imageDetails.imageBlob);
  const title = imageDetails.title;
  const copyright = imageDetails.copyright;
  bgContainer.innerHTML = `<img id="background-image-container" data-src="${imageUrl}"  alt="${title}" class="background-image-container extension-bg lazyload" style>`;
  // bgContainer.style.backgroundImage = `url(${imageUrl})`;
  const attributionContainer = document.createElement("div");
  attributionContainer.className = "attribution-container";
  attributionContainer.innerHTML = `
        <p class="attribution-title">${title}</p>
        <p class="attribution-copyright">${copyright} | Bing & Microsoft</p>
      `;
  bgContainer.appendChild(attributionContainer);
  bgContainer.style.backgroundImage = `url(${imageUrl})`;
  }
}

async function fetchBingImageOfTheDay() {
  try {
    const response = await fetch(
      "https://www.bing.com/HPImageArchive.aspx?resoultion=3840&format=js&image_format=webp&idx=random&n=1&mkt=en-US"
    );
    const data = await response.json();
    let imageUrl = "https://www.bing.com" + data.images[0].url;
    imageUrl = imageUrl.replace(/1920x1080/g, "UHD");
    // console.log(imageUrl);

    const title = data.images[0].title;
    const copyright = data.images[0].copyright;
    const bgContainer = document.querySelector(".background-image-container");
    bgContainer.innerHTML = `<img id="background-image-container" data-src="${imageUrl}"  alt="${title}" class="background-image-container extension-bg lazyload" style>`;
    // bgContainer.style.backgroundImage = `url(${imageUrl})`;
    const attributionContainer = document.createElement("div");
    attributionContainer.className = "attribution-container";
    attributionContainer.innerHTML = `
        <p class="attribution-title">${title}</p>
        <p class="attribution-copyright">${copyright} | Bing & Microsoft</p>
      `;
    bgContainer.appendChild(attributionContainer);
  } catch (error) {
    console.error("Failed to fetch Bing image of the day:", error);
  }
}

function bgImageScrollHandler() {
  window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    const blurIntensity = Math.min(scrollPosition / 100, 10); // Adjust the maximum blur intensity as per your preference
    const darkIntensity = Math.min(scrollPosition / 1000, 0.4); // Adjust the maximum dark intensity as per your preference
    const bgContainer = document.getElementById("background-image-container");
    bgContainer.style.filter = `blur(${blurIntensity}px) brightness(${0.7 - darkIntensity})`;
  });
}


// Function to get the current state of feed discovery
function getFeedDiscovery() {
  try {
    if (!localStorage.getItem(FEED_DISCOVERY_KEY)) {
      console.log("Feed discovery is not set, setting it to true");
      setFeedDiscovery(true);
      return true;
    }
  } catch (error) {
    console.log(error);
  }
  return localStorage.getItem(FEED_DISCOVERY_KEY) === "true";
}

// Function to set the state of feed discovery
function setFeedDiscovery(state) {
  localStorage.setItem(FEED_DISCOVERY_KEY, state);
}

function getSearchPreference() {
  try {
    if (!localStorage.getItem(SEARCH_PREFERENCE_KEY)) {
      console.log("Search preference is not set, setting it to false");
      setSearchPreference(false);
      return false;
    }
  } catch (error) {
    console.log(error);
  }
  return localStorage.getItem(SEARCH_PREFERENCE_KEY) === "true";
}

function setSearchPreference(state) {
  localStorage.setItem(SEARCH_PREFERENCE_KEY, state);
  console.log(
    `Search preference set to ${localStorage.getItem(SEARCH_PREFERENCE_KEY)}`
  );
}



// Setup NTP
async function setupNTP() {
  setupSearch();
  lazySizes.cfg.expand = 600;
  lazySizes.cfg.preloadAfterLoad = true;
  lazySizes.cfg.loadMode = 2;
  lazySizes.cfg.expFactor = 3;
  lazySizes.init();
  discoverFeeds();
  await initializeMostVisitedSitesCache();
  console.log(`Feed discovery is set to : ${getFeedDiscovery()}`);

  cachedCards = await getCachedRenderedCards();
  const feedContainer = document.getElementById("feed-container");
  if (shouldRefreshFeeds() && cachedCards !== null) {
    feedContainer.innerHTML = cachedCards;
    setLastRefreshedTimestamp(lastRefreshed);
    initializeMasonry();
    reapplyEventHandlersToCachedCards();
    feedContainer.style.opacity = "1"; // apply the fade-in effect
  } else {
    console.log("rendering feed from scratch");
     loadSubscribedFeeds();
  }
  bgImageScrollHandler();
}

async function setupSettingsPage() {
  await displaySubscribedFeeds();
  setupSubscriptionForm();
  setupBackButton();
  setupFeedDiscoveryToggle();
  setupSearchPreferenceToggle();
  setupApiUrlFormEventHandler();
}

// Welcome page code

function setupWelcomePage() {
  getNtpPermission();
  const welcomePage = document.getElementById("welcome-page");
  const welcomePageButton = document.getElementById("consent-button");
  welcomePageButton.addEventListener("click", () => {
    console.log("consent button clicked");

    //open a new page to show the new tab page when the user clicks on the consent button and close the welcome tab
    chrome.tabs.create({ url: "newtab.html" });
    chrome.tabs.getCurrent(tab => {
      chrome.tabs.remove(tab.id);
    });
    setNtpPermission(true);
    console.log(`NTP_PERMISSON set to ${getNtpPermission()}`);
    // checkNTPConsent();
    // welcomePage.style.display = "none";
  });
}
function checkNTPConsent() {
  if (getNtpPermission()) {
    // Activate the new tab override
    chrome.storage.local.set({ newTabOverrideActive: true });
    // Replace the new tab page (e.g., open your extension's new tab page)
    chrome.tabs.query({ url: "chrome://newtab" }, tabs => {
      if (tabs && tabs.length) {
        chrome.tabs.update(tabs[0].id, { url: "index.html" });
      }
    });
  }
}
// getter and setter functions
function setFeedDetails(feedDetails) {
  localStorage.setItem("feedDetails", JSON.stringify(feedDetails));
}

function getFeedDetails() {
  return JSON.parse(localStorage.getItem("feedDetails"));
}

function setFeedItems(feedItems) {
  localStorage.setItem("feedItems", JSON.stringify(feedItems));
}

function getFeedItems() {
  return JSON.parse(localStorage.getItem("feedItems"));
}

function getSubscribedFeeds() {
  if (!localStorage.getItem(SUBSCRIBED_FEEDS_KEY)) {
    setSubscribedFeeds(defaultFeeds);
    return {
      subscribedFeeds: defaultFeeds,
      feedDetails: JSON.parse(localStorage.getItem(FEED_DETAILS_KEY)) || []
    };
  } else {
    return {
      subscribedFeeds: JSON.parse(localStorage.getItem(SUBSCRIBED_FEEDS_KEY)),
      feedDetails: JSON.parse(localStorage.getItem(FEED_DETAILS_KEY)) || []
    };
  }
}

function setSubscribedFeeds(feeds) {
  feedList.subscribedFeeds = feeds;
  localStorage.setItem(SUBSCRIBED_FEEDS_KEY, JSON.stringify(feeds));
}

function getDiscoveredFeeds() {
  if (!localStorage.getItem(DISCOVERED_FEEDS_KEY)) {
    setDiscoveredFeeds(defaultFeeds);
    return {
      discoveredFeeds: defaultFeeds,
      feedDetails: JSON.parse(localStorage.getItem(FEED_DETAILS_KEY)) || []
    };
  } else {
    return {
      discoveredFeeds: JSON.parse(localStorage.getItem(DISCOVERED_FEEDS_KEY)),
      feedDetails: JSON.parse(localStorage.getItem(FEED_DETAILS_KEY)) || []
    };
  }
}

function setDiscoveredFeeds(feeds) {
  feedList.discoveredFeeds = feeds;
  localStorage.setItem(DISCOVERED_FEEDS_KEY, JSON.stringify(feeds));
}

function setNtpPermission(permission) {
  try {
    localStorage.setItem("NTP_PERMISSION", permission);
    console.log(`NTP_PERMISSION set to ${permission}`);
  } catch (error) {
    console.error("Failed to set NTP_PERMISSION:", error);
  }
}

function getNtpPermission() {
  try {
    let permission = localStorage.getItem("NTP_PERMISSION");
    if (permission === null) {
      permission = NTP_PERMISSION_DEFAULT;
      setNtpPermission(permission);
    }
    return permission;
  } catch (error) {
    console.error("Failed to get NTP_PERMISSION:", error);
    return NTP_PERMISSION_DEFAULT;
  }
}
