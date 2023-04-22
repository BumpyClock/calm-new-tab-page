document.addEventListener('DOMContentLoaded', loadFeeds);

async function loadFeeds() {
  const parser = new RSSParser();
  const feedURL = 'https://www.theverge.com/rss/index.xml';
  const feed = await parser.parseURL(feedURL);

  const feedContainer = document.getElementById('feed-container');

  feed.items.forEach(item => {
    const card = createCard(item);
    feedContainer.appendChild(card);
  });
}
function createCard(item) {
  const card = document.createElement('div');
  card.className = 'card';

  const img = document.createElement('img');
  const thumbnailURL = extractThumbnailURL(item.content);
  if (thumbnailURL) {
    img.src = thumbnailURL;
  }
  card.appendChild(img);

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
    const readMoreBtn = document.createElement('button');
    readMoreBtn.textContent = 'Read more';
    readMoreBtn.addEventListener('click', () => {
      if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
        readMoreBtn.textContent = 'Read more';
      } else {
        card.classList.add('expanded');
        readMoreBtn.textContent = 'Show less';
      }
    });
    textContentDiv.appendChild(readMoreBtn);
  }

  card.appendChild(textContentDiv);

  return card;
}


function extractThumbnailURL(content) {
  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const match = content.match(imgRegex);
  return match ? match[1] : null;
}
