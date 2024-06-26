async function showReaderView(url) {
  try {
      const response = await fetch(url, {
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Host': new URL(url).hostname,
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

      const html = await response.text();
      console.log("response", html);
      // const pure = DOMPurify.sanitize(html);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const reader = new Readability(doc);
      article = reader.parse();
      const item = findItemFromUrl(getFeedItems(), url);

    if (article) {
      const readerViewModal = createReaderViewModal(article);
      console.log("article", article);
      // console.log("Article Title", article.title);
      document.body.appendChild(readerViewModal);
      setTimeout(() => {
        readerViewModal.classList.add("visible");
      }, 10);
      toggleBodyScroll(false);

      // Add website name and favicon
      const websiteInfoDiv = document.createElement("div");
      websiteInfoDiv.className = "website-info";

      const favicon = document.createElement("img");
      const mainDomain = new URL(url).hostname;
      favicon.src = item.favicon;
      favicon.alt = `${mainDomain} Favicon`;
      favicon.className = "site-favicon";
      websiteInfoDiv.appendChild(favicon);

      const websiteName = document.createElement("span");
      websiteName.textContent = item.siteTitle;
      websiteInfoDiv.appendChild(websiteName);

      readerViewModal
        .querySelector("#website-info-placeholder")
        .appendChild(websiteInfoDiv);

      // Check if content overflows
      const contentHeight = readerViewModal.querySelector(
        ".reader-view-page-text"
      );
      const contentContainerHeight = readerViewModal.querySelector(
        ".reader-view-content"
      );
      const progressRing = document.getElementById("progress-ring");
      if (contentHeight.clientHeight < contentContainerHeight.clientHeight) {
        progressRing.style.display = "none";
      }
    } else {
      console.error("Failed to fetch readable content.");
    }
  } catch (error) {
    console.error("Error fetching the page content:", error);
  }
}
function findItemFromUrl(feedItems, url) {
  for (let item of feedItems) {
    if (item.link === url) {
      return item;
    }
  }
  return null; // return null if no matching item is found
}

function createReaderViewModal(article) {
  // console.log("article", article);
  // console.log("Article Title", article.title);
  const modal = document.createElement("div");
  modal.className = "reader-view-modal";
  modal.innerHTML = `
    <div class="noise"></div>
      <div class="reader-view-content ">
        
        <div class="reader-view-page-content">
          <div class="reader-view-header">
            <span class="reader-view-close material-symbols-rounded">close</span>
            <h1 class="reader-view-title"><span id="website-info-placeholder"></span>${article.title}</h1>
            ${article.byline
              ? `<h4 class="reader-view-author">${article.byline}</h4>`
              : ""}
            <p class="reader-view-reading-time">${estimateReadingTime(
              article.textContent
            )} minutes</p>
            <hr class="solid">
          </div>
          <div class="reader-view-page-text">
            <div class="reader-view-article">${article.content}</div>
          </div>
        </div>
        <div id="progress-ring" class="progress-indicator-container"></div>
      </div>
      
    `;

  modal.querySelector(".reader-view-close").onclick = () => {
    modal.style.opacity = "0";
    modal.addEventListener(
      "transitionend",
      function() {
        closeModal(modal);
      },
      { once: true }
    );
    toggleBodyScroll(true);
  };
  modal.addEventListener("click", event => {
    const readerViewContent = modal.querySelector(".reader-view-content");

    if (!readerViewContent.contains(event.target)) {
      modal.style.opacity = "0";
      modal.addEventListener(
        "transitionend",
        function() {
          closeModal(modal);
        },
        { once: true }
      );
      toggleBodyScroll(true);
    }
  });

  const progressIndicator = createCircularProgressIndicator();
  modal
    .querySelector(".progress-indicator-container")
    .appendChild(progressIndicator);
  const progressCircle = progressIndicator.querySelector(
    ".progress-circle__progress"
  );
  const pageText = modal.querySelector(".reader-view-content");
  pageText.addEventListener("scroll", () =>
    updateReadingProgress(progressCircle, pageText)
  );
  modal.addEventListener("wheel", handleModalScroll, {
    passive: false,
    capture: true
  });
  modal.addEventListener("touchstart", handleModalTouch, { passive: false });
  modal.addEventListener("touchmove", handleModalTouch, { passive: false });

  return modal;
}

function closeModal(modal) {
  modal.removeEventListener("wheel", handleModalScroll);
  modal.removeEventListener("touchstart", handleModalTouch);
  modal.removeEventListener("touchmove", handleModalTouch);

  modal.remove();
}

function handleModalScroll(event) {
  console.log("handling modal scroll");
  const modal = document.querySelector(".reader-view-modal");
  const readerArticle = modal.querySelector(".reader-view-content");
  if (event.target === readerArticle || readerArticle.contains(event.target)) {
    readerArticle.scrollTop += event.deltaY;
    startY += event.deltaY;
    event.preventDefault();
  } else if (event.target === modal || modal.contains(event.target)) {
    readerArticle.scrollTop += event.deltaY;
    startY += event.deltaY;
    // Allow scroll on modal content (optional)
    event.preventDefault(); // Uncomment to prevent page scroll behind modal
  }
}

function handleModalTouch(event) {
  const modal = document.querySelector(".reader-view-modal");
  const readerArticle = modal.querySelector(".reader-view-content");

  switch (event.type) {
    case "touchstart":
      startY = event.touches[0].pageY;
      break;
    case "touchmove":
      const deltaY = startY - event.touches[0].pageY;
      startY = event.touches[0].pageY;

      if (
        event.target === readerArticle ||
        readerArticle.contains(event.target)
      ) {
        readerArticle.scrollTop += deltaY;
        event.preventDefault();
      } else if (event.target === modal || modal.contains(event.target)) {
        readerArticle.scrollTop += deltaY;
        event.preventDefault();
      }
      break;
  }
}

//Reading progress indicator code

function createCircularProgressIndicator() {
  const progressIndicator = document.createElement("div");
  progressIndicator.className = "progress-indicator";

  progressIndicator.innerHTML = `
      <svg id="progress-ring" class="progress-circle" viewBox="0 0 36 36">
        <circle class="progress-circle__background" cx="18" cy="18" r="15.9155" stroke-width="2"></circle>
        <circle class="progress-circle__progress" cx="18" cy="18" r="15.9155" stroke-width="2" stroke-dasharray="100" stroke-dashoffset="100"></circle>
      </svg>
    `;

  return progressIndicator;
}

function updateReadingProgress(progressCircle, pageText) {
  const scrollPosition = pageText.scrollTop;
  const maxScroll = pageText.scrollHeight - pageText.clientHeight;

  const progressPercentage = scrollPosition / maxScroll * 100;

  setCircularProgress(progressCircle, progressPercentage);
}

function setCircularProgress(progressIndicator, progressPercentage) {
  const radius = progressIndicator.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  const offset = circumference - progressPercentage / 100 * circumference;
  progressIndicator.style.strokeDashoffset = offset;
}

//function to estimate reading time
function estimateReadingTime(text) {
  const wordsPerMinute = 183; // Adjust this value based on your preferred reading speed
  const words = text.trim().split(/\s+/).length;
  const readingTimeInMinutes = Math.ceil(words / wordsPerMinute);

  return readingTimeInMinutes;
}

function toggleBodyScroll(isEnabled) {
  if (isEnabled) {
    document.body.style.overflow = "";
  } else {
    document.body.style.overflow = "hidden";
  }
}
