self.addEventListener("install", function (event) {
  // RSS feed logic here or any caching logic if needed
  console.log("installing service worker");
  // fetchRSSFeedAndUpdateCache();
});

async function fetchRSSFeedAndUpdateCache(feedUrls) {


    console.log(typeof feedUrls);
    console.log(feedUrls);
  
    // Use Promise.all to fetch all feeds in parallel and wait for all of them to complete
    Promise.all(feedUrls.map((url) => fetchRSSFeed(url)))
      .then((allFeedsData) => {
        // Extract all items from each RSS feed
        const allItems = allFeedsData.flatMap(feedData => feedData.items || []);
  
        // Sort items chronologically by pubDate
        allItems.sort((a, b) => {
          const dateA = new Date(a.pubDate);
          const dateB = new Date(b.pubDate);
          return dateB - dateA; // Sort in descending order for most recent items first
        });
  
        // Convert the sorted items to a JSON string
        const combinedDataString = JSON.stringify({ items: allItems });
        console.log("sending rss data to client: ", combinedDataString);
  
        // Send the sorted items to the client
        sendUpdateToClient(combinedDataString);
      })
      .catch((error) => {
        console.error("Error fetching one or more feeds:", error);
      });
  }
  

self.addEventListener("message", function (event) {
  if (event.data.action === "fetchRSS") {
    console.log("message received from client: ", event.data.feedUrls);
    fetchRSSFeedAndUpdateCache(event.data.feedUrls);
  }
});

function sendUpdateToClient(data) {
  clients.matchAll().then((clients) => {
    if (clients && clients.length) {
      clients[0].postMessage({
        action: "rssUpdate",
        rssData: data
      });
    }
  });
}

async function fetchRSSFeed(feedUrl) {
  const rss2jsonApiKey = "exr1uihphn0zohhpeaqesbn4bb1pqzxm3xoe8cuj"; // Replace with your API key from rss2json.com
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
    feedUrl
  )}&api_key=${rss2jsonApiKey}`;

  console.log("fetching rss feed: ", apiUrl);

  return fetch(apiUrl)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Failed to fetch RSS feed");
      }
    })
    .then((data) => {
      if (data.status === "ok") {
        return data;
      } else {
        throw new Error("Failed to parse RSS feed");
      }
    });
}
