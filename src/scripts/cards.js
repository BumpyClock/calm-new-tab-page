function createElement(tag, properties = {}, textContent = '') {
    const element = document.createElement(tag);
    Object.assign(element, properties);
    element.textContent = textContent;
    return element;
}

function sanitizeHTML(html) {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    return tempElement.textContent;
}

function createImageContainer(thumbnailUrl, siteTitle) {
    const imageContainer = createElement('div', { className: 'image-container loading' });
    const cardbg = createElement('div', { className: 'card-bg' });

    if (thumbnailUrl) {
        imageContainer.innerHTML = `<img data-src="${thumbnailUrl}" id="thumbnail-image" alt="${siteTitle} Thumbnail" class="thumbnail-image lazyload masonry-item">`;
        cardbg.innerHTML = `<div class=noise></div><img data-src="${thumbnailUrl}" alt="${siteTitle} Thumbnail" class="card-bg lazyload">`;
    }

    return { imageContainer, cardbg };
}

async function createCard(item) {
    const docFrag = document.createDocumentFragment();
    const card = createElement('div', { className: 'card' });

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

    applyCardEventHandlers(card, item.link);

    docFrag.appendChild(textContentDiv);
    card.appendChild(docFrag);

    return card;
}
  
function applyCardEventHandlers(card, url) {
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
    const feedContainer = document.getElementById("feed-container");
    const cards = feedContainer.querySelectorAll(".card");
    const eventHandlersRestored = Array.from(cards).map((card) => {
        const linkURL = card.querySelector("a").href; // Example: getting the URL from the card's read more link
        applyCardEventHandlers(card, linkURL);
        return 1;
    }).length;
    console.log(`Restored ${eventHandlersRestored} event handlers`);
}