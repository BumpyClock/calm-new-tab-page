(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const SUBSCRIBED_FEEDS_KEY = 'subscribedFeeds';
const DEFAULT_FEED_URL = '';



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

  document.title = `${greeting} - RSS Feed Reader`;
  if (document.querySelector('#feed-container')) {
    // Main page
    document.getElementById('greeting').textContent = greeting;

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
    document.getElementById('greeting').textContent = greeting;
  
    loadSubscribedFeeds();
    handleSearch();
  }
 // generateDynamicBackground();

  
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabs[0].id },
      files: ["contentScript.js"],
    },
    () => {
      // Handle any errors or perform further actions after content script execution
    }
  );
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
  let allItems = [];

  for (const feedURL of feeds) {
    const feed = loadFeed(feedURL);
    allItems = allItems.concat(feed.items);
  }

  allItems.sort(compareItemsByDate);

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
  chrome.runtime.sendMessage(
    { action: "fetchFeed", feedURL },
    (response) => {
      if (response.success) {
        const feed = response.feed;
        const feedContainer = document.getElementById("feed-container");

        feed.items.forEach((item) => {
          const card = createCard(item);
          feedContainer.appendChild(card);
        });
      } else {
        console.error("Failed to fetch feed:", response.error);
      }
    }
  );
}


async function loadSubscribedFeeds() {
  const feeds = getSubscribedFeeds();
  const allItems = await Promise.all(feeds.map(loadFeed))
    .then((feeds) => {
      return feeds.flatMap(feed => feed.items);
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

function displaySubscribedFeeds() {
  const feeds = getSubscribedFeeds();
  const list = document.getElementById('subscribed-feeds-list');

  feeds.forEach((feedURL) => {
    const listItem = document.createElement('li');
    listItem.textContent = feedURL;
    list.appendChild(listItem);
  });
}

function setupBackButton() {
  const backButton = document.getElementById('back-to-main');
  backButton.addEventListener('click', () => {
    window.location.href = 'newtab.html';
  });
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'card';

  const thumbnailURL = extractThumbnailURL(item.content);
  if (thumbnailURL) {
    const img = document.createElement('img');
    img.src = thumbnailURL;
    card.appendChild(img);
  }

  const textContentDiv = document.createElement("div");
  textContentDiv.classList.add("text-content");

  const title = document.createElement('h3');
  title.textContent = item.title;
  textContentDiv.appendChild(title);

  if (item.contentSnippet) {
    const snippet = document.createElement('p');
    snippet.className = 'description';
    snippet.textContent = item.contentSnippet;
    textContentDiv.appendChild(snippet);
  }

  if (item.link) {
    const link = new URL(item.link);
    
    const date = new Date(item.pubDate);
    const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    const details = document.createElement('p');
    details.textContent = `${dateString}`;
    textContentDiv.appendChild(details);

    const readMoreLink = document.createElement('a');
    readMoreLink.href = item.link;
    readMoreLink.target = '_blank';
    readMoreLink.textContent = 'Read more';
    readMoreLink.className = 'read-more-link';
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
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const title = doc.querySelector('title');
    return title ? title.textContent : url;
  } catch (e) {
    console.error('Failed to get website title:', e);
    return url;
  }
}


function extractThumbnailURL(content) {
  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const match = content.match(imgRegex);
  return match ? match[1] : null;
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

function generateDynamicBackground() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, getRandomColor());
  gradient.addColorStop(1, getRandomColor());
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.zIndex = -1;
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Add this function to remove a feed
function removeFeed(feedURL) {
  const feeds = getSubscribedFeeds();
  const updatedFeeds = feeds.filter(url => url !== feedURL);
  setSubscribedFeeds(updatedFeeds);
  displaySubscribedFeeds();
}

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
          <h1 class="reader-view-title">${article.title}</h1>
          ${article.byline ? `<h2 class="reader-view-author">${article.byline}</h2>` : ""}
          <p class="reader-view-reading-time">${estimateReadingTime(article.textContent)} minutes</p>
          <hr class ="solid">

        </div>
        <div class="reader-view-page-text">
          <div class="reader-view-article">${article.content}</div>
        </div>
      </div>
      <div class="progress-indicator-container"></div>
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
    <svg class="progress-circle" viewBox="0 0 36 36">
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
function displaySubscribedFeeds() {
  const feeds = getSubscribedFeeds();
  const list = document.getElementById('subscribed-feeds-list');
  list.innerHTML = ''; // Clear the list

  feeds.forEach((feedURL) => {
    const listItem = document.createElement('li');

    const feedText = document.createElement('span');
    feedText.textContent = feedURL;
    listItem.appendChild(feedText);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'x';
    removeButton.className = 'remove-feed-button';
    removeButton.addEventListener('click', () => {
      removeFeed(feedURL);
    });
    listItem.appendChild(removeButton);

    list.appendChild(listItem);
  });
}

// Show Top Sites
function createMostVisitedSiteCard(site) {
  const siteUrl = new URL(site.url);
  const mainDomain = siteUrl.hostname;
  const siteCard = document.createElement("div");
  siteCard.className = "site-card";
  siteCard.innerHTML = `
    <a href="${site.url}" class="site-link">
      <img src="https://www.google.com/s2/favicons?domain=${mainDomain}&sz=256" alt="${site.title} Favicon" class="site-favicon">
      <div class="site-title">${site.title}</div>
    </a>
  `;
  return siteCard;
}

function fetchMostVisitedSites() {
  chrome.topSites.get((sites) => {
    const mostVisitedSitesContainer = document.querySelector(".most-visited-sites-container");
    sites.slice(0, 10).forEach((site) => {
      const siteCard = createMostVisitedSiteCard(site);
      mostVisitedSitesContainer.appendChild(siteCard);
    });
  });
}





// Call the fetchMostVisitedSites function when the DOM is loaded
document.addEventListener("DOMContentLoaded", fetchMostVisitedSites);
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




},{}]},{},[1]);
