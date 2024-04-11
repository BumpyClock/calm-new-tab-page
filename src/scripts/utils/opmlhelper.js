
// Function to handle file upload 
function handleFileUpload(file) {

    console.log("🚀 ~ handleFileUpload ~ file", file);
    // Check if the file is an OPML file
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
        
          let urls = [];
          const outlines = xmlDoc.getElementsByTagName("outline");
          for (let i = 0; i < outlines.length; i++) {
            const outline = outlines[i];
            if (outline.getAttribute("type") === "rss") {
              const xmlUrl = outline.getAttribute("xmlUrl");
              if (xmlUrl) {
                urls.push(xmlUrl);
              }
            }
          }
          console.log("Imported URLs:", urls);
        
updateSubscribedFeeds(urls);        };
        reader.readAsText(file);
      }
    // Return an empty array if the file is not an OPML file
    return [];
}