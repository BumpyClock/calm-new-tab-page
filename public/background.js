// Background service worker for Calm New Tab extension

// Config constants
const DEFAULT_API_URL = "https://api.digests.app";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let apiUrl = DEFAULT_API_URL;

/** Convert thumbnail Url to base64 and create a proxy url for imgproxy */
// const convertThumbnailUrl = async (thumbnailUrl) => {
//   try {
//     const proxyUrl = `https://imgproxy.digests.app/resize:fit/height:600/width:600/`;
//     const format = `.webp`;
//     const base64Url = btoa(thumbnailUrl);
//     const finalUrl = `${proxyUrl}${base64Url}${format}`;
//     return finalUrl;
//   } catch (error) {
//     console.error("Error converting thumbnail URL:", error);
//     return null;
//   }
// };

/** Convert thumbnail Url to base64 and create a proxy url for imgproxy */
/** 
 * Optimizes thumbnail URLs either by modifying CDN parameters or using the image proxy as fallback
 * @param {string} thumbnailUrl - The original thumbnail URL
 * @returns {string} - The optimized URL
 */
const convertThumbnailUrl = async (thumbnailUrl) => {
  try {
    // Return null for undefined or null URLs
    if (!thumbnailUrl) return null;
    
    // Target dimensions
    const targetWidth = 600;
    const targetHeight = 600;
    const targetQuality = 90;
    
    // Parse the URL to work with its components
    let url;
    try {
      url = new URL(thumbnailUrl);
    } catch (e) {
      // If URL parsing fails, use the proxy fallback
      return createProxyUrl(thumbnailUrl);
    }
    
    // Identify common CDN patterns and modify them
    
    // Verge/Vox Media pattern
    if (url.hostname.includes('platform.theverge.com') || 
        url.hostname.includes('cdn.vox-cdn.com')) {
      url.searchParams.set('quality', targetQuality.toString());
      url.searchParams.set('w', targetWidth.toString());
      // Preserve the crop parameter if it exists
      return url.toString();
    }
    
    // WordPress.com (including WordPress.com-hosted sites)
    else if (url.hostname.includes('wordpress.com') || 
             url.hostname.includes('wp.com') || url.pathname.includes('/wp-content/uploads/')) {
      url.searchParams.set('quality', targetQuality.toString());
      url.searchParams.set('w', targetWidth.toString());
      url.searchParams.set('h', targetHeight.toString());
      return url.toString();
    }
    
    // Cloudinary
    else if (url.hostname.includes('cloudinary.com')) {
      // Cloudinary uses path segments for transformations
      const urlParts = url.pathname.split('/');
      const transformIndex = urlParts.findIndex(part => 
        part.startsWith('c_') || part.startsWith('w_') || part.startsWith('h_')
      );
      
      if (transformIndex !== -1) {
        urlParts[transformIndex] = `w_${targetWidth},h_${targetHeight},c_fill,q_${targetQuality}`;
        url.pathname = urlParts.join('/');
        return url.toString();
      }
    }
    
    // Imgix
    else if (url.hostname.includes('imgix.net')) {
      url.searchParams.set('w', targetWidth.toString());
      url.searchParams.set('h', targetHeight.toString());
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('q', targetQuality.toString());
      return url.toString();
    }
    
    // Medium
    else if (url.hostname.includes('medium.com') || url.hostname.includes('miro.medium.com')) {
      // Medium uses max parameter
      url.searchParams.set('q', targetQuality.toString());
      url.searchParams.set('max', targetWidth.toString());
      return url.toString();
    }
    
    // Unsplash
    else if (url.hostname.includes('unsplash.com')) {
      url.searchParams.set('w', targetWidth.toString());
      url.searchParams.set('q', targetQuality.toString());
      return url.toString();
    }
    
    // Check for generic width/height parameters (works for many CDNs)
    if (url.searchParams.has('width') || url.searchParams.has('w') || 
        url.searchParams.has('height') || url.searchParams.has('h')) {
      // Generic width/height parameters
      if (url.searchParams.has('width')) url.searchParams.set('width', targetWidth.toString());
      if (url.searchParams.has('w')) url.searchParams.set('w', targetWidth.toString());
      if (url.searchParams.has('height')) url.searchParams.set('height', targetHeight.toString());
      if (url.searchParams.has('h')) url.searchParams.set('h', targetHeight.toString());
      
      // Handle quality parameter if present
      for (const qualityParam of ['quality', 'q', 'qual']) {
        if (url.searchParams.has(qualityParam)) {
          url.searchParams.set(qualityParam, targetQuality.toString());
          break;
        }
      }
      console.log("Modified URL:", url.toString());
      return url.toString();
    }
    
    // If we couldn't detect a known CDN pattern, use the proxy fallback
    // console.log("Using proxy for unknown URL pattern:", thumbnailUrl);
    // return createProxyUrl(thumbnailUrl);
    return thumbnailUrl;
    
  } catch (error) {
    console.error("Error converting thumbnail URL:", error);
    return thumbnailUrl; // Return original URL on error
  }
};

