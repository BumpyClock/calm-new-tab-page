const SUBSCRIBED_FEEDS_KEY = 'subscribedFeeds';
const DEFAULT_FEED_URL = 'https://www.vox.com/rss/index.xml';
let mostVisitedSitesCache = null;



document.addEventListener('DOMContentLoaded', () => {
  const date = new Date();
  const hours = date.getHours();
  let greeting = '';

  if (hours < 12) {
    greeting = 'Good morning';
  } else if (hours < 18) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  document.title = `${greeting} - New Tab`;
  if (document.querySelector('#feed-container')) {
    // Main page
   // document.getElementById('greeting').textContent = greeting;

  // loadSubscribedFeeds();
    
  } else {
    // Settings page
    setupSubscriptionForm();
    displaySubscribedFeeds();
    setupBackButton();
    fetchBingImageOfTheDay();
  }

  if (document.querySelector('#settings-button')) {
    document.getElementById('settings-button').addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
  }

  if (document.querySelector('#feed-container')) {
    // Main page
   // document.getElementById('greeting').textContent = greeting;
  
    loadSubscribedFeeds();
    handleSearch();
  }
 // generateDynamicBackground();

  
});





chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "readableContentFetched") {
    const article = message.article;
    // Update the modal window with the readable content
  }
});



function getSubscribedFeeds() {
  return JSON.parse(localStorage.getItem(SUBSCRIBED_FEEDS_KEY)) || [DEFAULT_FEED_URL];
}

function setSubscribedFeeds(feeds) {
  localStorage.setItem(SUBSCRIBED_FEEDS_KEY, JSON.stringify(feeds));
}

async function loadSubscribedFeeds() {
  const feeds = getSubscribedFeeds();
  const allItems = await Promise.all(feeds.map(loadFeed))
    .then((feeds) => {
      // Filter out any undefined values and then use flatMap
      return feeds.filter(feed => feed).flatMap(feed => feed.items);
    })
    .then((items) => {
      items.sort(compareItemsByDate);
      return items;
    });

  const feedContainer = document.getElementById('feed-container');
  allItems.forEach(item => {
    const card = createCard(item);
    feedContainer.appendChild(card);
  });
}




function compareItemsByDate(a, b) {
  const dateA = new Date(a.pubDate);
  const dateB = new Date(b.pubDate);

  if (dateA > dateB) {
    return -1;
  } else if (dateA < dateB) {
    return 1;
  } else {
    return 0;
  }
}


async function loadFeed(feedURL) {
  try {
    const feed = await fetchRssFeed(feedURL);
    const feedContainer = document.getElementById("feed-container");

     // Sort feed items chronologically
     feed.items.sort((a, b) => {
      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);
      return dateB - dateA; // For descending order (most recent first)
      // return dateA - dateB; // For ascending order (oldest first)
    });

    for (const item of feed.items) {
      const thumbnailURL = extractThumbnailURL(item);
      const card = await createCard(item, thumbnailURL);
      feedContainer.appendChild(card);
    }
  } catch (error) {
    console.error("Failed to fetch feed:", error);
  }
}



async function fetchRssFeed(feedUrl) {
  const rss2jsonApiKey = "exr1uihphn0zohhpeaqesbn4bb1pqzxm3xoe8cuj"; // Replace with your API key from rss2json.com
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&api_key=${rss2jsonApiKey}`;

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





function setupSubscriptionForm() {
  const form = document.getElementById('subscription-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const feedURL = form.elements['feed-url'].value;
    const feeds = getSubscribedFeeds();
    feeds.push(feedURL);
    setSubscribedFeeds(feeds);

    await loadFeed(feedURL);
    form.reset();
  });
}



function setupBackButton() {
  const backButton = document.getElementById('back-to-main');
  backButton.addEventListener('click', () => {
    window.location.href = 'newtab.html';
  });
}

async function createCard(item, thumbnailURL=null) {
  const card = document.createElement("div");
  card.className = "card";
 var website_title =  await getWebsiteTitle(item.link);
  if (thumbnailURL) {
    const img = document.createElement("img");
    img.src = thumbnailURL;
    card.appendChild(img);
  }

  const textContentDiv = document.createElement("div");
  textContentDiv.classList.add("text-content");
// Add website name and favicon
const websiteInfoDiv = document.createElement("div");
websiteInfoDiv.className = "website-info";

const favicon = document.createElement("img");
const mainDomain = new URL(item.link).hostname;
favicon.src = `https://icon.horse/icon/${mainDomain}`;
favicon.alt = `${mainDomain} Favicon`;
favicon.className = "site-favicon";
websiteInfoDiv.appendChild(favicon);

const websiteName = document.createElement("span");
websiteName.textContent = website_title;
websiteInfoDiv.appendChild(websiteName);

textContentDiv.appendChild(websiteInfoDiv);

  const title = document.createElement("h3");
  title.textContent = item.title;
  textContentDiv.appendChild(title);

  if (item.contentSnippet) {
    const snippet = document.createElement("p");
    snippet.className = "description";
    snippet.textContent = item.contentSnippet;
    textContentDiv.appendChild(snippet);
  }

  if (item.link) {
    const date = new Date(item.pubDate);
    const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    const details = document.createElement("p");
    details.textContent = `${dateString}`;
    textContentDiv.appendChild(details);

    if (!thumbnailURL) {
      const description = document.createElement("div");
      description.className = "description long-description";
      const plainTextDescription = item.description.replace(/(<([^>]+)>)/gi, ""); // Remove HTML tags
      description.innerText = plainTextDescription;
      textContentDiv.appendChild(description);
    }

    const readMoreLink = document.createElement("a");
    readMoreLink.href = item.link;
    readMoreLink.target = "_blank";
    readMoreLink.textContent = "Read more";
    readMoreLink.className = "read-more-link";
    textContentDiv.appendChild(readMoreLink);
  }

  card.appendChild(textContentDiv);
  card.addEventListener("click", (e) => {
    if (e.target.tagName.toLowerCase() !== "a") {
      showReaderView(item.link);
    }
  });

  return card;
}

