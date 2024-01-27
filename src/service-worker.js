importScripts(...["/scripts/utils/defaults.js"]);
const ACTION_SET_API_URL = "setApiUrl";
const ACTION_GET_API_URL = "getApiUrl";
const ACTION_DISCOVER_FEEDS = "discoverFeeds";
const ACTION_FETCH_RSS = "fetchRSS";
const ACTION_FETCH_BING_IMAGE = "fetchBingImage";
const BING_CACHE_NAME ='bing-image-cache';
const BING_IMAGE_URL = 'https://www.bing.com/HPImageArchive.aspx?resoultion=3840&format=js&image_format=webp&idx=random&n=1&mkt=en-US';
let bingImageCache = {
  title: "",
  copyright: "",
  imageBlob: null,
  timestamp: null
};

chrome.runtime.onStartup.addListener(function() {
  console.log("chrome.runtime.onStartup clearing stale cache");
  clearCache();
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({'url': chrome.runtime.getURL('newtab.html')});
});

self.addEventListener("message", function (event) {
  switch (event.data.action) {
    case ACTION_SET_API_URL:
      console.log("SW: updating ApiUrl: ", event.data.apiUrl);
      acceptApiUrl(event.data.apiUrl);
      break;
    case ACTION_GET_API_URL:
      console.log("apiUrl: ", apiUrl);
      event.ports[0].postMessage({
        action: ACTION_GET_API_URL,
        apiUrl: getApiUrl(),
      });
      break;
    case ACTION_DISCOVER_FEEDS:
      handleDiscoverFeeds(event);
      break;
    case ACTION_FETCH_RSS:
      fetchRSSFeedAndUpdateCache(event.data.feedUrls);
      break;
    case ACTION_FETCH_BING_IMAGE:
      handleFetchBingImage(event);
      break;
    default:
      console.error("Unknown action: ", event.data.action);
  }
});

function createRequestOptions(urls) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls }),
  };
}

function postMessageToClients(message) {
  self.clients.matchAll().then((clients) => {
    if (clients && clients.length) {
      clients.forEach(client => {
        client.postMessage(message);
      });
    }
  });
}

async function handleFetchBingImage(event) {
    const cachedData = await getCachedBingImageBlob();
    event.source.postMessage({ 
      action: "bingImageResponse", 
      imageBlob: cachedData.imageBlob,
      title: cachedData.title,
      copyright: cachedData.copyright,
      timestamp: cachedData.timestamp
    });
  }


chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "welcome.html" });
  }
});


async function handleDiscoverFeeds(event) {
  const urls = event.data.discoverUrls;
  console.log(`[Service Worker] discovering Feeds for site ${urls}`);
  console.log("URLs: ", urls);
  const feedUrls = await discoverFeedUrls(urls);
  
  console.log("discovered feedUrls: ", feedUrls);
  //Sending fetched feed data to tab
  postMessageToClients({
    action: "discoveredFeeds",
    feedUrls: feedUrls,
  });
}

async function discoverFeedUrls(siteUrls) {
  const requestUrl = `${await getApiUrl()}/discover`;
  const requestOptions = createRequestOptions(siteUrls);
  const fetchedFeedUrls = await fetchJson(requestUrl, requestOptions);
  return fetchedFeedUrls.feeds.filter(feed => feed.status !== "error");
}



function acceptApiUrl(url) {
  console.log("SW: setting apiUrl: ", url);
  apiUrl = url;
}




