const DEFAULT_API_URL = "https://rss.bumpyclock.com";



function setApiUrl(apiUrl) {
    try {
      localStorage.setItem("apiUrl", apiUrl);
  
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        console.log("Sending message to service worker to set apiUrl");
        navigator.serviceWorker.controller.postMessage({
          action: "setApiUrl",
          apiUrl: apiUrl,
        });
      }
    } catch (error) {
      console.error("Failed to set apiUrl:", error);
    }
  }
  
  function getApiUrl() {
    try {
      if (!localStorage.getItem("apiUrl")) {
        setApiUrl(DEFAULT_API_URL);
      }
      return localStorage.getItem("apiUrl");
    } catch (error) {
      console.error("Failed to get apiUrl:", error);
      return null;
    }
  }