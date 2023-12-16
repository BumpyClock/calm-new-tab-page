// Path: scripts.js
const SUBSCRIBED_FEEDS_KEY = "subscribedFeeds";
const FEED_DISCOVERY_KEY = "feedDiscoveryPref"; // By default feed discovery is enabled
const FEED_DETAILS_KEY = "feedDetails";
const SEARCH_PREFERENCE_KEY = "searchPref";
const DEFAULT_API_URL = "https://rss.bumpyclock.com";
const feedContainer = document.getElementById("feed-container");
const welcomePage = document.getElementById("welcome-page");
const settingsPage = document.getElementById("settings-page");
const refreshTimer = 15 * 60 * 1000; //fifteen minutes
const NTP_PERMISSION_DEFAULT = false;
var NTP_PERMISSON;

defaultFeeds = [
  "http://www.theverge.com/rss/index.xml",
  "https://www.vox.com/rss/index.xml",
];

// JSON array for holding default feeds url array
let feedList = {
  subscribedFeeds: [],
  suggestedFeeds: [],
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

const debouncedLayout = debounce(() => {
  msnry.layout();
},300);


chrome.runtime.onInstalled.addListener((details) => {
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

//Create an empty feedcache object. Store feeds here once received for the first time
let feedsCache = null;
let cachedCards = null; // Store the cards in an array to avoid re-creating them for every new tab
let initialLoad = true;
// Create a BroadcastChannel object
const channel = new BroadcastChannel("rss_feeds_channel");
const CARD_CACHE_NAME = "card-items-cache";

// Declare a cache object outside the showReaderView function
const siteInfoCache = {};
let mostVisitedSitesCache = null;

let lastRefreshed = new Date().getTime(); // Get the current timestamp
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
  if(welcomePage){
    setupWelcomePage();
  
    setGreeting();
  
}
  // setGreeting();
  if (feedContainer) {
    // Main page
    setupSearch();
 lazySizes.cfg.expand = 1000;
lazySizes.cfg.preloadAfterLoad = true;
lazySizes.cfg.loadMode = 2;
// lazySizes.cfg.expFactor = 2;
lazySizes.init();

    await initializeMostVisitedSitesCache();
    await fetchBingImageOfTheDay();
    window.addEventListener('resize', debouncedLayout);

    cachedCards = await getCachedRenderedCards();
    if (cachedCards !== null) {
      const feedContainer = document.getElementById("feed-container");
      feedContainer.innerHTML = cachedCards;
      // setupParallaxEffect();
      initializeMasonry();
      reapplyEventHandlersToCachedCards();
      feedContainer.style.opacity = "1"; // apply the fade-in effect
      // bgImageScrollHandler();
    } else {
      console.log("rendering feed from scratch");
      await loadSubscribedFeeds();
    }
  } else if(settingsPage) {
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
  // console.log(`searchPref:  ${searchPref}`);
  try {
    // console.log("searchPref: ", searchPref);
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
  localStorage.removeItem("renderedCards");
  localStorage.removeItem("mostVisitedSitesCache");
});

function shouldRefreshFeeds() {
  const currentTimestamp = new Date().getTime();

  // If lastRefreshed isn't set or is older than 15 minutes, refresh
  if (!lastRefreshed || currentTimestamp - lastRefreshed > refreshTimer) {
    return true;
  }
  return false;
}

async function autoRefreshFeed() {
  // Assuming loadSubscribedFeeds is the function that fetches and renders the feed
  console.log("AutoRefresh triggered auto Refreshing Feeds");
  await refreshFeeds();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "readableContentFetched") {
    const article = message.article;
    // Update the modal window with the readable content
  }
});



async function clearOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name !== CARD_CACHE_NAME)
      .map((name) => caches.delete(name))
  );
}

async function loadSubscribedFeeds() {
  // await showLoadingState();
  const feedContainer = document.getElementById("feed-container");
  feedContainer.innerHTML = "";
  if (!shouldRefreshFeeds() && feedsCache) {
    console.log("Using cached feeds");
    // Use cached feeds if available and no need to refresh
    renderFeed(cachedCards);
    setLastRefreshedTimestamp(new Date(lastRefreshed));
  } else {
    await refreshFeeds();
  }
}

