"use client";

import { useEffect, useState } from 'react';
import { fetchBingImage } from '@/lib/api';
import { BingImage } from '@/types';

export default function BackgroundImage() {
  const [image, setImage] = useState<BingImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBackgroundImage = async () => {
      try {
        // In Chrome extension, fetchBingImage will use the background service worker
        // In the web app version, it will use the API
        const newImage = await fetchBingImage();
        setImage(newImage);
      } catch (error) {
        console.error('Failed to load background image:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Handle messages from background service worker (for Chrome extension)
    const handleBackgroundMessage = (message: any) => {
      if (message.action === 'bingImageResponse' && message.imageBlob) {
        // Convert blob to URL
        const imageUrl = URL.createObjectURL(message.imageBlob);
        
        setImage({
          url: imageUrl,
          title: message.title,
          copyright: message.copyright,
        });
        
        setIsLoading(false);
      }
    };
    
    // Add listener for Chrome extension environment
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleBackgroundMessage);
    }
    
    loadBackgroundImage();
    
    // Clean up
    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleBackgroundMessage);
      }
      
      // Revoke URLs
      if (image?.url && image.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }
    };
  }, []);

  // Handle scroll effect for background image
  useEffect(() => {
    const handleScroll = () => {
      if (!image) return;
      
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      const blurIntensity = Math.min(scrollPosition / 100, 10);
      const darkIntensity = Math.min(scrollPosition / 1000, 0.4);
      
      const bgImage = document.getElementById('background-image');
      if (bgImage) {
        bgImage.style.filter = `blur(${blurIntensity}px) brightness(${0.7 - darkIntensity})`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [image]);

  if (isLoading) {
    return (
      <div className="background-image-container fixed inset-0 -z-10 bg-black/50" />
    );
  }

  if (!image) return null;

  return (
    <div className="background-image-container fixed inset-0 -z-10">
      <img 
        id="background-image"
        src={image.url} 
        alt={image.title} 
        className="w-[105%] h-[105%] object-cover brightness-[0.7] -top-[2.5%] -left-[2.5%] fixed transition-all duration-100"
      />
      
      <div className="attribution-container absolute top-6 left-6 p-2.5 text-white text-xs opacity-75 hover:opacity-100 z-[-1]">
        <p className="attribution-title font-bold opacity-75 hover:opacity-100">{image.title}</p>
        <p className="attribution-copyright italic">{image.copyright} | Bing & Microsoft</p>
      </div>
    </div>
  );
}