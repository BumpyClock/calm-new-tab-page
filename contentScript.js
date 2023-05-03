// contentScript.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getReadableContent") {
    const Readability = require("readability");
    const JSDOM = require("jsdom").JSDOM;

    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const doc = new JSDOM(html, { url });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();
        sendResponse(article);
      })
      .catch((error) => {
        console.error("Failed to fetch readable content:", error);
        sendResponse(null);
      });

    // Required to indicate the response is asynchronous
    return true;
  }
});
