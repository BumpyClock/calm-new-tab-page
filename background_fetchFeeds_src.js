const RSSParser = require('rss-parser');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchFeed') {
        console.log('fetching feed', request.feedURL)
      fetchFeed(request.feedURL)
        .then(feed => sendResponse({ success: true, feed }))
        .catch(error => sendResponse({ success: false, error }));
      return true;
    }
  });
  
  async function fetchFeed(feedURL) {
    const parser = new RSSParser();
   const corsProxy = 'https://figma-plugin-cors-proxy.azurewebsites.net/proxy?url=';
   const proxiedURL = corsProxy + encodeURIComponent(feedURL);
   const feed = await parser.parseURL(proxiedURL);
    //const feed = await parser.parseURL(feedURL);
    return feed;
  }
  
  
  