async function fetchRSSFeedAndUpdateCache(feedUrls) {
  console.log("fetching rss feeds", feedUrls);
  try {
    const allFeedsData = await fetchRSSFeed(feedUrls);
    const feedDetails = [];
    let items = [];
    console.log(`SW: refreshing ${feedUrls.length} feeds at ${new Date().toLocaleTimeString()}`);

    const errorMessages = ["Error", "error", "ERROR", "404", "Not Found", "not found", "NOT FOUND"];

    for (const feed of allFeedsData.feeds) {
      const isErrorTitle = errorMessages.some(msg => feed.siteTitle.includes(msg));
      if (isErrorTitle) {
        feed.siteTitle = await getWebsiteTitle(feed.favicon) || await getWebsiteTitle(feed.feedUrl);
        console.log("searching for site title");
      } else {
        feed.feedTitle = feed.siteTitle;
      }

      feedDetails.push({
        siteTitle: feed.siteTitle,
        feedTitle: feed.feedTitle,
        feedUrl: feed.feedUrl,
        description: feed.description,
        author: feed.podcastInfo ? feed.podcastInfo.author : "",
        lastUpdated: feed.lastUpdated,
        lastRefreshed: feed.lastRefreshed,
        favicon: feed.favicon,
      });

      if (Array.isArray(feed.items)) {
        const feedItems = feed.items.map(item => ({
          id: item.id,
          title: item.title,
          siteTitle: isErrorTitle ? feed.feedTitle : feed.siteTitle,
          feedTitle: feed.feedTitle,
          thumbnail: item.thumbnail,
          thumbnailColor: item.thumbnailColor,
          link: item.link,
          feedUrl: feed.feedUrl,
          favicon: feed.favicon,
          author: item.author,
          published: item.published,
          created: item.created,
          category: item.category,
          content: item.content,
          media: item.media,
          enclosures: item.enclosures,
          podcastInfo: {
            author: item.podcastInfo ? item.podcastInfo.author : "",
            image: item.podcastInfo ? item.podcastInfo.image : "",
            categories: item.podcastInfo ? item.podcastInfo.categories : [],
          },
        }));
        items = [...items, ...feedItems];
      } else {
        console.log("feed.items is not an array: ", JSON.stringify(feed));
      }
    }

    items.sort((a, b) => b.published - a.published);

    const combinedData = { feedDetails, items };
    const combinedDataString = JSON.stringify(combinedData);
    console.log(`SW: Successfully refreshed ${feedUrls.length} feeds at ${new Date().toLocaleTimeString()}`);

    postMessageToClients({ action: "rssUpdate", data: combinedDataString });
  } catch (error) {
    console.error("Error fetching one or more feeds:", error);
  }
}



//Get thumbnailUrl from the feed items and cache the images
async function fetchRSSFeed(feedUrls) {
  const apiUrl = await getApiUrl();
  const requestUrl = `${apiUrl}/parse`;
  const requestOptions = createRequestOptions(feedUrls);

  console.log("fetchRSSFeed: getApiUrl" + apiUrl);

  const response = await fetch(requestUrl, requestOptions);
  const fetchedFeedData = await response.json();

  if (response.ok) {
    // Filter out feeds with a status other than "ok"
    fetchedFeedData.feeds = fetchedFeedData.feeds.filter(feed => feed.status === "ok");
    return fetchedFeedData;
  } else {
    console.error("API response: ", JSON.stringify(fetchedFeedData));
    throw new Error("Failed to fetch RSS feeds");
  }
}

self.addEventListener('activate', async (event) => {
  try {
    bingImageCache = await getCachedBingImageBlob();


  }
  catch (error) {
    console.error("Failed to fetch Bing image of the day:", error);
  }
 
  
  
});


async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
}

async function getCachedBingImageBlob() {
  const now = new Date().getTime();
  if (!bingImageCache.imageBlob || now - bingImageCache.timestamp > 24 * 60 * 60 * 1000) {
    const data = await fetchJson(BING_IMAGE_URL);
    const imageUrl = "https://www.bing.com" + data.images[0].url.replace(/1920x1080/g, "UHD");
    const imageResponse = await fetch(imageUrl);
    bingImageCache = {
      imageBlob: await imageResponse.blob(),
      timestamp: now,
      title: data.images[0].title,
      copyright: data.images[0].copyright,
    };
  }
  return bingImageCache;
}