async function getWebsiteTitle(url) {
  try {
    const parsedUrl = new URL(url);
    const rootDomain = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const response = await fetch(rootDomain);
    const text = await response.text();
    const matches = text.match(/<title>(.*?)<\/title>/i);
    return matches && matches[1] ? matches[1] : url;
  } catch (e) {
    console.error('Failed to get website title:', e);
    return url;
  }
}



function extractThumbnailURL(item) {
  const imgRegex = /<img[^>]+src="([^">]+)"/;

  // Check if 'content' field exists and try to extract the thumbnail URL
  if (item.content) {
    const match = item.content.match(imgRegex);
    if (match) return match[1];
  }

  // Check if 'description' field exists and try to extract the thumbnail URL
  if (item.description) {
    const match = item.description.match(imgRegex);
    if (match) return match[1];
  }

  // Check if 'enclosure' field exists and has a URL attribute with type "image/jpg"
  if (item.enclosure && item.enclosure.link && (item.enclosure.type === "image/jpg" || item.enclosure.type === "image/jpeg")) {
    return item.enclosure.link;
  }

  // Check if 'media:group' field exists and has a valid URL in 'media:content'
  if (item['media:group'] && item['media:group']['media:content']) {
    const mediaContent = item['media:group']['media:content'];
    if (Array.isArray(mediaContent)) {
      for (const media of mediaContent) {
        if (media.url && media.type === "image/jpeg") return media.url;
      }
    } else if (mediaContent.type === "image/jpeg") {
      return mediaContent.url;
    }
  }

  return null;
}




// Search code 

function handleSearch() {
  const searchInput = document.getElementById('search-input');
  const searchEngineSelect = document.getElementById('search-engine');
  const searchButton = document.getElementById('search-button');

  searchButton.addEventListener('click', () => {
    const query = searchInput.value;
    const searchEngineURL = searchEngineSelect.value;
    const searchURL = searchEngineURL + encodeURIComponent(query);
    window.open(searchURL, '_blank');
  });

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchButton.click();
    }
  });
}



// Add this function to remove a feed
function removeFeed(feedURL) {
  const feeds = getSubscribedFeeds();
  const updatedFeeds = feeds.filter(url => url !== feedURL);
  setSubscribedFeeds(updatedFeeds);
  displaySubscribedFeeds();
}

// async function showReaderView(url) {
//   try {
//     const response = await fetch(url);
//     const html = await response.text();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, "text/html");
//     const reader = new Readability(doc);
//     const article = reader.parse();

//     if (article) {
//       const readerViewModal = createReaderViewModal(article);
//       document.body.appendChild(readerViewModal);
//       setTimeout(() => {
//         readerViewModal.classList.add("visible");
//       }, 10);
//       toggleBodyScroll(false);
//     } else {
//       console.error("Failed to fetch readable content.");
//     }
//   } catch (error) {
//     console.error("Error fetching the page content:", error);
//   }
// }

