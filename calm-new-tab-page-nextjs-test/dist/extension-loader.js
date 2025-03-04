// This script helps load Next.js app in Chrome extension context
(function() {
    // Helper function to fix paths in elements
    function fixPaths() {
      // Remove any base elements
      const baseElements = document.getElementsByTagName('base');
      while (baseElements.length > 0) {
        baseElements[0].remove();
      }
      
      // Fix script src attributes
      document.querySelectorAll('script[src]').forEach(script => {
        if (script.src.startsWith('/')) {
          script.src = '.' + script.src;
        }
      });
      
      // Fix link href attributes
      document.querySelectorAll('link[href]').forEach(link => {
        if (link.href.startsWith('/')) {
          link.href = '.' + link.href;
        }
      });
      
      // Fix image src attributes
      document.querySelectorAll('img[src]').forEach(img => {
        if (img.src.startsWith('/')) {
          img.src = '.' + img.src;
        }
      });
    }
    
    // Execute path fixing after DOM content is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixPaths);
    } else {
      fixPaths();
    }
    
    // Also handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.tagName) {
              if (node.tagName === 'SCRIPT' && node.src && node.src.startsWith('/')) {
                node.src = '.' + node.src;
              } else if (node.tagName === 'LINK' && node.href && node.href.startsWith('/')) {
                node.href = '.' + node.href;
              } else if (node.tagName === 'IMG' && node.src && node.src.startsWith('/')) {
                node.src = '.' + node.src;
              }
            }
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  })();