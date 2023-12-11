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
  fetchRSSFeed(feedUrls)
    .then(allFeedsData => {
      // Initialize the arrays for feed details and items
      const feedDetails = [];
      const items = [];

      // Iterate over each feed in the feeds array
      for (const feed of allFeedsData.feeds) {
        // Collect feed details
        feedDetails.push({
          siteTitle: feed.siteTitle,
          feedTitle: feed.feedTitle,
          feedUrl: feed.feedUrl,
          description: feed.description,
          author: feed.podcastInfo ? feed.podcastInfo.author : '',
          lastUpdated: feed.lastUpdated,
          lastRefreshed: feed.lastRefreshed,
          favicon: feed.favicon
        });

        // Collect items and add additional required fields
        
        if (Array.isArray(feed.items)) {
          for (const item of feed.items) {
            items.push({
              id: item.id,
              title: item.title,
              thumbnail: item.thumbnail,
              link: item.link,
              author: item.author,
              published: item.published,
              created: item.created,
              category: item.category,
              content: item.content,
              media: item.media,
              enclosures: item.enclosures,
              podcastInfo: {
                author: item.podcastInfo ? item.podcastInfo.author : '',
                image: item.podcastInfo ? item.podcastInfo.image : '',
                categories: item.podcastInfo ? item.podcastInfo.categories : []
              }
            });
          }
        }
        else {
          console.log("feed.items is not an array: ", JSON.stringify(feed));
        }
        
      }

      // Sort items chronologically by published date
      items.sort((a, b) => b.published - a.published);

      // Combine feed details and items into a single object
      const combinedData = {
        feedDetails,
        items
      };

      // Convert the combined data object to a JSON string
      const combinedDataString = JSON.stringify(combinedData);
      // console.log("combinedDataString: ", combinedDataString);

      // Send the sorted items to the client
      sendUpdateToClient(combinedDataString);
      const channel = new BroadcastChannel('rss_feeds_channel');
    channel.postMessage({ action: 'rssUpdate', rssData: combinedDataString });
    })
    .catch(error => {
      console.error("Error fetching one or more feeds:", error);
    });
}

// Continue with the fetchRSSFeed function as defined previously...



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
//old fetchRSSFeed function for backup

// async function fetchRSSFeed(feedUrl) {
//   const rss2jsonApiKey = "exr1uihphn0zohhpeaqesbn4bb1pqzxm3xoe8cuj"; // Replace with your API key from rss2json.com
//   const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
//     feedUrl
//   )}&api_key=${rss2jsonApiKey}`;

//   console.log("fetching rss feed: ", apiUrl);

//   return fetch(apiUrl)
//     .then(response => {
//       if (response.ok) {
//         return response.json();
//       } else {
//         throw new Error("Failed to fetch RSS feed");
//       }
//     })
//     .then(data => {
//       if (data.status === "ok") {
//         return data;
//       } else {
//         throw new Error("Failed to parse RSS feed");
//       }
//     });
// }




//Get thumbnailUrl from the feed items and cache the images
async function fetchRSSFeed(feedUrls) {
  const apiUrl = `https://rss.bumpyclock.com/parse`;
  // const apiUrl = `http://192.168.1.51:3000/parse`;
  console.log("fetching rss feeds: ", feedUrls);

  const requestOptions = {
    method: 'POST', // Using POST method
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ urls: feedUrls }) // Sending the urls in the body
  };

  // console.log("API call: ", apiUrl, requestOptions);

  return fetch(apiUrl, requestOptions)
  .then(response => {
    const fetchedFeedData = response.json();

    // console.log("API response: ", fetchedFeedData);
    if (response.ok) {
            return fetchedFeedData;
    } else {
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


function extractThumbnailURL(item) {
  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const imageUrlRegex = /\.(jpeg|jpg|png|gif|bmp)$/i;

  // Function to add image to cache
  function addImageToCache(url) {
    // Your caching logic here
  }

  // Extract URL from 'content' or 'description'
  function extractFromContent(contentField) {
    if (contentField) {
      const match = contentField.match(imgRegex);
      if (match) {
        addImageToCache(match[1]);
        return match[1];
      }
    }
    return null;
  }

  // Try extracting from 'content'
  let thumbnailUrl = extractFromContent(item.content);
  if (thumbnailUrl) return thumbnailUrl;

  // Try extracting from 'description'
  thumbnailUrl = extractFromContent(item.description);
  if (thumbnailUrl) return thumbnailUrl;

  // Handle 'enclosure'
  if (item.enclosure && item.enclosure.link) {
    if (!item.enclosure.type || imageUrlRegex.test(item.enclosure.link)) {
      addImageToCache(item.enclosure.link);
      return item.enclosure.link;
    }
  }

  // Handle 'media:group'
  if (item["media:group"] && item["media:group"]["media:content"]) {
    const mediaContent = item["media:group"]["media:content"];
    if (Array.isArray(mediaContent)) {
      for (const media of mediaContent) {
        if (media.url && (!media.type || imageUrlRegex.test(media.url))) {
          addImageToCache(media.url);
          return media.url;
        }
      }
    } else if (mediaContent.url && (!mediaContent.type || imageUrlRegex.test(mediaContent.url))) {
      addImageToCache(mediaContent.url);
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
