self.addEventListener("install", function(event) {
  // RSS feed logic here or any caching logic if needed
  // console.log("installing service worker");
  // fetchRSSFeedAndUpdateCache();
});

self.addEventListener("message", function(event) {
  if (event.data.action === "fetchRSS") {
    fetchRSSFeedAndUpdateCache(event.data.feedUrls); //Sending fetched feed data to tab
  }
});


async function fetchRSSFeedAndUpdateCache(feedUrls) {
  //   console.log(typeof feedUrls);
  //   console.log(feedUrls);

  // Use Promise.all to fetch all feeds in parallel and wait for all of them to complete
  Promise.all(feedUrls.map(url => fetchRSSFeed(url)))
    .then(allFeedsData => {
      // Extract all items from each RSS feed
      const allItems = allFeedsData.flatMap(feedData => feedData.items || []);

        // Add thumbnailUrl to each item && cache the images locally
        allItems.forEach(item => {
            item.thumbnailUrl = extractThumbnailURL(item);
          });

      // Sort items chronologically by pubDate
      allItems.sort((a, b) => {
        const dateA = new Date(a.pubDate);
        const dateB = new Date(b.pubDate);
        return dateB - dateA; // Sort in descending order for most recent items first
      });

      // Convert the sorted items to a JSON string
      const combinedDataString = JSON.stringify({ items: allItems });
      // console.log("sending rss data to client: ", combinedDataString);

      // Send the sorted items to the client
      sendUpdateToClient(combinedDataString);
    })
    .catch(error => {
      console.error("Error fetching one or more feeds:", error);
    });
}


function sendUpdateToClient(data) {
  clients.matchAll().then(clients => {
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
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Failed to fetch RSS feed");
      }
    })
    .then(data => {
      if (data.status === "ok") {
        return data;
      } else {
        throw new Error("Failed to parse RSS feed");
      }
    });
}

//Get thumbnailUrl from the feed items and cache the images
function extractThumbnailURL(item) {
  const imgRegex = /<img[^>]+src="([^">]+)"/;

  // Check if 'content' field exists and try to extract the thumbnail URL
  if (item.content) {
    const match = item.content.match(imgRegex);
    if (match) {
      addImageToCache(match[1]);
      return match[1];
    }
  }

  // Check if 'description' field exists and try to extract the thumbnail URL
  if (item.description) {
    const match = item.description.match(imgRegex);
    if (match) {
      addImageToCache(match[1]);
      return match[1];
    }
  }

  // Check if 'enclosure' field exists and has a URL attribute with type "image/jpg"
  if (
    item.enclosure &&
    item.enclosure.link &&
    (item.enclosure.type === "image/jpg" ||
      item.enclosure.type === "image/jpeg")
  ) {
    addImageToCache(match[1]);
    return item.enclosure.link;
  }

  // Check if 'enclosure' field exists and has a URL attribute with type "image/png", "image/jpg" or "image/jpeg"
  if (
    item.enclosure &&
    item.enclosure.link &&
    (item.enclosure.type === "image/png" ||
      item.enclosure.type === "image/jpg" ||
      item.enclosure.type === "image/jpeg")
  ) {
    addImageToCache(match[1]);
    return item.enclosure.link;
  }

  // Check if 'media:group' field exists and has a valid URL in 'media:content'
  if (item["media:group"] && item["media:group"]["media:content"]) {
    const mediaContent = item["media:group"]["media:content"];
    if (Array.isArray(mediaContent)) {
      for (const media of mediaContent) {
        if (media.url && media.type === "image/jpeg") {
          addImageToCache(match[1]);
          return media.url;
        }
      }
    } else if (mediaContent.type === "image/jpeg") {
      addImageToCache(match[1]);
      return mediaContent.url;
    }
  }

  return null;
}

function addImageToCache(imageUrl) {
  return caches.open("rss-feed-images").then(cache => {
    return cache.add(imageUrl);
  });
}
