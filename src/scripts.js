// Path: scripts.js
const SUBSCRIBED_FEEDS_KEY = "subscribedFeeds";
defaultFeeds = ["http://www.theverge.com/rss/index.xml", "https://www.vox.com/rss/index.xml"];
// JSON array for holding default feeds url array
let feedList = {
  subscribedFeeds: [],
  suggestedFeeds: [],
};
const DEFAULT_FEED_URLS = ["http://www.theverge.com/rss/index.xml", "https://www.vox.com/rss/index.xml"];
const refreshTimer = 15 * 60 * 1000; //fifteen minutes

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

navigator.serviceWorker.addEventListener('controllerchange', function() {
  if (this.controller.state === 'activated') {
    refreshFeeds();
  }
});

//Create an empty feedcache object. Store feeds here once received for the first time
let feedsCache = null;
let cachedCards = null; // Store the cards in an array to avoid re-creating them for every new tab
let initialLoad=true;
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

async function doInitialLoad(){

  if(document.querySelector("#feed-container")) {
  await initializeMostVisitedSitesCache();
await loadSubscribedFeeds();
await fetchBingImageOfTheDay();
// hideSearch();
  }
}

doInitialLoad().then(()=>{
  
  if (document.querySelector("#feed-container")) {
    initialLoad=false;
  console.log("initial load done")
  }

});


document.addEventListener("DOMContentLoaded", async () => {
  const setGreeting = () => {
    const greeting = getGreeting();
    document.title = `${greeting} - New Tab`;
  };
  setGreeting();
  //load most visited sites from cache
  if (document.querySelector("#feed-container")) {
    // Main page
    // hideSearch();

    await initializeMostVisitedSitesCache();
    await fetchBingImageOfTheDay();
    cachedCards = await getCachedRenderedCards();
    if (cachedCards !== null) {
      const feedContainer = document.getElementById("feed-container");
      feedContainer.innerHTML = cachedCards;
      setupParallaxEffect();
      initializeMasonry();
      reapplyEventHandlersToCachedCards();
      feedContainer.style.opacity = "1"; // apply the fade-in effect
    } else {
      console.log("rendering feed from scratch");
     await loadSubscribedFeeds();
    }
  
  } else{
    // Settings page
    setupSubscriptionForm();
    await displaySubscribedFeeds();
    setupBackButton();
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
  const searchContainer = document.getElementById("search-container");
  searchContainer.style.display = "none";
}
function showSearch() {
  const searchContainer = document.getElementById("search-container");
  searchContainer.style.display = "flex";
  handleSearch();
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

function getSubscribedFeeds() {
  if (!localStorage.getItem(SUBSCRIBED_FEEDS_KEY)) {
    setSubscribedFeeds(defaultFeeds);
    return { subscribedFeeds: defaultFeeds, feedDetails: JSON.parse(localStorage.getItem("feedDetails")) || []};
  } else {
    return {subscribedFeeds: JSON.parse(localStorage.getItem(SUBSCRIBED_FEEDS_KEY)), feedDetails: JSON.parse(localStorage.getItem("feedDetails")) || []};
  }
}

function setSubscribedFeeds(feeds) {
  feedList.subscribedFeeds = feeds;
  localStorage.setItem(SUBSCRIBED_FEEDS_KEY, JSON.stringify(feeds));
}

async function clearOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.filter((name) => name !== CARD_CACHE_NAME).map((name) => caches.delete(name)));
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
  const {subscribedFeeds: tempFeedList, feedDetails: tempFeedDetails} = getSubscribedFeeds();
  feedList.subscribedFeeds = tempFeedList;
  console.log(feedList.subscribedFeeds);
  const serviceWorker = navigator.serviceWorker.controller;
  if (serviceWorker) {
    lastRefreshed = new Date().getTime();
    console.log("Sending message to service worker to fetch feeds", feedList.subscribedFeeds);
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
    setupParallaxEffect();
  } else {
    loadSubscribedFeeds();
  }
}

function initializeMasonry() {
  // Initialize Masonry after all cards are loaded
  var feedContainer = document.querySelector('#feed-container');
  var msnry = new Masonry(feedContainer, {
    // options
    itemSelector: '.card', // Use your card's class
    columnWidth: '.card', // The width of each column, you can set this as needed
    gutter: 12, // Space between items, you can set this as needed
    fitWidth: true
  });
  // msnry.imagesloaded().progress( function() {
  //   msnry.layout();
  // });
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
  feedContainer.innerHTML = "";


  feedContainer.appendChild(fragment);
  await cacheRenderedCards(feedContainer.innerHTML);
  setLastRefreshedTimestamp();
  // Fade-in effect
  feedContainer.style.opacity = "1";
  // Setup parallax effect for each card
  setupParallaxEffect();
  insertGridSizer();
  initializeMasonry();

}

//parallax effect for image container

function setupParallaxEffect() {
  console.log("setting up parallax effect");
  document.querySelectorAll(".card").forEach((card) => {
    const imageContainer = card.querySelector(".thumbnail-image");

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
      if (imageContainer) {
        imageContainer.style.backgroundPosition = `${50 + xOffset}% ${50 + yOffset}%`;
      }
    });

    card.addEventListener("mouseleave", () => {
      // Reset the background position when the mouse leaves the card
      if (imageContainer) {
        imageContainer.style.transform = "scale(1)";
        imageContainer.style.backgroundPosition = "center center";
      }
    });
  });
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
    console.log("Loading rendered cards from cache" );
    if (localStorage.getItem("renderedCards")) {
    return localStorage.getItem("renderedCards");}
    else {
      return null;
    }
  } catch (error) { 
    console.error("Error getting cards from local storage:", error);
  }
}

