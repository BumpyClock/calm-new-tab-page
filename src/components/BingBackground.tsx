import { useEffect, useState } from 'react';

interface BingImage {
  imageBlob: Blob;
  title: string;
  copyright: string;
}

/**
 * Convert a Base64 string to a Blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

const BingBackground = () => {
  console.log('BingBackground component initialized');
  const [bingImage, setBingImage] = useState<BingImage | null>(null);

  useEffect(() => {
    const fetchCachedImage = async () => {
      try {
        const result = await chrome.storage.local.get(["bingImageCache"]);
        console.log("🚀 ~ fetchCachedImage ~ result:", result)
        if (result.bingImageCache) {
          console.log('Using cached Bing image from storage');
          const { imageBlob, title, copyright } = result.bingImageCache;
          console.log("🚀 ~ fetchCachedImage ~ imageBlob:", imageBlob)

          if(!imageBlob){
            console.log("🚀 ~ fetchCachedImage ~ imageBlob is undefined", imageBlob)
            return;
          }

          // Verify that imageBlob is a string
          if (typeof imageBlob !== 'string') {
            console.log("🚀 ~ fetchCachedImage ~ imageBlob:", imageBlob.length)
            console.error('imageBlob is not a string:', imageBlob);
            return;
          }

          // Convert Base64 to Blob
          const blob = base64ToBlob(imageBlob);

          setBingImage({ imageBlob: blob, title, copyright });
        } else {
          console.log('No cached Bing image found, fetching...');
          // Send message to trigger the fetch
          chrome.runtime.sendMessage({ action: 'fetchBingImage' });
        }
      } catch (error) {
        console.error('Error fetching cached Bing image:', error);
      }
    };

    const listener = (message: any) => {
      if (message.action === 'bingImageResponse') {
        console.log('Received bingImageResponse message:', message);

        // Verify that imageBlob is a string
        if (typeof message.imageBlob !== 'string') {
          console.error('message.imageBlob is not a string:', message.imageBlob);
          return;
        }

        // Convert Base64 to Blob
        const blob = base64ToBlob(message.imageBlob);

        setBingImage({
          imageBlob: blob,
          title: message.title,
          copyright: message.copyright,
        });
      }
    };

    fetchCachedImage(); // Fetch cached image on component mount
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      console.log('BingBackground listener removed');
    };
  }, []);

  if (!bingImage) {
    console.log('No Bing image available');
    return <div className="bing-background-base bing-background-placeholder" />;
  }

  // Convert blob to URL
  const imageUrl = URL.createObjectURL(bingImage.imageBlob);
  console.log('Generated imageUrl:', imageUrl);

  return (
    <div
      className="bing-background-base bing-background-image"
      style={{ backgroundImage: `url(${imageUrl})` }}
      aria-label={bingImage.title}
    />
  );
};

export default BingBackground;