async function refreshFeeds() {
  const { subscribedFeeds: tempFeedList, feedDetails: tempFeedDetails } =
    getSubscribedFeeds();
  feedList.subscribedFeeds = tempFeedList;
  console.log(feedList.subscribedFeeds);
  const serviceWorker = navigator.serviceWorker.controller;
  if (serviceWorker) {
    lastRefreshed = new Date().getTime();
    console.log(
      "Sending message to service worker to fetch feeds",
      feedList.subscribedFeeds
    );
    serviceWorker.postMessage({
      action: "fetchRSS",
      feedUrls: feedList.subscribedFeeds,
    });
  } else {
    console.error("Service worker is not active or not controlled.");
  }
}
async function updateDisplayOnNewTab() {
  const cachedCards = await getCachedRenderedCards();
  if (cachedCards) {
    renderFeed(cachedCards);
    // setupParallaxEffect();
  } else {
    loadSubscribedFeeds();
  }
}

function initializeMasonry() {
  // Initialize Masonry after all cards are loaded
 msnry = new Masonry(feedContainer, {
    // options
    itemSelector: ".card", // Use your card's class
    columnWidth: ".card", // The width of each column, you can set this as needed
    gutter: 12, // Space between items, you can set this as needed
    fitWidth: true,
  });
  document.querySelectorAll('.masonry-item').forEach(item => {
    item.addEventListener('load', () => {
      msnry.layout();
      setupParallaxEffect(item.parentElement.parentElement);
      item.parentElement.classList.remove('loading');
    });
  });
}

function insertGridSizer() {
  const feedContainer = document.getElementById("feed-container");
  const gridSizer = document.createElement("div");
  gridSizer.className = "grid-sizer";
  const gridItem = document.createElement("div");
  gridItem.className = "card grid-item ";
  // feedContainer.insertBefore(gridItem, feedContainer.firstChild);
  // feedContainer.insertBefore(gridSizer, feedContainer.firstChild);
}

async function renderFeed(cachedCards) {
  console.log("rendering feed from cache");
  const feedContainer = document.getElementById("feed-container");
  feedContainer.innerHTML = cachedCards;
  initializeMasonry();
  await cacheRenderedCards(feedContainer.innerHTML);
  feedContainer.style.opacity = "1"; // apply the fade-in effect
  setLastRefreshedTimestamp(new Date(lastRefreshed));
}

async function renderFeed(feeditems, feedDetails) {
  feedsCache = feeditems;
  let cardCount = 0;

  const feedContainer = document.getElementById("feed-container");
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
  // hideLoadingState();
  //create a refresh animation here to show that feed has been refreshed
  if (feedContainer) {
  feedContainer.innerHTML = "";
  }
  feedContainer.appendChild(fragment);
  await cacheRenderedCards(feedContainer.innerHTML);
  setLastRefreshedTimestamp();
  // Fade-in effect
  feedContainer.style.opacity = "1";
  // Setup parallax effect for each card
  initializeMasonry();
  // setupParallaxEffect();
  insertGridSizer();
}

//parallax effect for image container

function setupParallaxEffect(card) {
  console.log("setting up parallax effect");
    const imageContainer = card.querySelector("#thumbnail-image");

    if (imageContainer) {
      card.addEventListener("mouseover", () => {
        // Zoom in effect
        imageContainer.style.transition = "transform 0.25s ease-in";
        imageContainer.style.transform = "scale(1.05)";
        // imageContainer.style.backgroundPosition = 'center center';
      });

      card.addEventListener("mousemove", (e) => {
        const cardRect = card.getBoundingClientRect();
        const xVal = (e.clientX - cardRect.left) / cardRect.width;
        const yVal = (e.clientY - cardRect.top) / cardRect.height;

        // Translate this into a percentage-based position
        const xOffset = -(xVal - 0.5) * 20; // Adjust for desired effect strength
        const yOffset = -(yVal - 0.5) * 20;

        // Apply the effect to the image container's background
        imageContainer.style.objectPosition = `${50 + xOffset}% ${
          50 + yOffset
        }%`;
      });

      card.addEventListener("mouseleave", () => {
        // Reset the background position when the mouse leaves the card
        imageContainer.style.transform = "scale(1)";
        imageContainer.style.backgroundPosition = "center center";
      });
    }
}