/**
 * Creates a proxy URL for images that can't be directly optimized
 * @param {string} originalUrl - The original image URL
 * @returns {string} - The proxy URL
 */
const createProxyUrl = (originalUrl) => {
  try {
    const proxyUrl = `https://imgproxy.digests.app/resize:fit/height:600/width:600/`;
    const format = `.webp`;
    const base64Url = btoa(originalUrl);
    return `${proxyUrl}${base64Url}${format}`;
  } catch (error) {
    console.error("Error creating proxy URL:", error);
    return originalUrl;
  }
};


/**
 * Utility functions
 */
const utils = {
  // Converts Blob to Base64 string
  blobToBase64: (blob) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error converting Blob to Base64:", error);
        reject(error);
      }
    });
  },

  // Broadcasts message to all extension tabs
  broadcastToTabs: async (message) => {
    try {
      const tabs = await chrome.tabs.query({});
      const extensionUrl = chrome.runtime.getURL("");

      for (const tab of tabs) {
        try {
          if (tab.url?.startsWith(extensionUrl)) {
            chrome.tabs.sendMessage(tab.id, message).catch(() => {
              // Silently ignore errors from tabs that can't receive messages
            });
          }
        } catch (e) {
          // Ignore any errors for individual tabs
        }
      }
    } catch (error) {
      console.error("Error broadcasting to tabs:", error);
    }
  },
};

/**
 * Fetch with error handling
 */
async function fetchWithErrorHandling(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  return response;
}

/**
 * Bing background image functionality
 */
const bingImageService = {
  fetch: async () => {
    try {
      console.log("Trying to fetch Bing image");
      // Check cache first
      const result = await chrome.storage.local.get([
        "bingImageCache",
        "bingImageTimestamp",
      ]);

      if (result.bingImageCache && result.bingImageTimestamp) {
        const timestamp = parseInt(result.bingImageTimestamp);
        const now = Date.now();
        if (now - timestamp < CACHE_DURATION) {
          console.log("Returning cached Bing image");
          utils.broadcastToTabs({
            action: "bingImageResponse",
            imageBlob: result.bingImageCache.imageBlob,
            title: result.bingImageCache.title,
            copyright: result.bingImageCache.copyright,
          });
          return result.bingImageCache;
        }
      }

      // Fetch new image metadata
      const response = await fetchWithErrorHandling(
        "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US"
      );
      const data = await response.json();

      if (!data.images?.length || !data.images[0].url) {
        throw new Error("No image data found in Bing API response");
      }

      const image = data.images[0];
      const imageUrl = `https://www.bing.com${image.url.replace(
        /1920x1080/g,
        "UHD"
      )}`;

      // Fetch actual image
      let imageResponse;
      try {
        imageResponse = await fetch(imageUrl);
      } catch (error) {
        console.error("Error fetching Bing image:", error);
        throw error;
      }

      if (!imageResponse.ok) {
        console.log(`Failed to fetch Bing image: ${imageResponse.status}`);
        throw new Error(`Failed to fetch Bing image: ${imageResponse.status}`);
      }

      // Get image as blob
      let imageBlob;
      try {
        imageBlob = await imageResponse.blob();
      } catch (error) {
        console.error("Error getting image blob:", error);
        throw error;
      }

      // Convert to Base64
      const base64Image = await utils.blobToBase64(imageBlob);

      if (!base64Image) {
        throw new Error("Failed to convert image to Base64");
      }

      const bingImage = {
        imageBlob: base64Image,
        title: image.title || "Bing Image of the Day",
        copyright: image.copyright || "",
      };

      // Cache the image
      try {
        await chrome.storage.local.set({
          bingImageCache: bingImage,
          bingImageTimestamp: Date.now().toString(),
        });
      } catch (error) {
        console.warn("Failed to cache Bing image:", error);
        // Continue without caching
      }

      // Broadcast the image
      utils.broadcastToTabs({
        action: "bingImageResponse",
        imageBlob: base64Image,
        title: bingImage.title,
        copyright: bingImage.copyright,
      });

      return bingImage;
    } catch (error) {
      console.error("Error in bingImageService.fetch:", error);
      throw error;
    }
  },
};

/**
 * RSS feeds functionality
 */
