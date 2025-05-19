// src/components/background/BingBackground.tsx
import { useEffect, useState, FC } from 'react';
import { useSettings } from '../../context';

interface BingImage {
  imageBlob: Blob;
  title: string;
  copyright: string;
}

/**
 * Convert a Base64 string to a Blob
 * @param base64 - Base64 encoded string
 * @returns Blob object created from the Base64 string
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

/**
 * BingBackground component displays the Bing image of the day as a background
 */
const BingBackground: FC = () => {
  const [bingImage, setBingImage] = useState<BingImage | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    // Only fetch the Bing background if enabled in settings
    if (!settings.showBingBackground) {
      return;
    }

    const fetchCachedImage = async (): Promise<void> => {
      try {
        const result = await chrome.storage.local.get(["bingImageCache"]);
        
        if (result.bingImageCache?.imageBlob) {
          const { imageBlob, title, copyright } = result.bingImageCache;

          // Verify that imageBlob is a string
          if (typeof imageBlob !== 'string') {
            console.error('Invalid image blob format in cache');
            return;
          }

          // Convert Base64 to Blob
          const blob = base64ToBlob(imageBlob);
          setBingImage({ imageBlob: blob, title, copyright });
        } else {
          // Send message to trigger the fetch
          chrome.runtime.sendMessage({ action: 'fetchBingImage' });
        }
      } catch (error) {
        console.error('Error fetching cached Bing image:', error);
      }
    };

    const handleBingImageResponse = (message: any): void => {
      if (message.action === 'bingImageResponse' && message.imageBlob) {
        // Verify that imageBlob is a string
        if (typeof message.imageBlob !== 'string') {
          console.error('Invalid image blob format in response');
          return;
        }

        try {
          // Convert Base64 to Blob
          const blob = base64ToBlob(message.imageBlob);

          setBingImage({
            imageBlob: blob,
            title: message.title || 'Bing Image of the Day',
            copyright: message.copyright || '',
          });
        } catch (error) {
          console.error('Error processing Bing image:', error);
        }
      }
    };

    fetchCachedImage();
    chrome.runtime.onMessage.addListener(handleBingImageResponse);

    return () => {
      chrome.runtime.onMessage.removeListener(handleBingImageResponse);
      // Clean up any object URL when component unmounts
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [settings.showBingBackground]);

  // Create object URL when bingImage changes
  useEffect(() => {
    if (bingImage?.imageBlob) {
      // Revoke previous object URL if it exists
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      
      // Create new object URL
      const newObjectUrl = URL.createObjectURL(bingImage.imageBlob);
      setObjectUrl(newObjectUrl);
      
      // Clean up function to revoke URL when component unmounts or bingImage changes
      return () => {
        URL.revokeObjectURL(newObjectUrl);
      };
    }
  }, [bingImage]);

  // Don't render anything if background is disabled
  if (!settings.showBingBackground) {
    return null;
  }

  // Display placeholder if no image is available
  if (!bingImage || !objectUrl) {
    return <div className="bing-background-base bing-background-placeholder" />;
  }

  return (
    <div
      className="bing-background-base bing-background-image"
      style={{ backgroundImage: `url(${objectUrl})` }}
      aria-label={bingImage.title}
      title={`${bingImage.title} - ${bingImage.copyright}`}
    />
  );
};

export default BingBackground;