async function cacheRenderedCards(htmlContent) {
  try {
    localStorage.setItem("renderedCards", htmlContent);
  } catch (error) {
    console.error("Error saving cards to local storage:", error);
  }
}

async function getCachedRenderedCards() {
  try {
    console.log("Checking cache for rendered cards");
    if (localStorage.getItem("renderedCards")) {
      return localStorage.getItem("renderedCards");
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting cards from local storage:", error);
  }
}

navigator.serviceWorker.addEventListener("message", async function (event) {
  if (event.data.action === "rssUpdate") {
    // console.log("Received RSS update from service worker,rendering feed");
    // hideLoadingState();
    let response = JSON.parse(event.data.rssData);
    console.log(`feed refresh from service worker: ${response}`);
    const { feedDetails, feedItems } = processRSSData(response);
    setFeedDetails(feedDetails);
    setFeedItems(feedItems);
    try{
      await renderFeed(feedItems, feedDetails).catch((error) => {
      console.error("Error rendering the feed:", error);
    });}
    catch(error){
      console.log("feed container not found:", error);
    }
  }
});
async function getWebsiteTitle(url) {
  try {
    console.log("getting website title for;" + url);
    const parsedUrl = new URL(url);
    const rootDomain = `${parsedUrl.protocol}//${parsedUrl.host}`;

    const response = await fetch(rootDomain);
    const tempElement = document.createElement("div");
    const text = await response.text();
    console.log("text: ", text);
    // const matches = text.match(/<title>(.*?)<\/title>/i);
    const matches = text.match(/<title>(.*?)<\/title>/is);
    // console.log("matches: ", matches);
    tempElement.innerHTML = matches && matches[1] ? matches[1] : rootDomain;
    // console.log(`Website title for ${url}: ${tempElement.textContent}`);

    return tempElement.textContent;
  } catch (e) {
    console.error("Failed to get website title:", url, e);
    return url;
  }
}

//listen for messages from broadcast channel
channel.addEventListener("message", (event) => {
  if (event.data.action === "shareFeeds" && event.data.feeds) {
    const currentTimestamp = new Date().getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    if (currentTimestamp - event.data.lastRefreshed > fifteenMinutes) {
      // Refresh the feed
      loadSubscribedFeeds();
    } else {
      const { feedDetails, feedItems } = processRSSData(response);
      if(document.getElementById("#feed-container")){
      renderFeed(feedDetails, feedItems);
      setLastRefreshedTimestamp(new Date(event.data.lastRefreshed));}
    }
  }
});

function processRSSData(rssData) {
  // Initialize arrays to hold the processed feed details and items
  let feedDetails = [];
  let feedItems = [];
  //print rssData JSON object to console, convert to string before logging

  // Check if the rssData object has the 'feedDetails' and 'items' arrays
  if (rssData && rssData.feedDetails && rssData.items) {
    // Process the feed details
    feedDetails = rssData.feedDetails.map((feed) => ({
      siteTitle: feed.siteTitle,
      feedTitle: feed.feedTitle,
      feedUrl: feed.feedUrl, // Assuming 'feedUrl' should be the 'link' from the feed details
      description: feed.description,
      author: feed.author,
      lastUpdated: feed.lastUpdated,
      lastRefreshed: feed.lastRefreshed,
      favicon: feed.favicon,
    }));

    // Process the feed items
    feedItems = rssData.items.map((item) => ({
      id: item.id,
      title: item.title,
      siteTitle: item.siteTitle,
      feedUrl: item.feedUrl,
      feedTitle: item.feedTitle,
      favicon: item.favicon,
      thumbnail: item.thumbnail,
      link: item.link,
      author: item.author,
      published: item.published, // Convert timestamp to ISO string
      created: item.created, // Convert timestamp to ISO string
      category: item.category,
      content: item.content,
      media: item.media,
      enclosures: item.enclosures,
      podcastInfo: item.podcastInfo,
    }));

    feedItems.forEach((item) => {
      if (item.published) {
        item.published = new Date(item.published).toISOString();
        // console.log(`item.published: ${item.published} converts to ${new Date(item.published)}`);
      }
      if (item.created) {
        item.created = new Date(item.created).toISOString();
      }
      if (!item.published) {
        item.published = item.created;
      }
    });
    if (feedItems.length > 0) {
      feedItems.sort((a, b) => new Date(b.published) - new Date(a.published));
    }
  }
  // Return the processed data
  return { feedDetails, feedItems };
}

async function createCard(item) {
  const docFrag = document.createDocumentFragment();
  const card = document.createElement("div");
  var tempElement = document.createElement("div");
  card.className = "card";

  // Image container
  const imageContainer = document.createElement("div");
  imageContainer.className = "image-container loading";
  

  // Card background
  const cardbg = document.createElement("div");
  cardbg.className = "card-bg";
  

  // Set thumbnail URL
  let thumbnailUrl = item.thumbnail;

  if (Array.isArray(item.thumbnail)) {
    //parse the array and get the first item that has a url or link property
    for (const thumbnail of item.thumbnail) {
      if (thumbnail.url) {
        thumbnailUrl = thumbnail.url;
        break;
      } else if (thumbnail.link) {
        thumbnailUrl = thumbnail.link;
        break;
      }
    }
  }
  if (thumbnailUrl) {
    imageContainer.innerHTML = `<img data-src="${thumbnailUrl}" id="thumbnail-image" alt="${item.siteTitle} Thumbnail" class="thumbnail-image lazyload masonry-item">`;
    cardbg.innerHTML = `<div class=noise></div><img data-src="${thumbnailUrl}" alt="${item.siteTitle} Thumbnail" class="card-bg lazyload">`;
    docFrag.appendChild(imageContainer);
    docFrag.appendChild(cardbg);
  }

  // Text content container
  const textContentDiv = document.createElement("div");
  textContentDiv.classList.add("text-content");

  // Website information
  const websiteInfoDiv = document.createElement("div");
  websiteInfoDiv.className = "website-info";
  if (!thumbnailUrl) {
    websiteInfoDiv.style.marginTop = "12px";
  }

  // Favicon
  const favicon = document.createElement("img");
  favicon.src = item.favicon;
  favicon.alt = `${item.siteTitle} Favicon`;
  favicon.className = "site-favicon";
  websiteInfoDiv.appendChild(favicon);

  // Website name
  const websiteName = document.createElement("span");
  tempElement.innerHTML = item.feedTitle || item.siteTitle;
  websiteName.textContent = tempElement.textContent;
  websiteInfoDiv.appendChild(websiteName);
  textContentDiv.appendChild(websiteInfoDiv);

  // Title
  const title = document.createElement("h3");
  tempElement.innerHTML = item.title;
  title.textContent = tempElement.textContent;
  textContentDiv.appendChild(title);

  // Description
  if (item.content) {
    try {
      const snippet = document.createElement("p");
      snippet.className = "description";

      // Sanitize item.content
      const sanitizedContent = DOMPurify.sanitize(item.content);

      // Check sanitizedContent for SVG elements before setting it as the innerHTML of tempElement
      const svgRegex = /<svg.*?>.*?<\/svg>|<path.*?>.*?<\/path>/g;
      if (svgRegex.test(sanitizedContent)) {
        tempElement.textContent = "";
      } else {
        tempElement.innerHTML = sanitizedContent;
        snippet.textContent = tempElement.textContent;
        textContentDiv.appendChild(snippet);
      }
    } catch (error) {
      console.log(`Error creating content snippet for : ${item.content} `, error);
    }
  }

  // Publication date and time
  const date = new Date(item.published);
  const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  const details = document.createElement("div");
  details.className = "date";
  details.textContent = dateString;
  textContentDiv.appendChild(details);

  // Description
  if (!thumbnailUrl && item.description) {
    const description = document.createElement("div");
    description.className = "description long-description";
    description.textContent = item.description;
    textContentDiv.appendChild(description);
  }

  // Read more link
  const readMoreLink = document.createElement("a");
  readMoreLink.href = item.link;
  readMoreLink.target = "_blank";
  readMoreLink.textContent = "Read more";
  readMoreLink.className = "read-more-link";
  textContentDiv.appendChild(readMoreLink);

  // Event handler for card click
  applyCardEventHandlers(card, item.link);

  // Append text content to the card
  docFrag.appendChild(textContentDiv);

  // Append the document fragment to the card
  card.appendChild(docFrag);

  return card;
}

function applyCardEventHandlers(card, url) {
  // Event listener for card click
  try{
    
   
    card.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() !== "a") {
        showReaderView(url);}
     
  
});}
catch(error){
  console.log(error, "error in applyCardEventHandlers", url);
}
}

