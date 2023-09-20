// Path: scripts.js
const SUBSCRIBED_FEEDS_KEY = "subscribedFeeds";

// default feed url array
const DEFAULT_FEED_URLS = [
  "https://www.vox.com/rss/index.xml",
  "https://www.theverge.com/rss/index.xml",
  "https://www.wired.com/feed/rss"
];

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then(function (registration) {
      console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch(function (error) {
      console.log("Service Worker registration failed:", error);
    });
}

//Create an empty feedcache object. Store feeds here once received for the first time
let feedsCache = null;
let cachedCards = []; // Store the cards in an array to avoid re-creating them for every new tab

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

  setGreeting(); // This was previously defined but never called. You might want to call it.

  if (document.querySelector("#feed-container")) {
    // Main page
    const cachedContent = await getCachedRenderedCards();
    if (cachedContent && shouldRefreshFeeds()) {
      const feedContainer = document.getElementById("feed-container");
      feedContainer.innerHTML = cachedContent;
      feedContainer.style.opacity = "1"; // apply the fade-in effect
    } else {
      loadSubscribedFeeds();
    }
    handleSearch();
  } else {
    // Settings page
    setupSubscriptionForm();
    displaySubscribedFeeds();
    setupBackButton();
    fetchBingImageOfTheDay();
  }

  if (document.querySelector("#settings-button")) {
    document.getElementById("settings-button").addEventListener("click", () => {
      window.location.href = "settings.html";
    });
  }

  setInterval(autoRefreshFeed, 15 * 60 * 1000);
});

function shouldRefreshFeeds() {
  const currentTimestamp = new Date().getTime();
  const fifteenMinutes = 15 * 60 * 1000;

  // If lastRefreshed isn't set or is older than 15 minutes, refresh
  if (!lastRefreshed || currentTimestamp - lastRefreshed > fifteenMinutes) {
    return true;
  }
  return false;
}

async function autoRefreshFeed() {
  // Assuming loadSubscribedFeeds is the function that fetches and renders the feed
  await loadSubscribedFeeds();
}

function getCachedRenderedCards() {
  return localStorage.getItem("renderedCards");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "readableContentFetched") {
    const article = message.article;
    // Update the modal window with the readable content
  }
});

function getSubscribedFeeds() {
  return (
    JSON.parse(localStorage.getItem(SUBSCRIBED_FEEDS_KEY)) || [
      DEFAULT_FEED_URLS
    ]
  );
}

function setSubscribedFeeds(feeds) {
  localStorage.setItem(SUBSCRIBED_FEEDS_KEY, JSON.stringify(feeds));
}

async function clearOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name !== CARD_CACHE_NAME)
      .map((name) => caches.delete(name))
  );
}

async function loadSubscribedFeeds() {
  await showLoadingState();

  if (!shouldRefreshFeeds() && feedsCache) {
    // Use cached feeds if available and no need to refresh
    renderFeed(feedsCache);
    setLastRefreshedTimestamp(new Date(lastRefreshed));
  } else {
    const feeds = getSubscribedFeeds();
    const serviceWorker = navigator.serviceWorker.controller;
    if (serviceWorker) {
      lastRefreshed = new Date().getTime();
      serviceWorker.postMessage({
        action: "fetchRSS",
        feedUrls: feeds
      });
    } else {
      console.error("Service worker is not active or not controlled.");
    }
  }
}

async function renderFeed(feeditems) {
  feedsCache = feeditems;
  const feedContainer = document.getElementById("feed-container");
  const fragment = document.createDocumentFragment();

  for (const item of feeditems) {
    const card = await createCard(item, item.thumbnailUrl);

    if (card instanceof Node) {
      fragment.appendChild(card);
    } else {
      console.error("Card is not a valid DOM Node:", card);
    }
  }
  hideLoadingState();

  feedContainer.appendChild(fragment);
  cacheRenderedCards(feedContainer.innerHTML);
  setLastRefreshedTimestamp();
  // Fade-in effect
  feedContainer.style.opacity = "1";
}

function cacheRenderedCards(htmlContent) {
  try {
    localStorage.setItem("renderedCards", htmlContent);
  } catch (error) {
    console.error("Error saving cards to local storage:", error);
  }
}

