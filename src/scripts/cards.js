async function createCard(item) {
    const docFrag = document.createDocumentFragment();
    const card = document.createElement("div");
    var tempElement = document.createElement("div");
    card.className = "card";
  
    // Image container
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container loading";
  
    // Card background
    const cardbg = document.createElement("div");
    cardbg.className = "card-bg";
  
    // Set thumbnail URL
    let thumbnailUrl = item.thumbnail;
  
    if (Array.isArray(item.thumbnail)) {
      //parse the array and get the first item that has a url or link property
      for (const thumbnail of item.thumbnail) {
        if (thumbnail.url) {
          thumbnailUrl = thumbnail.url;
          break;
        } else if (thumbnail.link) {
          thumbnailUrl = thumbnail.link;
          break;
        }
      }
    }
    if (thumbnailUrl) {
      imageContainer.innerHTML = `<img data-src="${thumbnailUrl}" id="thumbnail-image" alt="${item.siteTitle} Thumbnail" class="thumbnail-image lazyload masonry-item">`;
      cardbg.innerHTML = `<div class=noise></div><img data-src="${thumbnailUrl}" alt="${item.siteTitle} Thumbnail" class="card-bg lazyload">`;
      docFrag.appendChild(imageContainer);
      docFrag.appendChild(cardbg);
    }
  
    // Text content container
    const textContentDiv = document.createElement("div");
    textContentDiv.classList.add("text-content");
  
    // Website information
    const websiteInfoDiv = document.createElement("div");
    websiteInfoDiv.className = "website-info";
    if (!thumbnailUrl) {
      websiteInfoDiv.style.marginTop = "12px";
    }
  
    // Favicon
    const favicon = document.createElement("img");
    favicon.src = item.favicon;
    favicon.alt = `${item.siteTitle} Favicon`;
    favicon.className = "site-favicon";
    websiteInfoDiv.appendChild(favicon);
  
    // Website name
    const websiteName = document.createElement("p");
    tempElement.innerHTML = item.feedTitle || item.siteTitle;
    websiteName.textContent = tempElement.textContent;
    websiteInfoDiv.appendChild(websiteName);
    textContentDiv.appendChild(websiteInfoDiv);
  
    // Title
    const title = document.createElement("h3");
    tempElement.innerHTML = item.title;
    title.textContent = tempElement.textContent;
    textContentDiv.appendChild(title);
  
    // Description
    if (item.content) {
      try {
        const snippet = document.createElement("p");
        snippet.className = "description";
  
        // Sanitize item.content
        const sanitizedContent = DOMPurify.sanitize(item.content);
  
        // Check sanitizedContent for SVG elements before setting it as the innerHTML of tempElement
        const svgRegex = /<svg.*?>.*?<\/svg>|<path.*?>.*?<\/path>/g;
        if (svgRegex.test(sanitizedContent)) {
          tempElement.textContent = "";
        } else {
          tempElement.innerHTML = sanitizedContent;
          snippet.textContent = tempElement.textContent;
          textContentDiv.appendChild(snippet);
        }
      } catch (error) {
        console.log(
          `Error creating content snippet for : ${item.content} `,
          error
        );
      }
    }
  
    // Publication date and time
    const date = new Date(item.published);
    const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const details = document.createElement("div");
    details.className = "date";
    details.textContent = dateString;
    textContentDiv.appendChild(details);
  
    // Description
    if (!thumbnailUrl && item.description) {
      const description = document.createElement("div");
      description.className = "description long-description";
      description.textContent = item.description;
      textContentDiv.appendChild(description);
    }
  
    // Read more link
    const readMoreLink = document.createElement("a");
    readMoreLink.href = item.link;
    readMoreLink.target = "_blank";
    readMoreLink.textContent = "Read more";
    readMoreLink.className = "read-more-link";
    textContentDiv.appendChild(readMoreLink);
  
    // Event handler for card click
    applyCardEventHandlers(card, item.link);
  
    // Append text content to the card
    docFrag.appendChild(textContentDiv);
  
    // Append the document fragment to the card
    card.appendChild(docFrag);
  
    return card;
  }
  
  async function applyCardEventHandlers(card, url) {
    // Event listener for card click
  
    try {
      card.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() !== "a") {
          showReaderView(url);
        }
      });
    } catch (error) {
      console.log(error, "error in applyCardEventHandlers", url);
    }
  }
  
  function reapplyEventHandlersToCachedCards() {
    console.log("reapplying event handlers to cached cards");
    let eventHandlersRestored = 0;
    const feedContainer = document.getElementById("feed-container");
    const cards = feedContainer.querySelectorAll(".card");
    cards.forEach((card) => {
      const linkURL = card.querySelector("a").href; // Example: getting the URL from the card's read more link
      applyCardEventHandlers(card, linkURL);
      eventHandlersRestored++;
    });
    console.log(`Restored ${eventHandlersRestored} event handlers`);
  }