async function showReaderView(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const reader = new Readability(doc);
    const article = reader.parse();

    if (article) {
      const readerViewModal = createReaderViewModal(article);
      document.body.appendChild(readerViewModal);
      setTimeout(() => {
        readerViewModal.classList.add("visible");
      }, 10);
      toggleBodyScroll(false);

      // Add website name and favicon
      const websiteInfoDiv = document.createElement("div");
      websiteInfoDiv.className = "website-info";

      const favicon = document.createElement("img");
      const mainDomain = new URL(url).hostname;
      favicon.src = `https://icon.horse/icon/${mainDomain}`;
      favicon.alt = `${mainDomain} Favicon`;
      favicon.className = "site-favicon";
      websiteInfoDiv.appendChild(favicon);

      const websiteName = document.createElement("span");
      websiteName.textContent = await getWebsiteTitle(url);
      websiteName.style.fontSize = "10px";
      websiteName.style.fontWeight = "900";
      websiteInfoDiv.appendChild(websiteName);

      readerViewModal.querySelector("#website-info-placeholder").appendChild(websiteInfoDiv);

      // Check if content overflows
      const contentHeight = readerViewModal.querySelector('.reader-view-page-text');
      const contentContainerHeight = readerViewModal.querySelector('.reader-view-content');
      const progressRing = document.getElementById('progress-ring');
      if (contentHeight.clientHeight < contentContainerHeight.clientHeight) {
        progressRing.style.display = 'none';
      } 

    } else {
      console.error("Failed to fetch readable content.");
    }
  } catch (error) {
    console.error("Error fetching the page content:", error);
  }
}


function createReaderViewModal(article) {
  const modal = document.createElement("div");
  modal.className = "reader-view-modal";
  modal.innerHTML = `
    <div class="reader-view-content">
      
      <div class="reader-view-page-content">
        <div class="reader-view-header">
          <span class="reader-view-close">&times;</span>
          <h1 class="reader-view-title"><span id="website-info-placeholder"></span>${article.title}</h1>
          ${article.byline ? `<h2 class="reader-view-author">${article.byline}</h2>` : ""}
          <p class="reader-view-reading-time">${estimateReadingTime(article.textContent)} minutes</p>
          <hr class="solid">
        </div>
        <div class="reader-view-page-text">
          <div class="reader-view-article">${article.content}</div>
        </div>
      </div>
      <div id="progress-ring" class="progress-indicator-container"></div>
    </div>
  `;

  modal.querySelector(".reader-view-close").onclick = () => {
    modal.remove();
    toggleBodyScroll(true);

  };
  modal.addEventListener("click", (event) => {
    if (!modal.querySelector(".reader-view-content").contains(event.target)) {
      modal.remove();
      toggleBodyScroll(true);
    }
  });

  const progressIndicator = createCircularProgressIndicator();
  modal.querySelector(".progress-indicator-container").appendChild(progressIndicator);
  const progressCircle = progressIndicator.querySelector(".progress-circle__progress");
  const pageText = modal.querySelector(".reader-view-content");
  pageText.addEventListener("scroll", () => updateReadingProgress(progressCircle, pageText));

  
  
  return modal;
}

//Reading progress indicator code

function createCircularProgressIndicator() {
  const progressIndicator = document.createElement("div");
  progressIndicator.className = "progress-indicator";

  progressIndicator.innerHTML = `
    <svg id="progress-ring" class="progress-circle" viewBox="0 0 36 36">
      <circle class="progress-circle__background" cx="18" cy="18" r="15.9155" stroke-width="2"></circle>
      <circle class="progress-circle__progress" cx="18" cy="18" r="15.9155" stroke-width="2" stroke-dasharray="100" stroke-dashoffset="100"></circle>
    </svg>
  `;

  return progressIndicator;
}


function updateReadingProgress(progressCircle, pageText) {
  const scrollPosition = pageText.scrollTop;
  const maxScroll = pageText.scrollHeight - pageText.clientHeight;

  const progressPercentage = (scrollPosition / maxScroll) * 100;

  
  setCircularProgress(progressCircle, progressPercentage);
}

function setCircularProgress(progressIndicator, progressPercentage) {
  const radius = progressIndicator.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  const offset = circumference - (progressPercentage / 100) * circumference;
  progressIndicator.style.strokeDashoffset = offset;
}



//function to estimate reading time
function estimateReadingTime(text) {
  const wordsPerMinute = 183; // Adjust this value based on your preferred reading speed
  const words = text.trim().split(/\s+/).length;
  const readingTimeInMinutes = Math.ceil(words / wordsPerMinute);

  return readingTimeInMinutes;
}


function toggleBodyScroll(isEnabled) {
  if (isEnabled) {
    document.body.style.overflow = "";
  } else {
    document.body.style.overflow = "hidden";
  }
}

