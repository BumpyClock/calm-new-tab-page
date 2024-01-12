var apiUrl = "https://rss.bumpyclock.com";
importScripts(...["/scripts/utils/defaults.js"]);
console.log("SW: apiUrl: ", getApiUrl());
const ACTION_SET_API_URL = "setApiUrl";
const ACTION_GET_API_URL = "getApiUrl";
const ACTION_DISCOVER_FEEDS = "discoverFeeds";
const ACTION_FETCH_RSS = "fetchRSS";
const ACTION_FETCH_BING_IMAGE = "fetchBingImage";
const BING_CACHE_NAME ='bing-image-cache';
const BING_IMAGE_URL = 'https://www.bing.com/HPImageArchive.aspx?resoultion=3840&format=js&image_format=webp&idx=random&n=1&mkt=en-US';
var bingImageCache = {
  title: "",
  copyright: "",
  imageBlob: null,
  timestamp: null
};

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
  // Other installation logic if needed
});

// self.addEventListener("message", function (event) {
//   if (event.data.action === "setApiUrl") {
//     console.log("SW: updating ApiUrl: ", event.data.apiUrl);
//     acceptApiUrl(event.data.apiUrl);
//   }
// });

// self.addEventListener("message", function (event) {
//   if (event.data.action === "getApiUrl") {
//     console.log("apiUrl: ", apiUrl);
//     event.ports[0].postMessage({
//       action: "getapiUrl",
//       apiUrl: getApiUrl(),
//     });
//   }
// });
async function handleDiscoverFeeds(event) {
  if (event.data.action === "discoverFeeds") {
    const urls = event.data.discoverUrls;
    console.log(`[Service Worker] discovering Feeds for site ${urls}`);
    console.log("URLs: ", urls);
    const feedUrls = await discoverFeedUrls(urls);
    
    console.log("discovered feedUrls: ", feedUrls);
    //Sending fetched feed data to tab
    this.self.clients.matchAll().then((clients) => {
      if (clients && clients.length) {
        clients.forEach(client => {
          client.postMessage({
            action: "discoveredFeeds",
            feedUrls: feedUrls,
          });
        });
      }
    });

  }
}

async function discoverFeedUrls(siteUrls){
  var requestUrl = await getApiUrl() + "/discover";
  console.log("[Discover Feed URLs] fetchRSSFeed: getApiUrl" + apiUrl);
  console.log(siteUrls);
  const urlsForPostRequest = {
    urls: siteUrls,
  };

  const requestOptions = {
    method: "POST", // Using POST method
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(urlsForPostRequest), // Sending the urls in the body
  };

  try {
    const response = await fetch(requestUrl, requestOptions);
    const fetchedFeedUrls = await response.json();
    console.log(`[ServiceWorker] Discover Feed response ${fetchedFeedUrls}`);

    if (!response.ok) {
      console.log("API response: ", JSON.stringify(fetchedFeedUrls));
      throw new Error("Failed to discover RSS feeds");
    }

    console.log("fetchedFeedUrls: ", fetchedFeedUrls);
    //fetchedFeedUls is a JSON object that contains an array called feeds. Each item has a field status. if status = error, remove the item from the response
    const filteredFeeds = fetchedFeedUrls.feeds.filter(feed => feed.status !== "error"); 
    fetchedFeedUrls.feeds = filteredFeeds;
    console.log("filteredFeeds: ", filteredFeeds);

    return filteredFeeds;
  } catch (error) {
    console.error("Failed to discover RSS feeds:", error);
  }
}



function acceptApiUrl(url) {
  console.log("SW: setting apiUrl: ", url);
  apiUrl = url;
}




