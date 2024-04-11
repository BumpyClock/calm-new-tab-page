function createElement(tag, properties = {}, textContent = '') {
    const element = document.createElement(tag);
    Object.assign(element, properties);
    element.textContent = textContent;
    return element;
}

function sanitizeHTML(html) {
    const tempElement = document.createElement('div');
    tempElement.textContent = html;
    return tempElement.textContent;
}

function createImageContainer(thumbnailUrl, siteTitle) {
    const imageProxyURL = "https://digests-imgproxy-a4crwf5b7a-uw.a.run.app/unsafe/rs:fit:0:300:0/g:no/plain/" + thumbnailUrl+"@webp";
    const imageContainer = createElement('div', { className: 'image-container loading' });
    const cardbg = createElement('div', { className: 'card-bg' });

    if (thumbnailUrl) {
        imageContainer.innerHTML = `<img data-src="${thumbnailUrl}" id="thumbnail-image" alt="${siteTitle} Thumbnail" class="thumbnail-image lazyload masonry-item">`;
        cardbg.innerHTML = `<div class=noise></div><img data-src="${thumbnailUrl}" alt="${siteTitle} Thumbnail" class="card-bg lazyload">`;
       
    }

    return { imageContainer, cardbg };
}

function createCard(item) {
    const docFrag = document.createDocumentFragment();
   // Usage in your createCard function
  const boxShadow = generateBoxShadow(item.thumbnailColor, 5, 0.3, 4);
  const card = createElement('div', {
    className: 'card',
    style: `box-shadow: ${boxShadow}`,
    
  });
  card.style.opacity = 0;


    // Set thumbnail URL
    let thumbnailUrl = item.thumbnail;
    if (Array.isArray(item.thumbnail)) {
        thumbnailUrl = item.thumbnail.find(thumbnail => thumbnail.url || thumbnail.link)?.url;
    }

    const { imageContainer, cardbg } = createImageContainer(thumbnailUrl, item.siteTitle);
    docFrag.append(imageContainer, cardbg);

    const textContentDiv = createElement('div', { className: 'text-content' });

    const websiteInfoDiv = createElement('div', { className: 'website-info', style: thumbnailUrl ? {} : { marginTop: '12px' } });
    const favicon = createElement('img', { src: item.favicon, alt: `${item.siteTitle} Favicon`, className: 'site-favicon' });
    const websiteName = createElement('p', {}, sanitizeHTML(item.feedTitle || item.siteTitle));

    websiteInfoDiv.append(favicon, websiteName);
    textContentDiv.appendChild(websiteInfoDiv);

    const title = createElement('h3', {}, sanitizeHTML(item.title));
    textContentDiv.appendChild(title);

    if (item.content) {
        try {
            const sanitizedContent = DOMPurify.sanitize(item.content);
            const svgRegex = /<svg.*?>.*?<\/svg>|<path.*?>.*?<\/path>/g;
            if (!svgRegex.test(sanitizedContent)) {
                const snippet = createElement('p', { className: 'description' }, sanitizeHTML(sanitizedContent));
                textContentDiv.appendChild(snippet);
            }
        } catch (error) {
            console.log(`Error creating content snippet for : ${item.content} `, error);
        }
    }

    const date = new Date(item.published);
    const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const details = createElement('div', { className: 'date' }, dateString);
    textContentDiv.appendChild(details);

    if (!thumbnailUrl && item.description) {
        const description = createElement('div', { className: 'description long-description' }, item.description);
        textContentDiv.appendChild(description);
    }

    const readMoreLink = createElement('a', { href: item.link, target: '_blank', className: 'read-more-link' }, 'Read more');
    textContentDiv.appendChild(readMoreLink);
    if(item.thumbnailUrl){

    img = imageContainer.querySelector('.thumbnail-image');
    img.addEventListener('load', () => {
        card.style.transition = 'all 0.5s ease-in-out';

        card.style.opacity = 1;
    });
}
else {
    card.style.transition = 'all 0.5s ease-in-out';

    card.style.opacity = 1;
}

    applyCardEventHandlers(card, item.link, item.thumbnailColor);

    docFrag.appendChild(textContentDiv);
    card.appendChild(docFrag);

    return card;
}
  
function applyCardEventHandlers(card, url, color) {
    try {
        card.addEventListener("click", (e) => {
            if (e.target.tagName.toLowerCase() !== "a") {
                showReaderView(url);
            }
        });

        card.addEventListener("mouseover", () => {
            const boxShadowHover = generateBoxShadow(color, 8, 0.4, 5);
            card.style.boxShadow = boxShadowHover;
        });

        card.addEventListener("mouseout", () => {
            const boxShadowNormal = generateBoxShadow(color, 5, 0.3, 4);
            card.style.boxShadow = boxShadowNormal;
        });

        card.addEventListener("mousedown", () => {
            const boxShadowActive = generateBoxShadow(color, 4, 0.4, 3);
            card.style.boxShadow = boxShadowActive;
        });
    } catch (error) {
        console.log(error, "error in applyCardEventHandlers", url);
    }
}

function reapplyEventHandlersToCachedCards() {
    console.log("reapplying event handlers to cached cards");
    const feedContainer = document.getElementById("feed-container");
    const cards = feedContainer.querySelectorAll(".card");
    const eventHandlersRestored = Array.from(cards).filter((card) => {
        const linkURL = card.querySelector("a").href; // Example: getting the URL from the card's read more link
        applyCardEventHandlers(card, linkURL);
        return true;
    }).length;
    console.log(`Restored ${eventHandlersRestored} event handlers`);
}