navigator.serviceWorker.addEventListener("message", function (event) {
  if (event.data.action === "rssUpdate") {
    // console.log("Received RSS update from service worker,rendering feed");
    // hideLoadingState();
    let response = JSON.parse(event.data.rssData);
    const { feedDetails, feedItems } = processRSSData(response);
    localStorage.setItem("feedDetails", JSON.stringify(feedDetails));
    localStorage.setItem("feedItems", JSON.stringify(feedItems));
    renderFeed(feedItems, feedDetails).catch((error) => {
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
      const { feedDetails, feedItems } = processRSSData(response);
      renderFeed(feedDetails, feedItems);
      setLastRefreshedTimestamp(new Date(event.data.lastRefreshed));
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



async function createCard(item, feedDetails) {
  const docFrag = document.createDocumentFragment();
  const card = document.createElement("div");
  card.className = "card";
  let itemDomain;
  let linkURL; 
  let tempElement;
  tempElement = document.createElement("div");
  let feedDetail;
  // Helper function to find feed detail by hostname
  const findFeedDetailByHostname = (hostname) => {
    return feedDetails.find(fd => new URL(fd.feedUrl).hostname === hostname);
  };
  
  // Find domain and feedDetail
  try {
    if (Array.isArray(item.link)) {
      // Find the first matching domain from the array of links
      // Skip any link where rel is "alternate"
      const matchingLink = item.link.find(linkObj => {
        return linkObj.rel !== "alternate" && findFeedDetailByHostname(new URL(linkObj.href).hostname);
      });
      if (matchingLink) {
        linkURL = matchingLink.href;
        itemDomain = new URL(matchingLink.href).hostname;
        feedDetail = findFeedDetailByHostname(itemDomain);
      }
    } else {
      // Single link case, ensure it's not an "alternate" link
      if (item.link.url && item.link.rel !== "alternate") {
         linkURL = new URL(item.link.href || item.link);
        itemDomain = linkURL.hostname;
        feedDetail = findFeedDetailByHostname(itemDomain);
      } else if (item.link && !item.link.href && item.link.rel !== "alternate") {
        linkURL = new URL(item.link);
        itemDomain = linkURL.hostname;
        feedDetail = findFeedDetailByHostname(itemDomain);
      }
    }
    
  } catch (error) {
    console.error(`Error processing link for item:`, item, error);
    return null; // Exit the function if link processing fails
  }
  
  if (!feedDetail) {
    console.error(`No matching feed detail found for domain: ${itemDomain}`);
    return null; // Exit the function if no matching feed detail is found
  }

  // Website title and favicon URL
  const faviconURL = feedDetail.favicon;

  // Image container
  const imageContainer = document.createElement("div");
  imageContainer.className = "image-container";

  // Thumbnail image
  const thumbnailImage = document.createElement("div");
  thumbnailImage.className = "thumbnail-image";

  // Card background
  const cardbg = document.createElement("div");
  cardbg.className = "card-bg";

  // Set thumbnail URL
  let thumbnailUrl;
  if (item.thumbnail) {
    thumbnailUrl = Array.isArray(item.thumbnail) ? item.thumbnail[0].url : item.thumbnail;
    if (thumbnailUrl) {
      thumbnailImage.style.backgroundImage = `url('${thumbnailUrl}')`;
      cardbg.style.backgroundImage = `url('${thumbnailUrl}')`;
      imageContainer.appendChild(thumbnailImage);
  docFrag.appendChild(imageContainer);
  docFrag.appendChild(cardbg);
    }
    
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
  favicon.src = faviconURL;
  favicon.alt = `${feedDetail.siteTitle} Favicon`;
  favicon.className = "site-favicon";
  websiteInfoDiv.appendChild(favicon);

  // Website name
  const websiteName = document.createElement("span");
  tempElement.innerHTML = feedDetail.siteTitle;
  websiteName.textContent = tempElement.textContent;
  websiteInfoDiv.appendChild(websiteName);
  textContentDiv.appendChild(websiteInfoDiv);

  // Title
  const title = document.createElement("h3");
  tempElement.innerHTML = item.title;
  title.textContent = tempElement.textContent;
  textContentDiv.appendChild(title);

  // Content snippet
  if ( item.content) {
    const snippet = document.createElement("p");
    snippet.className = "description";

  // Create a temporary DOM element and set its innerHTML to the HTML content
  tempElement.innerHTML = item.content;

  // Get the text content of the temporary DOM element
  snippet.textContent = tempElement.textContent;
    textContentDiv.appendChild(snippet);
  }

  // Publication date and time
  const date = new Date(item.published);
  const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  const details = document.createElement("div");
  details.className = "date";
  details.textContent = dateString;
  textContentDiv.appendChild(details);

  // Description
  if (!item.thumbnail && item.description) {
    const description = document.createElement("div");
    description.className = "description long-description";
    description.textContent = item.description;
    textContentDiv.appendChild(description);
  }

  // Read more link , check if it undefined or it contains engadget
  const readMoreLink = document.createElement("a");
  readMoreLink.href = item.link;
  readMoreLink.target = "_blank";
  readMoreLink.textContent = "Read more";
  readMoreLink.className = "read-more-link";
  textContentDiv.appendChild(readMoreLink);
  if (item.link !== null && item.link !== undefined ) {
    
    applyCardEventHandlers(card, item.link); // Apply event handlers to the card

  } 
  // Append text content to the card
  docFrag.appendChild(textContentDiv);

  // Append the document fragment to the card
  card.appendChild(docFrag);

  return card;
}

function applyCardEventHandlers(card, linkURL) {
  // Event listener for card click
  if (linkURL.includes("engadget")) {
    card.addEventListener("click", () => {
      window.open(linkURL, "_blank");
    });
  } else {
  card.addEventListener("click", (e) => {
    if (e.target.tagName.toLowerCase() !== "a") {
      showReaderView(linkURL);
    }
  });
  }
}

function reapplyEventHandlersToCachedCards() {
  console.log("reapplying event handlers to cached cards");
  let eventHandlersRestored = 0;
  const feedContainer = document.getElementById("feed-container");
  const cards = feedContainer.querySelectorAll('.card');
  cards.forEach(card => {

    const linkURL = card.querySelector('a').href; // Example: getting the URL from the card's read more link
    applyCardEventHandlers(card, linkURL);
    eventHandlersRestored++;
  });
  console.log(`Restored ${eventHandlersRestored} event handlers`);
}

async function getWebsiteTitle(url) {
  try {
    const parsedUrl = new URL(url);
    const rootDomain = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const response = await fetch(rootDomain);
    const tempElement = document.createElement("div");
    const text = await response.text();
    const matches = text.match(/<title>(.*?)<\/title>/i);
    tempElement.innerHTML = matches && matches[1] ? matches[1] : url;

    return tempElement.textContent;
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
      favicon.src = await getsiteFavicon(mainDomain);
      favicon.alt = `${mainDomain} Favicon`;
      favicon.className = "site-favicon";
      websiteInfoDiv.appendChild(favicon);

      const websiteName = document.createElement("span");
      websiteName.textContent = await getWebsiteTitle(url);
      websiteInfoDiv.appendChild(websiteName);

      readerViewModal.querySelector("#website-info-placeholder").appendChild(websiteInfoDiv);

      // Check if content overflows
      const contentHeight = readerViewModal.querySelector(".reader-view-page-text");
      const contentContainerHeight = readerViewModal.querySelector(".reader-view-content");
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
  modal.className = "reader-view-modal";
  modal.innerHTML = `
    <div class="reader-view-content ">
      
      <div class="reader-view-page-content">
        <div class="reader-view-header">
          <span class="reader-view-close material-symbols-rounded">close</span>
          <h1 class="reader-view-title"><span id="website-info-placeholder"></span>${article.title}</h1>
          ${article.byline ? `<h2 class="reader-view-author">${article.byline}</h2>` : ""}
          <p class="reader-view-reading-time">${estimateReadingTime(article.textContent)} minutes</p>
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
    const selectedTheme = "";
    const readerViewPageText = modal.querySelector(".reader-view-page-content");
    const readerViewSettingsPane = modal.querySelector(".reader-view-settings-pane");
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
    const readerViewSettingsPane = modal.querySelector(".reader-view-settings-pane");

    if (!readerViewContent.contains(event.target) && !readerViewSettingsPane.contains(event.target)) {
      modal.remove();
      toggleBodyScroll(true);
    }
  });

  const progressIndicator = createCircularProgressIndicator();
  modal.querySelector(".progress-indicator-container").appendChild(progressIndicator);
  const progressCircle = progressIndicator.querySelector(".progress-circle__progress");
  const pageText = modal.querySelector(".reader-view-content");
  pageText.addEventListener("scroll", () => updateReadingProgress(progressCircle, pageText));

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
        sites.slice(0, 10).map(async (site) => {
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

function setTopSitesCache (sitecards){
  // console.log(sitecards);
  localStorage.setItem("mostVisitedSites", JSON.stringify(sitecards));
}
function getTopSitesCache (){
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
  const sitefaviconUrl = await getsiteFavicon(mainDomain);
  //send a get request to get the favicon url from http://192.168.1.51:3000/get-favicon?url=${mainDomain}
  siteCard.innerHTML = `
    <a href="${site.url}" class="site-link">
      <div class="background-image-container" style="background-image: url('${sitefaviconUrl}');"></div>
      <img src="${sitefaviconUrl}" alt="${site.title} Favicon" class="site-favicon">
      <div class="site-title"><p>${site.title}</p></div>
    </a>
  `;
  return siteCard;
}

async function getsiteFavicon(mainDomain) {
  try {
    const response = await fetch(`https://www.google.com/s2/favicons?domain=${mainDomain}&sz=256`);
    if (!response.ok) {
      // if HTTP-status is 404-599
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

  const mostVisitedSitesContainer = document.querySelector(".most-visited-sites-container");
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
  const response = await getsiteFavicon(domain);
  localStorage.setItem(`favicon-${domain}`, response.url);
  return dataURL;
}

function setLastRefreshedTimestamp() {
  const timestampDiv = document.getElementById("last-refreshed-timestamp-container");
  const now = new Date();
  timestampDiv.textContent = `Last refreshed: ${now.toLocaleTimeString()}`;
}

// Call the fetchMostVisitedSites function when the DOM is loaded
//document.addEventListener("DOMContentLoaded", initializeMostVisitedSitesCache);

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
    bgContainer.style.backgroundImage = `url(${imageUrl})`;
    const attributionContainer = document.querySelector(".attribution-container");
    attributionContainer.innerHTML = `
        <p class="attribution-title">${title}</p>
        <p class="attribution-copyright">${copyright} | Bing & Microsoft</p>
      `;
  } catch (error) {
    console.error("Failed to fetch Bing image of the day:", error);
  }
}

window.addEventListener("scroll", () => {
  const scrollPosition = window.scrollY || document.documentElement.scrollTop;
  const blurIntensity = Math.min(scrollPosition / 100, 10);
  const darkIntensity = Math.min( scrollPosition /100 , 0.5); // Adjust the values as per your preference
  // const bgContainer = document.querySelector(".background-image-container");
  // bgContainer.style.filter = `blur(${blurIntensity}px) brightness(${
  //   1 - darkIntensity
  // }) grayscale(100%)`;
  const bgContainer = document.querySelector(".background-image-container");
  bgContainer.style.filter = `brightness(${1- darkIntensity})`;
});
