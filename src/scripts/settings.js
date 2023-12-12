function setupSubscriptionForm() {
    const form = document.getElementById("subscription-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const feedURL = form.elements["feed-url"].value;
      const feeds = getSubscribedFeeds();
      // console.log(feeds);
      feeds.subscribedFeeds.push(feedURL);
      console.log(feeds.subscribedFeeds);
      setSubscribedFeeds(feeds.subscribedFeeds);
      refreshFeeds();
  
      form.reset();
      displaySubscribedFeeds();
    });
  }
  
  function setupBackButton() {
    const backButton = document.getElementById("back-to-main");
    backButton.addEventListener("click", () => {
      window.location.href = "newtab.html";
      //refresh the feeds
    });
  }

  // Modify displaySubscribedFeeds function
  async function displaySubscribedFeeds() {
    const { subscribedFeeds:feeds, feedDetails: feedDetails } = getSubscribedFeeds();
    const list = document.getElementById("subscribed-feeds-list");
    const listfragment = document.createDocumentFragment();
    list.innerHTML = ""; // Clear the list
    list.style.visibility = "hidden";
    list.style.height = "0px";
  
    // Assuming feedDetails is an array of objects with detailed information for each feed
    feedDetails.forEach(async (detail, index) => {
      const feedURL = feeds[index]; // Corresponding URL from feeds array
      if (feedURL != null) {
        console.log(JSON.stringify(feedURL));
        const listItem = document.createElement("li");
  
        // Use details from feedDetails array
        const favicon = document.createElement("img");
        favicon.src = detail.favicon || await getsiteFavicon(new URL(feedURL).hostname); // Use the favicon from feedDetails if available
        favicon.alt = `${detail.siteTitle} Favicon`;
        favicon.className = "site-favicon";
        listItem.appendChild(favicon);
  
        const websiteName = document.createElement("span");
        websiteName.textContent = detail.siteTitle; // Use the siteTitle from feedDetails
        listItem.appendChild(websiteName);
  
        const removeButton = document.createElement("button");
        const removeButtonSpan = document.createElement("span");
        removeButtonSpan.textContent = "close";
        removeButtonSpan.className = "material-symbols-outlined";
        removeButton.appendChild(removeButtonSpan);
        removeButton.className = "remove-feed-button";
        removeButton.addEventListener("click", () => {
          removeFeed(feedURL);
        });
  
        listItem.appendChild(removeButton);
        listfragment.appendChild(listItem);
      }
    });
  
    // Since feedDetails.forEach is non-blocking and we're awaiting inside it,
    // we need to handle the visibility change after all async operations have completed.
    Promise.all(feedDetails.map(async (detail, index) => {
      // any async operation here
    })).then(() => {
      list.style.visibility = "visible";
      list.style.height = "auto";
      list.appendChild(listfragment);
    });
  }
  