function reapplyEventHandlersToCachedCards() {
  console.log("reapplying event handlers to cached cards");
  let eventHandlersRestored = 0;
  const feedContainer = document.getElementById("feed-container");
  const cards = feedContainer.querySelectorAll(".card");
  cards.forEach((card) => {
    const linkURL = card.querySelector("a").href; // Example: getting the URL from the card's read more link
    applyCardEventHandlers(card, linkURL);
    eventHandlersRestored++;
  });
  console.log(`Restored ${eventHandlersRestored} event handlers`);
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

  searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      searchButton.click();
    }
  });
}

// Add this function to remove a feed
function removeFeed(feedURL) {
  const feeds = getSubscribedFeeds().subscribedFeeds;
  const updatedFeeds = feeds.filter((url) => url !== feedURL);
  setSubscribedFeeds(updatedFeeds);
}

async function showReaderView(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const pure = DOMPurify.sanitize(html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(pure, "text/html");
    const reader = new Readability(doc);
    const article = reader.parse();
    const item = findItemFromUrl(getFeedItems(), url);

    if (article) {
      const readerViewModal = createReaderViewModal(article);
      document.body.appendChild(readerViewModal);
      setTimeout(() => {
        readerViewModal.classList.add("visible");
      }, 10);
      toggleBodyScroll(false);

      // Add website name and favicon
      const websiteInfoDiv = document.createElement("div");
      websiteInfoDiv.className = "website-info";

      const favicon = document.createElement("img");
      const mainDomain = new URL(url).hostname;
      favicon.src = item.favicon;
      favicon.alt = `${mainDomain} Favicon`;
      favicon.className = "site-favicon";
      websiteInfoDiv.appendChild(favicon);

      const websiteName = document.createElement("span");
      websiteName.textContent = item.siteTitle;
      websiteInfoDiv.appendChild(websiteName);

      readerViewModal
        .querySelector("#website-info-placeholder")
        .appendChild(websiteInfoDiv);

      // Check if content overflows
      const contentHeight = readerViewModal.querySelector(
        ".reader-view-page-text"
      );
      const contentContainerHeight = readerViewModal.querySelector(
        ".reader-view-content"
      );
      const progressRing = document.getElementById("progress-ring");
      if (contentHeight.clientHeight < contentContainerHeight.clientHeight) {
        progressRing.style.display = "none";
      }
    } else {
      console.error("Failed to fetch readable content.");
    }
  } catch (error) {
    console.error("Error fetching the page content:", error);
  }
}
function findItemFromUrl(feedItems, url) {
  for (let item of feedItems) {
    if (item.link === url) {
      return item;
    }
  }
  return null; // return null if no matching item is found
}