navigator.serviceWorker.addEventListener("message", function (event) {
  if (event.data.action === "rssUpdate") {
    // console.log("Received RSS Data:", event.data.rssData);
    // console.log("rendering feed");
    // hideLoadingState();
    let response = JSON.parse(event.data.rssData);
    let feedItems = response.items;
    // Broadcast the feeds to other tabs
    channel.postMessage({
      action: "shareFeeds",
      feeds: feedItems,
      lastRefreshed
    });
    renderFeed(feedItems).catch((error) => {
      console.error("Error rendering the feed:", error);
    });
  }
});

//listen for messages from broadcast channel
channel.addEventListener("message", (event) => {
  if (event.data.action === "shareFeeds" && event.data.feeds) {
    const currentTimestamp = new Date().getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    if (currentTimestamp - event.data.lastRefreshed > fifteenMinutes) {
      // Refresh the feed
      loadSubscribedFeeds();
    } else {
      renderFeed(event.data.feeds);
      setLastRefreshedTimestamp(new Date(event.data.lastRefreshed));
    }
  }
});

function showLoadingState() {
  const feedContainer = document.getElementById("feed-container");
  feedContainer.innerHTML = '<div class="spinner"></div>';
}

function hideLoadingState() {
  const feedContainer = document.getElementById("feed-container");
  feedContainer.innerHTML = "";
}

function setupSubscriptionForm() {
  const form = document.getElementById("subscription-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const feedURL = form.elements["feed-url"].value;
    const feeds = getSubscribedFeeds();
    feeds.push(feedURL);
    setSubscribedFeeds(feeds);

    await loadFeed(feedURL);
    form.reset();
  });
}

function setupBackButton() {
  const backButton = document.getElementById("back-to-main");
  backButton.addEventListener("click", () => {
    window.location.href = "newtab.html";
  });
}

async function createCard(item, thumbnailURL = null) {
  const card = document.createElement("div");
  card.className = "card";
  var website_title = await getWebsiteTitle(item.link);
  if (thumbnailURL) {
    const img = document.createElement("img");
    img.src = thumbnailURL;
    card.appendChild(img);
  }

  const textContentDiv = document.createElement("div");
  textContentDiv.classList.add("text-content");
  // Add website name and favicon
  const websiteInfoDiv = document.createElement("div");
  websiteInfoDiv.className = "website-info";

  const favicon = document.createElement("img");
  const mainDomain = new URL(item.link).hostname;
  favicon.src = `https://icon.horse/icon/${mainDomain}`;
  favicon.alt = `${mainDomain} Favicon`;
  favicon.className = "site-favicon";
  websiteInfoDiv.appendChild(favicon);

  const websiteName = document.createElement("span");
  websiteName.textContent = website_title;
  websiteInfoDiv.appendChild(websiteName);

  textContentDiv.appendChild(websiteInfoDiv);

  const title = document.createElement("h3");
  title.textContent = item.title;
  textContentDiv.appendChild(title);

  if (item.contentSnippet) {
    const snippet = document.createElement("p");
    snippet.className = "description";
    snippet.textContent = item.contentSnippet;
    textContentDiv.appendChild(snippet);
  }

  if (item.link) {
    const date = new Date(item.pubDate);
    const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    const details = document.createElement("p");
    details.textContent = `${dateString}`;
    textContentDiv.appendChild(details);

    if (!thumbnailURL) {
      const description = document.createElement("div");
      description.className = "description long-description";
      const plainTextDescription = item.description.replace(
        /(<([^>]+)>)/gi,
        ""
      ); // Remove HTML tags
      description.innerText = plainTextDescription;
      textContentDiv.appendChild(description);
    }

    const readMoreLink = document.createElement("a");
    readMoreLink.href = item.link;
    readMoreLink.target = "_blank";
    readMoreLink.textContent = "Read more";
    readMoreLink.className = "read-more-link";
    textContentDiv.appendChild(readMoreLink);
  }

  card.appendChild(textContentDiv);
  card.addEventListener("click", (e) => {
    if (e.target.tagName.toLowerCase() !== "a") {
      showReaderView(item.link);
    }
  });

  return card;
}

async function getWebsiteTitle(url) {
  try {
    const parsedUrl = new URL(url);
    const rootDomain = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const response = await fetch(rootDomain);

    const text = await response.text();
    const matches = text.match(/<title>(.*?)<\/title>/i);
    return matches && matches[1] ? matches[1] : url;
  } catch (e) {
    console.error("Failed to get website title:", e);
    return url;
  }
}

