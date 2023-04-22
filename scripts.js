const SUBSCRIBED_FEEDS_KEY = 'subscribedFeeds';
const DEFAULT_FEED_URL = 'https://www.theverge.com/rss/index.xml';

document.addEventListener('DOMContentLoaded', () => {
  loadSubscribedFeeds();
  setupSubscriptionForm();
});

function getSubscribedFeeds() {
  return JSON.parse(localStorage.getItem(SUBSCRIBED_FEEDS_KEY)) || [DEFAULT_FEED_URL];
}

function setSubscribedFeeds(feeds) {
  localStorage.setItem(SUBSCRIBED_FEEDS_KEY, JSON.stringify(feeds));
}

async function loadSubscribedFeeds() {
  const feeds = getSubscribedFeeds();
  for (const feedURL of feeds) {
    await loadFeed(feedURL);
  }
}

async function loadFeed(feedURL) {
  const parser = new RSSParser();
  const feed = await parser.parseURL(feedURL);

  const feedContainer = document.getElementById('feed-container');

  feed.items.forEach(item => {
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

function extractThumbnailURL(content) {
  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const match = content.match(imgRegex);
  return match ? match[1] : null;
}
