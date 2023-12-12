function setupSubscriptionForm() {
    const form = document.getElementById("subscription-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const feedURL = form.elements["feed-url"].value;
      const feeds = getSubscribedFeeds();
      feeds.push(feedURL);
      console.log(feeds);
      setSubscribedFeeds(feeds);
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
    const feeds = getSubscribedFeeds();
    const list = document.getElementById("subscribed-feeds-list");
    const listfragment = document.createDocumentFragment();
    list.innerHTML = ""; // Clear the list
    list.style.visibility = "hidden";
    list.style.height = "0px";
    
  
    for (const feedURL of feeds) {
      if (feedURL != null) {
        const listItem = document.createElement("li");
  
        // Add website favicon
        const favicon = document.createElement("img");
  
        const mainDomain = new URL(feedURL).hostname;
        favicon.src = await getsiteFavicon(mainDomain);
        favicon.alt = `${mainDomain} Favicon`;
        favicon.className = "site-favicon";
        listItem.appendChild(favicon);
  
        // Add website name
        const websiteName = document.createElement("span");
        const siteTitle = await getWebsiteTitle(feedURL);
        websiteName.textContent = siteTitle;
        listItem.appendChild(websiteName);
  
        const removeButton = document.createElement("button");
        const removeButtonSpan = document.createElement("span");
        removeButtonSpan.textContent = "\nclose\n";
        removeButtonSpan.className = "material-symbols-outlined";
        removeButton.appendChild(removeButtonSpan);
        removeButton.className = "remove-feed-button";
        removeButton.addEventListener("click", () => {
          removeFeed(feedURL);
        });
  
        listItem.appendChild(removeButton);
  
        listfragment.appendChild(listItem);
      }
    }
     list.style.visibility = "visible";
    list.style.height = "auto";
    list.appendChild(listfragment);
   
  }