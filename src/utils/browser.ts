// src/utils/browser.ts

/**
 * Check if the browser supports a specific feature
 * @param feature - The feature to check 
 * @returns Boolean indicating if the feature is supported
 */
export function isFeatureSupported(feature: string): boolean {
  switch (feature) {
    case 'serviceWorker':
      return 'serviceWorker' in navigator;
    case 'localStorage':
      try {
        return typeof localStorage !== 'undefined';
      } catch (e) {
        return false;
      }
    case 'indexedDB':
      return typeof indexedDB !== 'undefined';
    case 'webp':
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    case 'touch':
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    case 'darkMode':
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    default:
      return false;
  }
}

/**
 * Create and download a file
 * @param content - The content of the file
 * @param filename - The name of the file
 * @param contentType - The content type of the file
 * @returns Promise that resolves when the file has been downloaded
 */
export function downloadFile(
  content: string,
  filename: string,
  contentType: string = 'text/plain'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([content], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      reject(error);
    }
  });
}

/**
 * Convert a blob to a base64 string
 * @param blob - The blob to convert
 * @returns Promise that resolves with the base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error converting blob to base64:', error);
      reject(error);
    }
  });
}

/**
 * Convert a base64 string to a blob
 * @param base64 - The base64 string to convert
 * @returns Blob created from the base64 string
 */
export function base64ToBlob(base64: string): Blob {
  try {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw error;
  }
}

/**
 * Check if the app is running in a Chrome extension context
 * @returns Boolean indicating if the app is running in a Chrome extension
 */
export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined';
}

/**
 * Get the browser's preferred language
 * @returns The preferred language code
 */
export function getPreferredLanguage(): string {
  return navigator.language || 'en-US';
}

/**
 * Check if the device is a mobile device
 * @returns Boolean indicating if the device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if the app is in dark mode
 * @returns Boolean indicating if dark mode is enabled
 */
export function isDarkMode(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Listen for dark mode changes
 * @param callback - Function to call when dark mode changes
 * @returns Function to remove the listener
 */
export function listenForDarkModeChanges(callback: (isDarkMode: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else {
    // For older browsers
    mediaQuery.addListener(handleChange);
  }
  
  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.removeListener(handleChange);
    }
  };
}

/**
 * Safely parse JSON with error handling
 * @param jsonString - The JSON string to parse
 * @param fallbackValue - The fallback value to return if parsing fails
 * @returns The parsed JSON or fallback value
 */
export function safeJsonParse<T>(jsonString: string, fallbackValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallbackValue;
  }
}

/**
 * Send a message to the extension's background script
 * @param message - The message to send
 * @returns Promise that resolves with the response
 */
export function sendExtensionMessage<T = any, R = any>(message: T): Promise<R> {
  return new Promise((resolve, reject) => {
    if (!isExtensionContext()) {
      reject(new Error('Not in an extension context'));
      return;
    }
    
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response as R);
      }
    });
  });
}