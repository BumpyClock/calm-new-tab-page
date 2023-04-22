const SUBSCRIBED_FEEDS_KEY = 'subscribedFeeds';
const DEFAULT_FEED_URL = 'https://daringfireball.net/feeds/main';

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

    loadSubscribedFeeds();
    
  } else {
    // Settings page
    setupSubscriptionForm();
    displaySubscribedFeeds();
    setupBackButton();
  }

  if (document.querySelector('#settings-button')) {
    document.getElementById('settings-button').addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
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
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'fetchFeed', feedURL },
      (response) => {
        if (response.success) {
          resolve(response.feed);
        } else {
          reject(response.error);
        }
      }
    );
  });
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
    window.location.href = 'index.html';
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
