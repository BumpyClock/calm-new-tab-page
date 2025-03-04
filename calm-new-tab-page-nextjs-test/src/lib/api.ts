import { FetchFeedsResponse, ReaderViewResponse, Feed, FeedItem, BingImage } from '@/types';

// Get API URL from storage or use default
const getApiUrl = async (): Promise<string> => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    // Chrome extension environment
    return new Promise((resolve) => {
      chrome.storage.local.get('apiUrl', (result) => {
        resolve(result.apiUrl || 'https://api.digests.app');
      });
    });
  } else if (typeof localStorage !== 'undefined') {
    // Browser environment fallback
    return localStorage.getItem('apiUrl') || 'https://api.digests.app';
  }
  
  // Default fallback
  return 'https://api.digests.app';
};

export async function fetchFeeds(urls: string[]): Promise<FetchFeedsResponse> {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Chrome extension environment - use message passing
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'fetchRSS', feedUrls: urls },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          
          resolve(response);
        }
      );
    });
  } else {
    // Web environment - direct API call
    const apiUrl = await getApiUrl();
    
    const response = await fetch(`${apiUrl}/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch feeds');
    }

    const data = await response.json();
    
    // Process data
    const feedDetails: Feed[] = data.feeds
      .filter((feed: any) => feed.status === "ok")
      .map((feed: any) => ({
        type: feed.type || '',
        guid: feed.guid || '',
        status: feed.status,
        siteTitle: feed.siteTitle,
        feedTitle: feed.feedTitle,
        feedUrl: feed.feedUrl,
        description: feed.description || '',
        link: feed.link || '',
        lastUpdated: feed.lastUpdated || '',
        lastRefreshed: feed.lastRefreshed || new Date().toISOString(),
        published: feed.published || '',
        author: feed.author || null,
        language: feed.language || '',
        favicon: feed.favicon || '',
        categories: feed.categories || '',
        items: [],
      }));

    const feedItems: FeedItem[] = data.items || [];
    
    // Sort items by published date (newest first)
    feedItems.sort((a: FeedItem, b: FeedItem) => {
      return new Date(b.published).getTime() - new Date(a.published).getTime();
    });

    return { feeds: feedDetails, items: feedItems };
  }
}

export async function fetchFeedDetails(urls: string[]): Promise<Feed[]> {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Chrome extension environment - use message passing
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'discoverFeeds', discoverUrls: urls },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          
          const feeds = response.feeds
            .filter((feed: any) => feed.status !== "error")
            .map((feed: any) => ({
              type: feed.type || '',
              guid: feed.guid || '',
              status: feed.status || 'ok',
              siteTitle: feed.siteTitle || feed.title || '',
              feedTitle: feed.feedTitle || feed.title || '',
              feedUrl: feed.feedUrl || feed.url || '',
              description: feed.description || '',
              link: feed.link || '',
              lastUpdated: feed.lastUpdated || '',
              lastRefreshed: feed.lastRefreshed || new Date().toISOString(),
              published: feed.published || '',
              author: feed.author || null,
              language: feed.language || '',
              favicon: feed.favicon || '',
              categories: feed.categories || '',
              items: [],
            }));
          
          resolve(feeds);
        }
      );
    });
  } else {
    // Web environment - direct API call
    const apiUrl = await getApiUrl();
    
    const response = await fetch(`${apiUrl}/discover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch feed details');
    }

    const data = await response.json();
    
    return data.feeds
      .filter((feed: any) => feed.status !== "error")
      .map((feed: any) => ({
        type: feed.type || '',
        guid: feed.guid || '',
        status: feed.status || 'ok',
        siteTitle: feed.siteTitle || feed.title || '',
        feedTitle: feed.feedTitle || feed.title || '',
        feedUrl: feed.feedUrl || feed.url || '',
        description: feed.description || '',
        link: feed.link || '',
        lastUpdated: feed.lastUpdated || '',
        lastRefreshed: feed.lastRefreshed || new Date().toISOString(),
        published: feed.published || '',
        author: feed.author || null,
        language: feed.language || '',
        favicon: feed.favicon || '',
        categories: feed.categories || '',
        items: [],
      }));
  }
}

export async function fetchReaderView(url: string): Promise<ReaderViewResponse> {
  const apiUrl = await getApiUrl();
  
  const response = await fetch(`${apiUrl}/reader`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reader view');
  }

  return await response.json();
}

export async function fetchBingImage(): Promise<BingImage> {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Chrome extension environment - use message passing
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'fetchBingImage' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          
          // Convert blob to URL
          const imageUrl = URL.createObjectURL(response.imageBlob);
          
          resolve({
            url: imageUrl,
            title: response.title,
            copyright: response.copyright,
          });
        }
      );
    });
  } else {
    // Web environment - direct API call
    try {
      const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US');
      
      if (!response.ok) {
        throw new Error('Failed to fetch Bing image');
      }
      
      const data = await response.json();
      const image = data.images[0];
      
      return {
        url: `https://www.bing.com${image.url.replace(/1920x1080/g, 'UHD')}`,
        title: image.title,
        copyright: image.copyright,
      };
    } catch (error) {
      console.error('Error fetching Bing image:', error);
      // Fallback image
      return {
        url: '/images/default-background.jpg',
        title: 'Default Background',
        copyright: '© Calm New Tab',
      };
    }
  }
}

// Some utility functions from the original extension
export function generateBoxShadow(color: { r: number; g: number; b: number } | undefined, elevation = 5, opacity = 0.3, blur = 4): string {
  if (!color) return '';
  
  const { r, g, b } = color;
  const layerAmount = Math.max(3, elevation);
  const boxShadows = [];
  
  for (let i = 0; i < layerAmount; i++) {
    const blurValue = (i + 1) * blur;
    const alpha = (i + 1) * (opacity / layerAmount);
    boxShadows.push(`0px 0px ${blurValue}px rgba(${r}, ${g}, ${b}, ${alpha})`);
  }
  
  return boxShadows.join(', ');
}

export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 183;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}