// Search code

function handleSearch() {
  const searchInput = document.getElementById("search-input");
  const searchEngineSelect = document.getElementById("search-engine");
  const searchButton = document.getElementById("search-button");

  searchButton.addEventListener("click", () => {
    const query = searchInput.value;
    const searchEngineURL = searchEngineSelect.value;
    const searchURL = searchEngineURL + encodeURIComponent(query);
    window.open(searchURL, "_blank");
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchButton.click();
    }
  });
}

// Add this function to remove a feed
function removeFeed(feedURL) {
  const feeds = getSubscribedFeeds();
  const updatedFeeds = feeds.filter((url) => url !== feedURL);
  setSubscribedFeeds(updatedFeeds);
  displaySubscribedFeeds();
}

async function showReaderView(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const reader = new Readability(doc);
    const article = reader.parse();

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
      favicon.src = `https://icon.horse/icon/${mainDomain}`;
      favicon.alt = `${mainDomain} Favicon`;
      favicon.className = "site-favicon";
      websiteInfoDiv.appendChild(favicon);

      const websiteName = document.createElement("span");
      websiteName.textContent = await getWebsiteTitle(url);
      websiteName.style.fontSize = "10px";
      websiteName.style.fontWeight = "900";
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

function createReaderViewModal(article) {
  const modal = document.createElement("div");
  modal.className = "reader-view-modal light";
  modal.innerHTML = `
    <div class="reader-view-content ">
      
      <div class="reader-view-page-content light ">
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
    <div class="reader-view-settings-pane">
      <label for="theme-select">Theme:</label>
      <select id="theme-select">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="sepia">Sepia</option>
      </select>
    </div>
  `;

  // add event handlers for theme selection

  const themeDropdown = modal.querySelector("#theme-select");
  themeDropdown.addEventListener("change", (event) => {
    const selectedTheme = event.target.value;
    const readerViewPageText = modal.querySelector(".reader-view-page-content");
    const readerViewSettingsPane = modal.querySelector(
      ".reader-view-settings-pane"
    );
    const readerViewContent = modal.querySelector(".reader-view-content");

    // Remove any existing theme class
    readerViewPageText.classList.remove("light", "dark", "sepia");
    readerViewSettingsPane.classList.remove("light", "dark", "sepia");
    readerViewContent.classList.remove("light", "dark", "sepia");

    // Add the selected theme class
    if (selectedTheme === "light") {
      readerViewPageText.classList.add("light");
      readerViewSettingsPane.classList.add("light");
      readerViewContent.classList.add("light");
    } else if (selectedTheme === "dark") {
      readerViewPageText.classList.add("dark");
      readerViewSettingsPane.classList.add("dark");
      readerViewContent.classList.add("dark");
    } else if (selectedTheme === "sepia") {
      readerViewPageText.classList.add("sepia");
      readerViewSettingsPane.classList.add("sepia");
      readerViewContent.classList.add("sepia");
    }
  });

  modal.querySelector(".reader-view-close").onclick = () => {
    modal.remove();
    toggleBodyScroll(true);
  };
  modal.addEventListener("click", (event) => {
    const readerViewContent = modal.querySelector(".reader-view-content");
    const readerViewSettingsPane = modal.querySelector(
      ".reader-view-settings-pane"
    );

    if (
      !readerViewContent.contains(event.target) &&
      !readerViewSettingsPane.contains(event.target)
    ) {
      modal.remove();
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

// Modify displaySubscribedFeeds function
async function displaySubscribedFeeds() {
  const feeds = getSubscribedFeeds();
  const list = document.getElementById("subscribed-feeds-list");
  list.innerHTML = ""; // Clear the list

  for (const feedURL of feeds) {
    if (feedURL != null) {
      const listItem = document.createElement("li");

      // Add website favicon
      const favicon = document.createElement("img");

      const mainDomain = new URL(feedURL).hostname;
      favicon.src = `https://icon.horse/icon/${mainDomain}`;
      favicon.alt = `${mainDomain} Favicon`;
      favicon.className = "site-favicon";
      listItem.appendChild(favicon);

      // Add website name
      const websiteName = document.createElement("span");
      const siteTitle = await getWebsiteTitle(feedURL);
      websiteName.textContent = siteTitle;
      listItem.appendChild(websiteName);

      const removeButton = document.createElement("button");
      removeButton.textContent = "X";
      removeButton.className = "remove-feed-button";
      removeButton.addEventListener("click", () => {
        removeFeed(feedURL);
      });
      listItem.appendChild(removeButton);

      list.appendChild(listItem);
    }
  }
}

// Show Top Sites
async function initializeMostVisitedSitesCache() {
  mostVisitedSitesCache = await new Promise((resolve) => {
    chrome.topSites.get(async (sites) => {
      const siteCards = await Promise.all(
        sites.slice(0, 10).map(async (site) => {
          const siteCard = await createMostVisitedSiteCard(site);
          return siteCard;
        })
      );
      resolve(siteCards);
    });
  });

  // Call fetchMostVisitedSites to display the most visited sites once the cache is initialized
  fetchMostVisitedSites();
}

function createMostVisitedSiteCard(site) {
  const siteUrl = new URL(site.url);
  const mainDomain = siteUrl.hostname;
  const siteCard = document.createElement("div");
  siteCard.className = "site-card";
  siteCard.innerHTML = `
    <a href="${site.url}" class="site-link">
      <img src="https://icon.horse/icon/${mainDomain}" alt="${site.title} Favicon" class="site-favicon">
      <div class="site-title">${site.title}</div>
    </a>
  `;
  return siteCard;
}

function fetchMostVisitedSites() {
  if (!mostVisitedSitesCache) {
    console.error("Most visited sites cache is not initialized");
    initializeMostVisitedSitesCache();

    return;
  }

  const mostVisitedSitesContainer = document.querySelector(
    ".most-visited-sites-container"
  );

  mostVisitedSitesCache.forEach((siteCard) => {
    mostVisitedSitesContainer.appendChild(siteCard.cloneNode(true));
  });
}

//cache favicons for improve perf
async function cacheFavicon(domain) {
  const response = await fetch(`https://icon.horse/icon/${domain}`);
  const blob = await response.blob();
  const dataURL = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
  localStorage.setItem(`favicon-${domain}`, dataURL);
  return dataURL;
}

function setLastRefreshedTimestamp() {
  const timestampDiv = document.getElementById(
    "last-refreshed-timestamp-container"
  );
  const now = new Date();
  timestampDiv.textContent = `Last refreshed: ${now.toLocaleTimeString()}`;
}

async function getFavicon(domain) {
  const cachedFavicon = localStorage.getItem(`favicon-${domain}`);
  if (cachedFavicon) {
    return cachedFavicon;
  } else {
    const fetchedFavicon = await cacheFavicon(domain);
    return fetchedFavicon;
  }
}

// Call the fetchMostVisitedSites function when the DOM is loaded
//document.addEventListener("DOMContentLoaded", initializeMostVisitedSitesCache);
document.addEventListener("DOMContentLoaded", fetchBingImageOfTheDay);

async function fetchBingImageOfTheDay() {
  try {
    const response = await fetch(
      "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US"
    );
    const data = await response.json();
    const imageUrl = "https://www.bing.com" + data.images[0].url;
    const title = data.images[0].title;
    const copyright = data.images[0].copyright;
    const bgContainer = document.querySelector(".background-image-container");
    bgContainer.style.backgroundImage = `url(${imageUrl})`;
    const attributionContainer = document.querySelector(
      ".attribution-container"
    );
    attributionContainer.innerHTML = `
        <p class="attribution-title">${title}</p>
        <p class="attribution-copyright">${copyright} | Bing & Microsoft</p>
      `;
  } catch (error) {
    console.error("Failed to fetch Bing image of the day:", error);
  }
}

window.addEventListener("scroll", () => {
  const scrollPosition =
    window.pageYOffset || document.documentElement.scrollTop;
  const blurIntensity = Math.min(scrollPosition / 100, 10);
  const darkIntensity = Math.min(scrollPosition / 1000, 0.1); // Adjust the values as per your preference
  // const bgContainer = document.querySelector(".background-image-container");
  // bgContainer.style.filter = `blur(${blurIntensity}px) brightness(${
  //   1 - darkIntensity
  // }) grayscale(100%)`;
  const bgContainer = document.querySelector(".background-image-container");
  bgContainer.style.filter = `blur(${blurIntensity}px) grayscale(100%)`;
});

//load most visited sites from cache
initializeMostVisitedSitesCache();
