async function setupSubscriptionForm() {
  const form = document.getElementById("subscription-form");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const feedURL = form.elements["feed-url"].value;
    const feeds = getSubscribedFeeds();
    feeds.subscribedFeeds.push(feedURL);
    console.log(`Settings: New feed added: ${feeds.subscribedFeeds}`);
    setSubscribedFeeds(feeds.subscribedFeeds);
    form.reset();
    await clearCachedRenderedCards();
    cachedCards = null;
    refreshFeeds();
    await displaySubscribedFeeds();
  });
}

function setupUnsubscribeButton(elem, feedUrl) {
  elem.addEventListener("click", async () => {
    removeFeed(feedUrl);
    await clearCachedRenderedCards();
    cachedCards = null;
    console.log(`Removing feed: ${feedUrl}`);
    displaySubscribedFeeds();
  });
}

function setupBackButton() {
  const backButton = document.getElementById("back-to-main");
  backButton.addEventListener("click", () => {
    window.location.href = "newtab.html";
  });
}

async function displaySubscribedFeeds() {
  const { subscribedFeeds: feeds, feedDetails } = getSubscribedFeeds();
  const list = document.getElementById("subscribed-feeds-list");
  if (list === null) return;
  list.innerHTML = ""; // Clear the list
  list.style.visibility = "hidden";
  list.style.height = "0px";

  const listfragment = document.createDocumentFragment();

  const feedPromises = feedDetails.map(async (detail, index) => {
    const feedURL = feeds[index]; // Corresponding URL from feeds array
    if (feedURL != null) {
      const listItem = await createListItem(detail, feedURL);
      listfragment.appendChild(listItem);
    }
  });

  // Since feedDetails.map is non-blocking and we're awaiting inside it,
  // we need to handle the visibility change after all async operations have completed.
  Promise.all(feedPromises).then(() => {
    list.appendChild(listfragment);
    list.style.visibility = "visible";
    list.style.height = "auto";
  });
}

async function createListItem(detail, feedURL) {
  const listItem = document.createElement("div");
  listItem.className = "list-item";

  const bgImageContainer = document.createElement("div");
  bgImageContainer.className = "bg";

  const bgImage = document.createElement("img");
  bgImage.setAttribute("data-src", detail.favicon);
  bgImage.className = "bg lazyload";
  bgImageContainer.appendChild(bgImage);

  const noiseLayer = document.createElement("div");
  noiseLayer.className = "noise";
  bgImageContainer.appendChild(noiseLayer);

  const websiteInfo = document.createElement("div");
  websiteInfo.className = "website-info";

  const favicon = document.createElement("img");
  favicon.src = detail.favicon || (await getSiteFavicon(new URL(feedURL).hostname)); // Use the favicon from feedDetails if available
  favicon.alt = `${detail.siteTitle} Favicon`;
  favicon.className = "site-favicon";
  websiteInfo.appendChild(favicon);

  const websiteName = document.createElement("h3");
  websiteName.textContent = detail.siteTitle || detail.feedTitle; // Use the siteTitle from feedDetails
  websiteInfo.appendChild(websiteName);

  const feedTitle = document.createElement("p");
  feedTitle.textContent = detail.feedTitle || detail.siteTitle; // Use the feedTitle from feedDetails
  feedTitle.className = "feed-title";
  websiteInfo.appendChild(feedTitle);

  const feedUrl = document.createElement("p");
  feedUrl.className = "feed-url";
  feedUrl.textContent = feedURL;
  websiteInfo.appendChild(feedUrl);

  listItem.appendChild(websiteInfo);

  const removeButton = document.createElement("button");
  removeButton.className = "remove-feed-button";
  const removeButtonText = document.createElement("p");
  removeButtonText.textContent = "Unsubscribe";
  removeButtonText.className = "unsubscribe-button";
  removeButton.appendChild(removeButtonText);
  setupUnsubscribeButton(removeButton, feedURL);

  listItem.appendChild(removeButton);
  listItem.appendChild(bgImageContainer);

  return listItem;
}