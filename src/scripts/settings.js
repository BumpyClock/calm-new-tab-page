function setupEventListener(id, eventType, eventHandler) {
  const element = document.getElementById(id);
  element.addEventListener(eventType, eventHandler);
}

async function setupSubscriptionForm() {
  setupEventListener("subscription-form", "submit", async event => {
    event.preventDefault();
    const form = event.target;
    const feedURL = form.elements["feed-url"].value;
    const feeds = getSubscribedFeeds();
    feeds.subscribedFeeds.push(feedURL);
    setSubscribedFeeds(feeds.subscribedFeeds);
    form.reset();
    await clearCache();
    refreshFeeds();
    await displaySubscribedFeeds();
  });
}

function setupUnsubscribeButton(elem, feedUrl) {
  elem.addEventListener("click", async () => {
    removeFeed(feedUrl);
    await clearCache();
    displaySubscribedFeeds();
  });
}

function setupBackButton() {
  setupEventListener("back-to-main", "click", () => {
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
    if ( feedDetails[index].feedUrl != null) {
      const listItem = await createListItem(detail,  feedDetails[index].feedUrl);
      listfragment.appendChild(listItem);
    }
  });

  Promise.all(feedPromises).then(() => {
    list.appendChild(listfragment);
    list.style.visibility = "visible";
    list.style.height = "auto";
  });
}
async function createListItem(detail, feedURL) {
    const listItem = createElement("div", "list-item");
    const bgImageContainer = createElement("div", "bg");
    const faviconSrc = detail.favicon || await getSiteFavicon(new URL(feedURL).hostname);
    const bgImage = createElement("img", "bg lazyload", {"data-src": faviconSrc});
    const noiseLayer = createElement("div", "noise");
    const websiteInfo = createElement("div", "website-info");
    const favicon = createElement("img", "site-favicon", {src: faviconSrc, alt: `${detail.siteTitle} Favicon`});
    const websiteName = createElement("h3", "", {}, detail.siteTitle || detail.feedTitle);
    const feedTitle = createElement("p", "feed-title", {}, detail.feedTitle || detail.siteTitle);
    const feedUrl = createElement("p", "feed-url", {}, feedURL);
    const removeButton = createElement("button", "remove-feed-button");
    const removeButtonText = createElement("p", "unsubscribe-button", {}, "Unsubscribe");
  
    bgImageContainer.append(bgImage, noiseLayer);
    websiteInfo.append(favicon, websiteName, feedTitle, feedUrl);
    removeButton.appendChild(removeButtonText);
    listItem.append(websiteInfo, removeButton, bgImageContainer);
  
    setupEventListener(removeButton, "click", async () => {
      removeFeed(feedURL);
      await clearCache();
      displaySubscribedFeeds();
    });
  
    return listItem;
  }

function createElement(tag, className, attributes = {}, textContent = '') {
  const element = document.createElement(tag);
  element.className = className;
  if (typeof attributes === 'object' && attributes !== null) {
    Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
  }
  element.textContent = textContent;
  return element;
}

function setupEventListener(element, eventType, eventHandler) {
  if (typeof element === 'string') {
    element = document.getElementById(element);
  }
  element.addEventListener(eventType, eventHandler);
}

function setupToggle(id, getter, setter) {
  const toggle = document.getElementById(id);
  toggle.checked = getter();
  toggle.addEventListener("change", () => {
    setter(toggle.checked);
  });
}

function setupFeedDiscoveryToggle() {
  setupToggle("feed-discovery-toggle", getFeedDiscovery, setFeedDiscovery);
}

function setupSearchPreferenceToggle() {
  setupToggle("search-preference-toggle", getSearchPreference, setSearchPreference);
}

async function setupApiUrlFormEventHandler() {
  const apiUrlForm = document.getElementById("apiUrl-form");
  const apiUrlInput = document.getElementById("apiUrl-input");
  apiUrlInput.value = await getApiUrl();
  const apiUrlSubmitButton = document.getElementById("apiUrl-submit-button");

  apiUrlForm.addEventListener("submit", event => {
    event.preventDefault();
    setApiUrl(apiUrlInput.value);
  });

  apiUrlSubmitButton.addEventListener("click", () => {
    setApiUrl(apiUrlInput.value);
  });
}