"use client";

import { useEffect, useState } from 'react';
import { FeedItem } from '@/types';
import FeedContainer from '@/components/feed/FeedContainer';
import SearchBar from '@/components/SearchBar';
import MostVisitedSites from '@/components/MostVisitedSites';
import BackgroundImage from '@/components/BackgroundImage';
import SettingsButton from '@/components/settings/SettingsButton';
import { fetchFeeds } from '@/lib/api';

export default function Home() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getSubscribedFeeds = async (): Promise<string[]> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Chrome extension environment
      return new Promise((resolve) => {
        chrome.storage.local.get('subscribedFeeds', (result) => {
          if (!result.subscribedFeeds) {
            // Set default feeds if none exist
            const defaults = [
              "http://www.theverge.com/rss/index.xml",
              "https://www.wired.com/feed/rss",
              "https://www.engadget.com/rss.xml"
            ];
            chrome.storage.local.set({ subscribedFeeds: defaults });
            resolve(defaults);
          } else {
            resolve(result.subscribedFeeds);
          }
        });
      });
    } else if (typeof window !== 'undefined') {
      // Web environment
      const feeds = localStorage.getItem('subscribedFeeds');
      if (!feeds) {
        // Set default feeds if none exist
        const defaults = [
          "http://www.theverge.com/rss/index.xml",
          "https://www.wired.com/feed/rss",
          "https://www.engadget.com/rss.xml"
        ];
        localStorage.setItem('subscribedFeeds', JSON.stringify(defaults));
        return defaults;
      }
      
      return JSON.parse(feeds);
    }
    
    // Fallback
    return [
      "http://www.theverge.com/rss/index.xml",
      "https://www.wired.com/feed/rss",
      "https://www.engadget.com/rss.xml"
    ];
  };

  const getCachedFeedItems = async (): Promise<FeedItem[] | null> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Chrome extension environment
      return new Promise((resolve) => {
        chrome.storage.local.get(['feedItems', 'feedItemsTimestamp'], (result) => {
          if (!result.feedItems || !result.feedItemsTimestamp) {
            resolve(null);
            return;
          }
          
          const timestamp = parseInt(result.feedItemsTimestamp);
          const now = new Date().getTime();
          // Use cache if less than 15 minutes old
          if (now - timestamp < 15 * 60 * 1000) {
            setLastRefreshed(new Date(timestamp));
            resolve(result.feedItems);
          } else {
            resolve(null);
          }
        });
      });
    } else if (typeof localStorage !== 'undefined') {
      // Web environment
      const items = localStorage.getItem('feedItems');
      const timestamp = localStorage.getItem('feedItemsTimestamp');
      
      if (!items || !timestamp) return null;
      
      const now = new Date().getTime();
      // Use cache if less than 15 minutes old
      if (now - parseInt(timestamp) < 15 * 60 * 1000) {
        setLastRefreshed(new Date(parseInt(timestamp)));
        return JSON.parse(items);
      }
    }
    
    return null;
  };

  useEffect(() => {
    const loadFeeds = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get subscribed feeds
        const subscribedFeeds = await getSubscribedFeeds();
        
        if (subscribedFeeds.length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Check if we should use cached feed items
        const cachedItems = await getCachedFeedItems();
        
        if (cachedItems) {
          setFeedItems(cachedItems);
          setIsLoading(false);
          return;
        }
        
        // Fetch fresh feed data
        const data = await fetchFeeds(subscribedFeeds);
        
        // Cache the feed items
        const timestamp = new Date().getTime();
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({
            feedItems: data.items,
            feedItemsTimestamp: timestamp
          });
        } else if (typeof localStorage !== 'undefined') {
          localStorage.setItem('feedItems', JSON.stringify(data.items));
          localStorage.setItem('feedItemsTimestamp', timestamp.toString());
        }
        
        setFeedItems(data.items);
        setLastRefreshed(new Date(timestamp));
      } catch (error) {
        console.error('Failed to load feeds:', error);
        setError('Failed to load feeds. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFeeds();
    
    // Add listener for RSS updates from Chrome extension
    const handleRSSUpdate = (message: any) => {
      if (message.action === 'rssUpdate' && message.data) {
        try {
          const data = JSON.parse(message.data);
          setFeedItems(data.items);
          setLastRefreshed(new Date());
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing RSS update:', error);
        }
      }
    };
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleRSSUpdate);
    }
    
    // Set up auto-refresh every 15 minutes
    const refreshInterval = setInterval(() => {
      loadFeeds();
    }, 15 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleRSSUpdate);
      }
    };
  }, []);

  return (
    <main className="min-h-screen">
      <BackgroundImage />
      <div id="main-container" className="container mx-auto p-4 relative">
        <SettingsButton />
        
        <div className="header flex flex-col items-center justify-center min-h-[55vh] py-36 px-8">
          <SearchBar />
          <MostVisitedSites />
        </div>
        
        {lastRefreshed && (
          <div className="feed-refresh-timer text-white/90 font-semibold text-sm mb-3">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        ) : (
          <FeedContainer feedItems={feedItems} />
        )}
      </div>
    </main>
  );
}