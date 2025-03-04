// This script helps load Next.js app in Chrome extension context
(function() {
  // Fix paths in all resources
  function fixPaths() {
    // Remove any base elements
    const baseElements = document.getElementsByTagName('base');
    while (baseElements.length > 0) {
      baseElements[0].remove();
    }
    
    // Get current location to determine relative path prefix
    const isInSubfolder = window.location.pathname.includes('/settings/');
    const pathPrefix = isInSubfolder ? '../' : './';
    
    // Fix script src attributes - both /assets/ (our renamed _next) and other paths
    document.querySelectorAll('script[src]').forEach(script => {
      if (script.src.includes('/assets/')) {
        const newSrc = script.src.replace(/\/assets\//, pathPrefix + 'assets/');
        script.src = newSrc;
      } else if (script.src.startsWith('/')) {
        const newSrc = script.src.replace(/^\//, pathPrefix);
        script.src = newSrc;
      }
    });
    
    // Fix link href attributes
    document.querySelectorAll('link[href]').forEach(link => {
      if (link.href.includes('/assets/')) {
        const newHref = link.href.replace(/\/assets\//, pathPrefix + 'assets/');
        link.href = newHref;
      } else if (link.href.startsWith(window.location.origin + '/')) {
        const newHref = link.href.replace(window.location.origin + '/', pathPrefix);
        link.href = newHref;
      }
    });
    
    // Fix image src attributes
    document.querySelectorAll('img[src]').forEach(img => {
      if (img.src.includes('/assets/')) {
        const newSrc = img.src.replace(/\/assets\//, pathPrefix + 'assets/');
        img.src = newSrc;
      } else if (img.src.startsWith('/')) {
        const newSrc = img.src.replace(/^\//, pathPrefix);
        img.src = newSrc;
      }
    });
  }
  
  // Execute path fixing after DOM content is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixPaths);
  } else {
    fixPaths();
  }
  
  // Also monitor for dynamic changes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        fixPaths();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();