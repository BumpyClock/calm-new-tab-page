var apiUrl = "https://rss.bumpyclock.com";
self.addEventListener("install", function (event) {
  // RSS feed logic here or any caching logic if needed
  // console.log("installing service worker");
  // fetchRSSFeedAndUpdateCache();
});

chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "welcome.html" });
  }
  // Other installation logic if needed
});

self.addEventListener("message", function (event) {
  if (event.data.action === "setApiUrl") {
    console.log("SW: updating ApiUrl: ", event.data.apiUrl);
    acceptApiUrl(event.data.apiUrl);
  }
});

self.addEventListener("message", function (event) {
  if (event.data.action === "getapiUrl") {
    console.log("apiUrl: ", apiUrl);
    event.ports[0].postMessage({
      action: "getapiUrl",
      apiUrl: getApiUrl(),
    });
  }
});

function getApiUrl() {
  return apiUrl;
}
function acceptApiUrl(url) {
  console.log("SW: setting apiUrl: ", url);
  apiUrl = url;
}

self.addEventListener("message", function (event) {
  if (event.data.action === "fetchRSS") {
    fetchRSSFeedAndUpdateCache(event.data.feedUrls); //Sending fetched feed data to tab
  }
});

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
      sendUpdateToClient(combinedDataString);
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

function sendUpdateToClient(data) {
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
  var requestUrl = apiUrl+"/parse";
  const urlsForPostRequest = {
    urls: feedUrls,
  };

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