function createReaderViewModal(article) {
  const modal = document.createElement("div");
  modal.className = "reader-view-modal";
  modal.innerHTML = `
  <div class="noise"></div>
    <div class="reader-view-content ">
      
      <div class="reader-view-page-content">
        <div class="reader-view-header">
          <span class="reader-view-close material-symbols-rounded">close</span>
          <h1 class="reader-view-title"><span id="website-info-placeholder"></span>${
            article.title
          }</h1>
          ${
            article.byline
              ? `<h2 class="reader-view-author">${article.byline}</h2>`
              : ""
          }
          <p class="reader-view-reading-time">${estimateReadingTime(
            article.textContent
          )} minutes</p>
          <hr class="solid">
        </div>
        <div class="reader-view-page-text">
          <div class="reader-view-article">${article.content}</div>
        </div>
      </div>
      <div id="progress-ring" class="progress-indicator-container"></div>
    </div>
    
  `;

   modal.querySelector(".reader-view-close").onclick = () => {
    modal.style.opacity = "0";
modal.addEventListener('transitionend', function() {
    modal.remove();
}, { once: true }); // The listener is invoked only once and then it's removed    toggleBodyScroll(true);
  };
  modal.addEventListener("click", (event) => {
    const readerViewContent = modal.querySelector(".reader-view-content");
    

    if (
      !readerViewContent.contains(event.target)
    ) {
      modal.style.opacity = "0";
      modal.addEventListener('transitionend', function() {
        modal.remove();
    }, { once: true });
      toggleBodyScroll(true);
    }
  });

  const progressIndicator = createCircularProgressIndicator();
  modal
    .querySelector(".progress-indicator-container")
    .appendChild(progressIndicator);
  const progressCircle = progressIndicator.querySelector(
    ".progress-circle__progress"
  );
  const pageText = modal.querySelector(".reader-view-content");
  pageText.addEventListener("scroll", () =>
    updateReadingProgress(progressCircle, pageText)
  );

  return modal;
}