async function fetchRSSFeedAndUpdateCache(feedUrls) {
  console.log("fetching rss feeds", feedUrls);
  fetchRSSFeed(feedUrls)
    .then(async (allFeedsData) => {
      // Initialize the arrays for feed details and items
      const feedDetails = [];
      const items = [];
      console.log(
        `SW: refreshing ${
          feedUrls.length
        } feeds at ${new Date().toLocaleTimeString()}`
      );

      for (const feed of feedDetails) {
        //check if the siteTitle is empty or malformed if so get the title from the website
        if(feed.siteTitle.includes("Error") || feed.siteTitle.includes("error") || feed.siteTitle.includes("ERROR") || feed.siteTitle.includes("404") || feed.siteTitle.includes("Not Found") || feed.siteTitle.includes("not found") || feed.siteTitle.includes("NOT FOUND")){
          feed.siteTitle=  await getWebsiteTitle(feed.favicon) || await getWebsiteTitle(feedItems.feedUrl);
        console.log("searching for site title");}        else{
            feed.feedUrl=feed.siteTitle;
          }
        }

      // Iterate over each feed in the feeds array
      for (const feed of allFeedsData.feeds) {
        // Collect feed details
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

        // Collect items and add additional required fields

        if (Array.isArray(feed.items)) {
          for (const item of feed.items) {
            items.push({
              id: item.id,
              title: item.title,
              siteTitle: feed.siteTitle.includes("Error") || feed.siteTitle.includes("404") ? feed.feedTitle : feed.siteTitle,              feedTitle: feed.feedTitle,
              thumbnail: item.thumbnail,
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
            });
          }
        } else {
          console.log("feed.items is not an array: ", JSON.stringify(feed));
        }
      }

      // Sort items chronologically by published date
      items.sort((a, b) => b.published - a.published);

      // Combine feed details and items into a single object
      const combinedData = {
        feedDetails,
        items,
      };

      // Convert the combined data object to a JSON string
      const combinedDataString = JSON.stringify(combinedData);
      // console.log("combinedDataString: ", combinedDataString);
      console.log(
        `SW: Successfully refreshed ${
          feedUrls.length
        } feeds at ${new Date().toLocaleTimeString()}`
      );

      // Send the sorted items to the client
      sendRssUpdateToClient(combinedDataString);
      const channel = new BroadcastChannel("rss_feeds_channel");
      channel.postMessage({
        action: "shareFeeds",
        rssData: combinedDataString,
      });
    })
    .catch((error) => {
      console.error("Error fetching one or more feeds:", error);
    });
}

function sendRssUpdateToClient(data) {
  clients.matchAll().then((clients) => {
    if (clients && clients.length) {
      clients.forEach(client => {
        client.postMessage({
          action: "rssUpdate",
          rssData: data,
        });
      });
    }
  });
}

//Get thumbnailUrl from the feed items and cache the images
async function fetchRSSFeed(feedUrls) {
  var apiUrl = await getApiUrl();
  var requestUrl = apiUrl+"/parse";
  const urlsForPostRequest = {
    urls: feedUrls,
  };

  console.log("fetchRSSFeed: getApiUrl" + apiUrl);

  const requestOptions = {
    method: "POST", // Using POST method
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(urlsForPostRequest), // Sending the urls in the body
  };

  return fetch(requestUrl, requestOptions).then((response) => {
    const fetchedFeedData = response.json();
    // console.log("fetchedFeedData: ", fetchedFeedData);

    if (response.ok) {
      return fetchedFeedData;
    } else {
      console.log("API response: ", JSON.stringify(fetchedFeedData));
      throw new Error("Failed to fetch RSS feeds");
    }
  });

  //put the status check back in after debugging, also need to update api endpoint to send back status
  // .then(data => {
  //   // Assuming the new API returns data in a similar format
  //   if (data.status === "ok") {
  //     return data;
  //   } else {
  //     throw new Error("Failed to parse RSS feeds");
  //   }
  // });
}

self.addEventListener('activate', async (event) => {
  try {
    bingImageCache = await getCachedBingImageBlob();


  }
  catch (error) {
    console.error("Failed to fetch Bing image of the day:", error);
  }
 
  
  
});




async function getCachedBingImageBlob() {
  const now = new Date().getTime();

  // Check if the image is older than 24 hours or not available
  if (!bingImageCache.imageBlob || now - bingImageCache.timestamp > 24 * 60 * 60 * 1000) {
    try {
      const response = await fetch(BING_IMAGE_URL);
      const data = await response.json();
      const imageUrl = "https://www.bing.com" + data.images[0].url.replace(/1920x1080/g, "UHD");
      const imageResponse = await fetch(imageUrl);
      bingImageCache.imageBlob = await imageResponse.blob();
      bingImageCache.timestamp = now;
      bingImageCache.title = data.images[0].title;
      bingImageCache.copyright = data.images[0].copyright;
    } catch (error) {
      console.error("Failed to fetch Bing image of the day:", error);
    }
  }
  
  return bingImageCache;
}