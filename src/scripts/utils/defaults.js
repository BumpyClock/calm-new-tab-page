const DEFAULT_API_URL = "https://rss.bumpyclock.com";
var apiUrl =  getApiUrl();


function setApiUrl(apiUrl) {
  const dbName = 'calm-ntp';
  const storeName = 'defaults';

  const openRequest = indexedDB.open(dbName);

  openRequest.onupgradeneeded = function() {
    const db = openRequest.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName);
    }
  };

  openRequest.onerror = function() {
    console.error("Failed to open database:", openRequest.error);
  };

  openRequest.onsuccess = function() {
    const db = openRequest.result;
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const putRequest = store.put(apiUrl, 'apiUrl');

    putRequest.onsuccess = function() {
      console.log("Successfully set apiUrl in IndexedDB");
    };

    putRequest.onerror = function() {
      console.error("Failed to set apiUrl:", putRequest.error);
    };

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      console.log("Sending message to service worker to set apiUrl");
      navigator.serviceWorker.controller.postMessage({
        action: "setApiUrl",
        apiUrl: apiUrl,
      });
    }
  };
}
  
async function getApiUrl() {
  const dbName = 'calm-ntp';
  const storeName = 'defaults';

  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(dbName);

    openRequest.onupgradeneeded = function() {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    openRequest.onerror = function() {
      reject(openRequest.error);
    };

    openRequest.onsuccess = function() {
      const db = openRequest.result;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get('apiUrl');

      getRequest.onsuccess = function() {
        if (getRequest.result) {
          resolve(getRequest.result);
        } else {
          setApiUrl(DEFAULT_API_URL);
          resolve(DEFAULT_API_URL);
        }
      };

      getRequest.onerror = function() {
        reject(getRequest.error);
      };
    };
  });
}

async function cacheRenderedCards(htmlContent) {
  const dbName = 'calm-ntp';
  const storeName = 'defaults';

  const openRequest = indexedDB.open(dbName);

  openRequest.onupgradeneeded = function() {
    const db = openRequest.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName);
    }
  };

  openRequest.onerror = function() {
    console.error("Failed to open database:", openRequest.error);
  };

  openRequest.onsuccess = function() {
    const db = openRequest.result;
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const putRequest = store.put(htmlContent, 'renderedCards');

    putRequest.onsuccess = function() {
      console.log("Successfully cached rendered cards in IndexedDB");
    };

    putRequest.onerror = function() {
      console.error("Failed to cache rendered cards:", putRequest.error);
    };
  };
}

async function getCachedRenderedCards() {
  const dbName = 'calm-ntp';
  const storeName = 'defaults';

  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(dbName);

    openRequest.onupgradeneeded = function() {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    openRequest.onerror = function() {
      reject(openRequest.error);
    };

    openRequest.onsuccess = function() {
      const db = openRequest.result;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.get('renderedCards');

      getRequest.onsuccess = function() {
        if (getRequest.result) {
          resolve(getRequest.result);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = function() {
        reject(getRequest.error);
      };
    };
  });
}