//Reading progress indicator code

function createCircularProgressIndicator() {
  const progressIndicator = document.createElement("div");
  progressIndicator.className = "progress-indicator";

  progressIndicator.innerHTML = `
    <svg id="progress-ring" class="progress-circle" viewBox="0 0 36 36">
      <circle class="progress-circle__background" cx="18" cy="18" r="15.9155" stroke-width="2"></circle>
      <circle class="progress-circle__progress" cx="18" cy="18" r="15.9155" stroke-width="2" stroke-dasharray="100" stroke-dashoffset="100"></circle>
    </svg>
  `;

  return progressIndicator;
}

function updateReadingProgress(progressCircle, pageText) {
  const scrollPosition = pageText.scrollTop;
  const maxScroll = pageText.scrollHeight - pageText.clientHeight;

  const progressPercentage = (scrollPosition / maxScroll) * 100;

  setCircularProgress(progressCircle, progressPercentage);
}

function setCircularProgress(progressIndicator, progressPercentage) {
  const radius = progressIndicator.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  const offset = circumference - (progressPercentage / 100) * circumference;
  progressIndicator.style.strokeDashoffset = offset;
}

//function to estimate reading time
function estimateReadingTime(text) {
  const wordsPerMinute = 183; // Adjust this value based on your preferred reading speed
  const words = text.trim().split(/\s+/).length;
  const readingTimeInMinutes = Math.ceil(words / wordsPerMinute);

  return readingTimeInMinutes;
}

function toggleBodyScroll(isEnabled) {
  if (isEnabled) {
    document.body.style.overflow = "";
  } else {
    document.body.style.overflow = "hidden";
  }
}

