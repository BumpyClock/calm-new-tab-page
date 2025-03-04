// Background service worker for Calm New Tab extension
const DEFAULT_API_URL = "https://rss.bumpyclock.com";
let apiUrl = DEFAULT_API_URL;

// Initialize when the extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "welcome.html" });
    chrome.storage.local.set({ 
      feedDiscoveryPref: true,
      searchPref: false,
      apiUrl: DEFAULT_API_URL,
      bingImageCache: null,
      bingImageTimestamp: null
    });
  }
});

// Open options page when the extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

// Listen for messages from the content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "fetchRSS":
      fetchRSSFeeds(message.feedUrls)
        .then(data => sendResponse(data))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Required for async response

    case "discoverFeeds":
      discoverFeeds(message.discoverUrls)
        .then(data => sendResponse(data))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case "fetchBingImage":
      fetchBingImage()
        .then(data => sendResponse(data))
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case "setApiUrl":
      apiUrl = message.apiUrl;
      chrome.storage.local.set({ apiUrl: message.apiUrl });
      sendResponse({ success: true });
      return false;

    case "getApiUrl":
      chrome.storage.local.get("apiUrl", (result) => {
        apiUrl = result.apiUrl || DEFAULT_API_URL;
        sendResponse({ apiUrl });
      });
      return true;
  }
});

/**
 * Fetch RSS feeds from the API
 */
async function fetchRSSFeeds(feedUrls) {
  try {
    const response = await fetch(`${apiUrl}/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls: feedUrls }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feeds: ${response.status}`);
    }

    const data = await response.json();
    
    // Process the RSS data
    const processedData = processRSSData(data);
    
    // Broadcast to all tabs
    broadcastToTabs({
      action: "rssUpdate",
      data: JSON.stringify(processedData)
    });
    
    return processedData;
  } catch (error) {
    console.error("Error fetching RSS feeds:", error);
    throw error;
  }
}

/**
 * Process RSS data from the API
 */
function processRSSData(rssData) {
  // Initialize arrays to hold the processed feed details and items
  const feedDetails = [];
  const items = [];

  if (rssData && rssData.feeds && rssData.items) {
    // Process the feed details
    rssData.feeds.forEach(feed => {
      const { siteTitle, feedTitle, feedUrl, description, author, lastUpdated, lastRefreshed, favicon } = feed;
      feedDetails.push({ siteTitle, feedTitle, feedUrl, description, author, lastUpdated, lastRefreshed, favicon });
    });

    // Process the feed items
    rssData.items.forEach(item => {
      const { id, title, siteTitle, feedUrl, feedTitle, favicon, thumbnail, thumbnailColor, link, author, published, created, category, content, media, enclosures, podcastInfo } = item;
      const publishedDate = published && !isNaN(Date.parse(published)) ? new Date(published).toISOString() : null;
      const createdDate = created && !isNaN(Date.parse(created)) ? new Date(created).toISOString() : null;
      items.push({ id, title, siteTitle, feedUrl, feedTitle, favicon, thumbnail, thumbnailColor, link, author, published: publishedDate, created: createdDate, category, content, media, enclosures, podcastInfo });
    });

    if (items.length > 0) {
      items.sort((a, b) => new Date(b.published) - new Date(a.published));
    }
  }

  // Return the processed data
  return { feedDetails, items };
}

/**
 * Discover feeds from site URLs
 */
async function discoverFeeds(siteUrls) {
  try {
    const response = await fetch(`${apiUrl}/discover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls: siteUrls }),
    });

    if (!response.ok) {
      throw new Error(`Failed to discover feeds: ${response.status}`);
    }

    const data = await response.json();
    
    // Broadcast discovered feeds to all tabs
    broadcastToTabs({
      action: "discoveredFeeds",
      feedUrls: data.feeds.filter(feed => feed.status !== "error").map(feed => feed.feedUrl || feed.url)
    });
    
    return data;
  } catch (error) {
    console.error("Error discovering feeds:", error);
    throw error;
  }
}

/**
 * Fetch Bing image of the day
 */
async function fetchBingImage() {
  try {
    // Check if we have a cached image that's less than 24 hours old
    const result = await chrome.storage.local.get(["bingImageCache", "bingImageTimestamp"]);
    
    if (result.bingImageCache && result.bingImageTimestamp) {
      const timestamp = parseInt(result.bingImageTimestamp);
      const now = new Date().getTime();
      const isLessThan24Hours = now - timestamp < 24 * 60 * 60 * 1000;
      
      if (isLessThan24Hours) {
        return result.bingImageCache;
      }
    }
    
    // Fetch new image
    const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Bing image: ${response.status}`);
    }
    
    const data = await response.json();
    const image = data.images[0];
    
    // Get image as blob
    const imageUrl = `https://www.bing.com${image.url.replace(/1920x1080/g, "UHD")}`;
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    const bingImage = {
      imageBlob,
      title: image.title,
      copyright: image.copyright
    };
    
    // Cache the new image
    chrome.storage.local.set({
      bingImageCache: bingImage,
      bingImageTimestamp: new Date().getTime()
    });
    
    // Broadcast to all tabs
    broadcastToTabs({
      action: "bingImageResponse",
      ...bingImage
    });
    
    return bingImage;
  } catch (error) {
    console.error("Error fetching Bing image:", error);
    throw error;
  }
}

/**
 * Broadcast message to all tabs
 */
async function broadcastToTabs(message) {
  const tabs = await chrome.tabs.query({});
  
  for (const tab of tabs) {
    try {
      // Only send to our extension pages
      if (tab.url && tab.url.startsWith(chrome.runtime.getURL(''))) {
        chrome.tabs.sendMessage(tab.id, message).catch(err => {
          // Ignore errors from tabs that can't receive messages
        });
      }
    } catch (e) {
      // Ignore any errors
    }
  }
}

// Fetch Bing image on service worker startup
fetchBingImage().catch(err => console.error("Failed to preload Bing image:", err));