// Modify displaySubscribedFeeds function
async function displaySubscribedFeeds() {
  const feeds = getSubscribedFeeds();
  const list = document.getElementById("subscribed-feeds-list");
  list.innerHTML = ""; // Clear the list

  for (const feedURL of feeds) {
    if (feedURL != null) {
    const listItem = document.createElement("li");

    // Add website favicon
    const favicon = document.createElement("img");
    
    const mainDomain = new URL(feedURL).hostname;
    favicon.src = `https://icon.horse/icon/${mainDomain}`;
    favicon.alt = `${mainDomain} Favicon`;
    favicon.className = "site-favicon";
    listItem.appendChild(favicon);

    // Add website name
    const websiteName = document.createElement("span");
    const siteTitle = await getWebsiteTitle(feedURL);
    websiteName.textContent = siteTitle;
    listItem.appendChild(websiteName);

    const removeButton = document.createElement("button");
    removeButton.textContent = "X";
    removeButton.className = "remove-feed-button";
    removeButton.addEventListener("click", () => {
      removeFeed(feedURL);
    });
    listItem.appendChild(removeButton);

    list.appendChild(listItem);
  }
  }
}



// Show Top Sites
async function initializeMostVisitedSitesCache() {
  mostVisitedSitesCache = await new Promise((resolve) => {
    chrome.topSites.get(async (sites) => {
      const siteCards = await Promise.all(
        sites.slice(0, 10).map(async (site) => {
          const siteCard = await createMostVisitedSiteCard(site);
          return siteCard;
        })
      );
      resolve(siteCards);
    });
  });

  // Call fetchMostVisitedSites to display the most visited sites once the cache is initialized
  fetchMostVisitedSites();
}


function createMostVisitedSiteCard(site) {
  const siteUrl = new URL(site.url);
  const mainDomain = siteUrl.hostname;
  const siteCard = document.createElement("div");
  siteCard.className = "site-card";
  siteCard.innerHTML = `
    <a href="${site.url}" class="site-link">
      <img src="https://icon.horse/icon/${mainDomain}" alt="${site.title} Favicon" class="site-favicon">
      <div class="site-title">${site.title}</div>
    </a>
  `;
  return siteCard;
}



function fetchMostVisitedSites() {
  if (!mostVisitedSitesCache) {
    console.error("Most visited sites cache is not initialized");
    initializeMostVisitedSitesCache();

    return;
  }

  const mostVisitedSitesContainer = document.querySelector(".most-visited-sites-container");

  mostVisitedSitesCache.forEach((siteCard) => {
    mostVisitedSitesContainer.appendChild(siteCard.cloneNode(true));
  });
}



//cache favicons for improve perf
async function cacheFavicon(domain) {
  const response = await fetch(`https://icon.horse/icon/${domain}`);
  const blob = await response.blob();
  const dataURL = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
  localStorage.setItem(`favicon-${domain}`, dataURL);
  return dataURL;
}

async function getFavicon(domain) {
  const cachedFavicon = localStorage.getItem(`favicon-${domain}`);
  if (cachedFavicon) {
    return cachedFavicon;
  } else {
    const fetchedFavicon = await cacheFavicon(domain);
    return fetchedFavicon;
  }
}



// Call the fetchMostVisitedSites function when the DOM is loaded
//document.addEventListener("DOMContentLoaded", initializeMostVisitedSitesCache);
document.addEventListener("DOMContentLoaded", fetchBingImageOfTheDay);

async function fetchBingImageOfTheDay() {
  try {
    const response = await fetch("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US");
    const data = await response.json();
    const imageUrl = "https://www.bing.com" + data.images[0].url;
    const title = data.images[0].title;
      const copyright = data.images[0].copyright;
    const bgContainer = document.querySelector(".background-image-container");
    bgContainer.style.backgroundImage = `url(${imageUrl})`;
    const attributionContainer = document.querySelector(".attribution-container");
      attributionContainer.innerHTML = `
        <p class="attribution-title">${title}</p>
        <p class="attribution-copyright">${copyright} | Bing & Microsoft</p>
      `;
  } catch (error) {
    console.error("Failed to fetch Bing image of the day:", error);
  }
}

window.addEventListener("scroll", () => {
  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  const blurIntensity = Math.min(scrollPosition / 100, 10);
  const darkIntensity = Math.min(scrollPosition / 1000, 0.6); // Adjust the values as per your preference
  const bgContainer = document.querySelector(".background-image-container");
  bgContainer.style.filter = `blur(${blurIntensity}px) brightness(${1 - darkIntensity})`;
});

//load most visited sites from cache
initializeMostVisitedSitesCache();