// Show Top Sites
async function initializeMostVisitedSitesCache() {
  mostVisitedSitesCache = await new Promise((resolve) => {
    chrome.topSites.get(async (sites) => {
      const siteCards = await Promise.all(
        sites
          .filter((site) => !site.url.startsWith("chrome-extension://"))
          .slice(0, 10)
          .map(async (site) => {
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
      throw new Error(response.statusText);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    try {
      const response = await fetch(`https://icon.horse/icon/${mainDomain}`);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.log("Error fetching favicon from both sources");
    }
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

function setLastRefreshedTimestamp() {
  const timestampDiv = document.getElementById(
    "last-refreshed-timestamp-container"
  );
  const now = new Date();
  timestampDiv.textContent = `Last refreshed: ${now.toLocaleTimeString()}`;
}

async function fetchBingImageOfTheDay() {
  try {
    const response = await fetch(
      "https://www.bing.com/HPImageArchive.aspx?resoultion=3840&format=js&image_format=webp&idx=random&n=1&mkt=en-US"
    );
    const data = await response.json();
    let imageUrl = "https://www.bing.com" + data.images[0].url;
    imageUrl = imageUrl.replace(/1920x1080/g, "UHD");
    console.log(imageUrl);

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
  console.log(`adding bg-scroll event handler`);
  window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    const blurIntensity = Math.min(scrollPosition / 100, 10);
    const darkIntensity = Math.min(scrollPosition / 100, 0.5); // Adjust the values as per your preference
    const bgContainer = document.querySelector(".background-image-container");
    // bgContainer.style.filter = `blur(${blurIntensity}px) brightness(${
    //   1 - darkIntensity
    // }) grayscale(100%)`;
    // const bgContainer = document.getElementById(".background-image-container");
    bgContainer.style.filter = `brightness(${1 - darkIntensity})`;
  });
}

//Settings page code

async function setupSubscriptionForm() {
  const form = document.getElementById("subscription-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const feedURL = form.elements["feed-url"].value;
    const feeds = getSubscribedFeeds();
    // console.log(feeds);
    feeds.subscribedFeeds.push(feedURL);
    console.log(`Settings: New feed added: ${feeds.subscribedFeeds}`);
    console.log(feeds.subscribedFeeds);
    setSubscribedFeeds(feeds.subscribedFeeds);
    form.reset();
    await refreshFeeds();
    await displaySubscribedFeeds();
    setupUnsubscribeButtons();

    
  });
}

function setupUnsubscribeButton(elem,feedUrl) {
  elem.addEventListener("click", () => {
    removeFeed(feedUrl);
    console.log(`Removing feed: ${feedUrl}`);
    displaySubscribedFeeds();

  });

}

function setupBackButton() {
  const backButton = document.getElementById("back-to-main");
  backButton.addEventListener("click", () => {
    window.location.href = "newtab.html";
    //refresh the feeds
  });
}

async function displaySubscribedFeeds() {
  const { subscribedFeeds: feeds, feedDetails: feedDetails } =
    getSubscribedFeeds();
  const list = document.getElementById("subscribed-feeds-list");
  const listfragment = document.createDocumentFragment();
  if (list !== null) {
    list.innerHTML = ""; // Clear the list
    list.style.visibility = "hidden";
    list.style.height = "0px";
  }

  // Assuming feedDetails is an array of objects with detailed information for each feed
  feedDetails.forEach(async (detail, index) => {
    const feedURL = feeds[index]; // Corresponding URL from feeds array
    var tempElement = document.createElement("div");
    const docFragment = document.createDocumentFragment();
    if (feedURL != null) {
      const listItem = document.createElement("div");
      listItem.className = "list-item";
      const noiseLayer = document.createElement("div");
      noiseLayer.className = "noise";
      
      const bgImageContainer = document.createElement("div");
      bgImageContainer.className = "bg";
      const bgImage = document.createElement("img");
bgImage.setAttribute('data-src', detail.favicon);   
   bgImage.className = "bg lazyload";
      bgImageContainer.appendChild(bgImage);
      bgImageContainer.appendChild(noiseLayer);
      const websiteInfo = document.createElement("div");
      websiteInfo.className = "website-info";

      // Use details from feedDetails array
      const favicon = document.createElement("img");
      favicon.src =
        detail.favicon || (await getSiteFavicon(new URL(feedURL).hostname)); // Use the favicon from feedDetails if available
      favicon.alt = `${detail.siteTitle} Favicon`;
      favicon.className = "site-favicon";
      docFragment.appendChild(favicon);

      const websiteName = document.createElement("h3");
      tempElement.innerHTML = detail.siteTitle || detail.feedTitle;
      websiteName.textContent = tempElement.textContent; // Use the siteTitle from feedDetails
      websiteInfo.appendChild(websiteName);
      docFragment.appendChild(websiteInfo);

      const removeButton = document.createElement("button");
      const removeButtonText = document.createElement("p");
      removeButtonText.textContent = "Unsubscribe";
      removeButtonText.className = "unsubscribe-button";
      removeButton.appendChild(removeButtonText);
      removeButton.className = "remove-feed-button";
      setupUnsubscribeButton(removeButton, feedURL);

      docFragment.appendChild(removeButton);
      docFragment.appendChild(bgImageContainer);

      listItem.appendChild(docFragment);
      if (list !== null) {
        list.appendChild(listItem);
      }
    }
  });

  // Since feedDetails.forEach is non-blocking and we're awaiting inside it,
  // we need to handle the visibility change after all async operations have completed.
  Promise.all(
    feedDetails.map(async (detail, index) => {
      // any async operation here
    })
  ).then(() => {
    list.style.visibility = "visible";
    list.style.height = "auto";
    list.appendChild(listfragment);
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

function setupFeedDiscoveryToggle() {
  const feedDiscoveryToggle = document.getElementById("feed-discovery-toggle");

  // Initialize the toggle state based on stored value
  feedDiscoveryToggle.checked = getFeedDiscovery();
  console.log(feedDiscoveryToggle.checked);

  // Add event listener to toggle button
  feedDiscoveryToggle.addEventListener("change", () => {
    setFeedDiscovery(feedDiscoveryToggle.checked);
  });
}

function setupSearchPreferenceToggle() {
  const searchPreferenceToggle = document.getElementById(
    "search-preference-toggle"
  );

  // Initialize the toggle state based on stored value
  searchPreferenceToggle.checked = getSearchPreference();
  console.log(getSearchPreference());
  console.log(`Search Preference set to ${searchPreferenceToggle.checked}`);

  // Add event listener to toggle button
  searchPreferenceToggle.addEventListener("change", () => {
    setSearchPreference(searchPreferenceToggle.checked);
  });
}

function setupApiUrlFormEventHandler(){
  const apiUrlForm = document.getElementById('apiUrl-form');
  const apiUrlInput = document.getElementById('apiUrl-input');
  apiUrlInput.value = getApiUrl();
  const apiUrlSubmitButton = document.getElementById('apiUrl-submit-button');

  apiUrlForm.addEventListener('submit', (event) => {
    event.preventDefault();
    setApiUrl(apiUrlInput.value);
  });

  apiUrlSubmitButton.addEventListener('click', () => {
    setApiUrl(apiUrlInput.value);
  });
  

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

    setNtpPermission(true);
    console.log(`NTP_PERMISSON set to ${getNtpPermission()}`)
    checkNTPConsent();
    // welcomePage.style.display = "none";
  });
}
function checkNTPConsent(){
  chrome.permissions.request({ permissions: ["chrome_url_overrides.newtab"] }, granted => {
    if (granted) {
      // Activate the new tab override
      chrome.storage.local.set({ newTabOverrideActive: true });
      // Replace the new tab page (e.g., open your extension's new tab page)
      chrome.tabs.query({ url: "chrome://newtab" }, tabs => {
        if (tabs && tabs.length) {
          chrome.tabs.update(tabs[0].id, { url: "index.html" });
        }
      });
    } else {
      // Handle permission denial (e.g., inform user)
    }
  });}
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
      feedDetails: JSON.parse(localStorage.getItem(FEED_DETAILS_KEY)) || [],
    };
  } else {
    return {
      subscribedFeeds: JSON.parse(localStorage.getItem(SUBSCRIBED_FEEDS_KEY)),
      feedDetails: JSON.parse(localStorage.getItem(FEED_DETAILS_KEY)) || [],
    };
  }
}

function setSubscribedFeeds(feeds) {
  feedList.subscribedFeeds = feeds;
  localStorage.setItem(SUBSCRIBED_FEEDS_KEY, JSON.stringify(feeds));
}

function setApiUrl(apiUrl) {
  try {
   
    localStorage.setItem('apiUrl', apiUrl);

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log('Sending message to service worker to set apiUrl');
      navigator.serviceWorker.controller.postMessage({
        action: 'setApiUrl',
        apiUrl: apiUrl
      });
    }
  } catch (error) {
    console.error('Failed to set apiUrl:', error);
  }
}

function getApiUrl() {
  try {
    if (!localStorage.getItem('apiUrl')) {
      setApiUrl(DEFAULT_API_URL);
    }
    return localStorage.getItem('apiUrl');
  } catch (error) {
    console.error('Failed to get apiUrl:', error);
    return null;
  }
}


function setNtpPermission(permission) {
  try {
    localStorage.setItem('NTP_PERMISSION', permission);
    console.log(`NTP_PERMISSION set to ${permission}`);
  } catch (error) {
    console.error('Failed to set NTP_PERMISSION:', error);
  }
}

function getNtpPermission() {
  try {
    let permission = localStorage.getItem('NTP_PERMISSION');
    if (permission === null) {
      permission = NTP_PERMISSION_DEFAULT;
      setNtpPermission(permission);
    }
    return permission;
  } catch (error) {
    console.error('Failed to get NTP_PERMISSION:', error);
    return NTP_PERMISSION_DEFAULT;
  }
}