const rssService = {
  fetch: async (feedUrls) => {
    try {
      console.log("fetchRSS", feedUrls);

      const response = await fetchWithErrorHandling(`${apiUrl}/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: feedUrls }),
      });

      const data = await response.json();
      console.log("RSS data received:", data);

      const processedData = rssService.processData(data);

      utils.broadcastToTabs({
        action: "rssUpdate",
        data: JSON.stringify(processedData),
      });

      return processedData;
    } catch (error) {
      console.error("Error fetching RSS feeds:", error);
      throw error;
    }
  },

  discover: async (siteUrls) => {
    try {
      const response = await fetchWithErrorHandling(`${apiUrl}/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: siteUrls }),
      });

      const data = await response.json();

      const validFeeds = data.feeds
        .filter((feed) => feed.status !== "error")
        .map((feed) => feed.feedUrl || feed.url);

      utils.broadcastToTabs({
        action: "discoveredFeeds",
        feedUrls: validFeeds,
      });

      return data;
    } catch (error) {
      console.error("Error discovering feeds:", error);
      throw error;
    }
  },

   processData: async (rssData) => {
    console.log("Processing RSS data");
    const feedDetails = [];
    const itemPromises = [];  // Store promises instead of direct items
  
    if (rssData.feeds && Array.isArray(rssData.feeds)) {
      rssData.feeds.forEach((feed) => {
        // Extract feed details
        const {
          siteTitle,
          feedTitle,
          feedUrl,
          description,
          author,
          lastUpdated,
          lastRefreshed,
          favicon,
        } = feed;
  
        feedDetails.push({
          siteTitle,
          feedTitle,
          feedUrl,
          description,
          author,
          lastUpdated,
          lastRefreshed,
          favicon,
        });
  
        // Process feed items - create promises for each item
        if (feed.items && Array.isArray(feed.items)) {
          feed.items.forEach((item) => {
            const {
              id,
              title,
              type,
              link,
              author,
              published,
              created,
              category,
              content,
              media,
              enclosures,
              podcastInfo,
              thumbnail,
              thumbnailColor,
            } = item;
  
            // Parse dates
            const publishedDate =
              published && !isNaN(Date.parse(published))
                ? new Date(published).toISOString()
                : null;
  
            const createdDate =
              created && !isNaN(Date.parse(created))
                ? new Date(created).toISOString()
                : null;
  
            // Create a promise for each item that resolves when thumbnail is processed
            const itemPromise = convertThumbnailUrl(thumbnail).then(processedThumbnail => {
              return {
                id: id,
                type: type,
                title: title,
                siteTitle: siteTitle,
                feedUrl: feedUrl,
                feedTitle: feedTitle, // Fixed typo: feedTite -> feedTitle
                favicon: favicon,
                thumbnail: processedThumbnail,
                processedThumbnail: processedThumbnail,
                thumbnailColor: thumbnailColor,
                link: link,
                author: author,
                published: publishedDate,
                created: createdDate,
                category: category,
                content: content,
                media: media,
                enclosures: enclosures,
                podcastInfo: podcastInfo,
              };
            });
            
            itemPromises.push(itemPromise);
          });
        }
      });
  
      // Wait for all item promises to resolve
      const items = await Promise.all(itemPromises);
  
      // Sort items by date (newest first)
      if (items.length > 0) {
        items.sort((a, b) => {
          if (!a.published) return 1;
          if (!b.published) return -1;
          return new Date(b.published) - new Date(a.published);
        });
      }
      
      console.log("🚀 ~ items:", items);
      return { feedDetails, items };
    }
    
    return { feedDetails, items: [] };
  },
};

/**
 * Message handlers
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message.action);

  switch (message.action) {
    case "fetchRSS":
      rssService
        .fetch(message.feedUrls)
        .then((data) => sendResponse(data))
        .catch((error) => sendResponse({ error: error.message }));
      return true; // CRITICAL: Keep message port open for async response

    case "discoverFeeds":
      rssService
        .discover(message.discoverUrls)
        .then((data) => sendResponse(data))
        .catch((error) => sendResponse({ error: error.message }));
      return true; // CRITICAL: Keep message port open for async response

    case "fetchBingImage":
      bingImageService
        .fetch()
        .then((data) => sendResponse(data))
        .catch((error) => sendResponse({ error: error.message }));
      return true; // CRITICAL: Keep message port open for async response

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

  return false;
});

/**
 * Event listeners
 */
// Initialize when extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "welcome.html" });
    chrome.storage.local.set({
      feedDiscoveryPref: true,
      searchPref: false,
      apiUrl: DEFAULT_API_URL,
      bingImageCache: null,
      bingImageTimestamp: null,
    });
  }
});

// Open options page when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
});

// Initialize by fetching Bing image on startup
setTimeout(() => {
  console.log("Initializing background tasks");
  bingImageService.fetch().catch((err) => {
    console.warn("Initial Bing image load failed:", err);
  });
}, 1000);
