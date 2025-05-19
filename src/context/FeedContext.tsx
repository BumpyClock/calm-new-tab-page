// src/context/FeedContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Feed, FeedItem } from '../types/api';
import { defaultFeeds, FeedConfig } from '../config/feeds.config';
import { addStorageListener } from '../utils/storage';
import { 
  getUserFeeds, 
  saveUserFeeds, 
  addUserFeed, 
  removeUserFeed, 
  reorderUserFeeds,
  USER_FEEDS_STORAGE_KEY 
} from '../utils/feedStorage';
import { fetchFeeds, discoverFeeds as discoverFeedsUtil } from '../utils/feeds';

/**
 * Feed context type definition
 */
export interface FeedContextType {
  // Feeds data
  feeds: Feed[];
  feedItems: FeedItem[];
  userFeeds: FeedConfig[];
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  
  // Selected feed item for modal view
  selectedItem: FeedItem | null;
  
  // Action functions
  refreshFeeds: () => Promise<void>;
  addFeed: (feed: FeedConfig) => Promise<void>;
  removeFeed: (feedUrl: string) => Promise<void>;
  reorderFeeds: (feedUrls: string[]) => Promise<void>;
  selectFeedItem: (item: FeedItem | null) => void;
  discoverFeeds: (url: string) => Promise<FeedConfig[]>;
  toggleFavorite: (itemId: string) => Promise<void>;
  toggleReadLater: (itemId: string) => Promise<void>;
  markAsRead: (itemId: string) => Promise<void>;
  loadDefaultFeeds: () => Promise<void>;
}

/**
 * Create the Feed context
 */
const FeedContext = createContext<FeedContextType | undefined>(undefined);

/**
 * Props for the Feed provider component
 */
export interface FeedProviderProps {
  children: ReactNode;
}

/**
 * Provider component for feed data and functionality
 */
export const FeedProvider: React.FC<FeedProviderProps> = ({ children }) => {
  // State for feeds data
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [userFeeds, setUserFeeds] = useState<FeedConfig[]>([]);
  
  // State for UI
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Fetch feed data from the provided URLs
   */
  const fetchFeedData = useCallback(async (feedUrls: string[]): Promise<void> => {
    if (feedUrls.length === 0) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setError(null);
      const result = await fetchFeeds(feedUrls);
      
      if (result.items) {
        setFeedItems(result.items);
      }
      
      if (result.feeds) {
        setFeeds(result.feeds);
      }
    } catch (err) {
      console.error('Error fetching feeds:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching feeds');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  /**
   * Load user feeds from storage
   */
  const loadUserFeedsFromStorage = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const storedFeeds = await getUserFeeds();
      
      // Use stored feeds or default feeds if none exist
      const feeds = storedFeeds.length > 0 ? storedFeeds : defaultFeeds;
      setUserFeeds(feeds);
      
      // Fetch feed data
      await fetchFeedData(feeds.map(feed => feed.url));
    } catch (err) {
      console.error('Error loading feeds from storage:', err);
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Error loading feeds');
    }
  }, [fetchFeedData]);
  
  // Load user feeds from storage on mount
  useEffect(() => {
    loadUserFeedsFromStorage();
    
    // Add listener for storage changes
    const removeListener = addStorageListener(USER_FEEDS_STORAGE_KEY, (changes) => {
      const newValue = changes[USER_FEEDS_STORAGE_KEY]?.newValue;
      if (newValue) {
        setUserFeeds(newValue);
        fetchFeedData(newValue.map((feed: FeedConfig) => feed.url))
          .catch(err => console.error('Error fetching feeds after storage change:', err));
      }
    });
    
    return () => {
      removeListener();
    };
  }, [loadUserFeedsFromStorage, fetchFeedData]);
  
  /**
   * Refresh all feeds
   */
  const refreshFeeds = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await fetchFeedData(userFeeds.map(feed => feed.url));
  }, [userFeeds, fetchFeedData]);
  
  /**
   * Add a new feed
   */
  const addFeed = useCallback(async (feed: FeedConfig): Promise<void> => {
    try {
      // Add feed using storage utility
      const updatedFeeds = await addUserFeed(feed);
      setUserFeeds(updatedFeeds);
      
      // Fetch the new feed data
      await fetchFeedData([feed.url]);
    } catch (err) {
      console.error('Error adding feed:', err);
      setError(err instanceof Error ? err.message : 'Error adding feed');
    }
  }, [fetchFeedData]);
  
  /**
   * Remove a feed
   */
  const removeFeed = useCallback(async (feedUrl: string): Promise<void> => {
    try {
      // Remove feed using storage utility
      const updatedFeeds = await removeUserFeed(feedUrl);
      setUserFeeds(updatedFeeds);
      
      // Update feed items to remove items from the removed feed
      setFeedItems(prevItems => prevItems.filter(item => item.feedUrl !== feedUrl));
    } catch (err) {
      console.error('Error removing feed:', err);
      setError(err instanceof Error ? err.message : 'Error removing feed');
    }
  }, []);
  
  /**
   * Reorder feeds
   */
  const reorderFeeds = useCallback(async (feedUrls: string[]): Promise<void> => {
    try {
      // Reorder feeds using storage utility
      const reorderedFeeds = await reorderUserFeeds(feedUrls);
      setUserFeeds(reorderedFeeds);
    } catch (err) {
      console.error('Error reordering feeds:', err);
      setError(err instanceof Error ? err.message : 'Error reordering feeds');
    }
  }, []);
  
  /**
   * Select a feed item for display in modal
   */
  const selectFeedItem = useCallback((item: FeedItem | null): void => {
    setSelectedItem(item);
  }, []);
  
  /**
   * Discover feeds from a URL
   */
  const discoverFeedsFromUrl = useCallback(async (url: string): Promise<FeedConfig[]> => {
    try {
      return await discoverFeedsUtil(url);
    } catch (err) {
      console.error('Error discovering feeds:', err);
      setError(err instanceof Error ? err.message : 'Error discovering feeds');
      return [];
    }
  }, []);
  
  /**
   * Toggle favorite status for a feed item
   */
  const toggleFavorite = useCallback(async (itemId: string): Promise<void> => {
    setFeedItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            favorite: !item.favorite
          };
        }
        return item;
      });
    });
    
    // Update selected item if it's the one being toggled
    if (selectedItem?.id === itemId) {
      setSelectedItem(prev => {
        if (!prev) return null;
        return {
          ...prev,
          favorite: !prev.favorite
        };
      });
    }
    
    // In a real implementation, we would save this to persistent storage
  }, [selectedItem]);
  
  /**
   * Toggle read later status for a feed item
   */
  const toggleReadLater = useCallback(async (itemId: string): Promise<void> => {
    setFeedItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            readLater: !item.readLater
          };
        }
        return item;
      });
    });
    
    // Update selected item if it's the one being toggled
    if (selectedItem?.id === itemId) {
      setSelectedItem(prev => {
        if (!prev) return null;
        return {
          ...prev,
          readLater: !prev.readLater
        };
      });
    }
    
    // In a real implementation, we would save this to persistent storage
  }, [selectedItem]);
  
  /**
   * Mark a feed item as read
   */
  const markAsRead = useCallback(async (itemId: string): Promise<void> => {
    setFeedItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            read: true
          };
        }
        return item;
      });
    });
    
    // Update selected item if it's the one being marked
    if (selectedItem?.id === itemId) {
      setSelectedItem(prev => {
        if (!prev) return null;
        return {
          ...prev,
          read: true
        };
      });
    }
    
    // In a real implementation, we would save this to persistent storage
  }, [selectedItem]);
  
  /**
   * Load default feeds
   */
  const loadDefaultFeeds = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Save default feeds to storage
      await saveUserFeeds(defaultFeeds);
      setUserFeeds(defaultFeeds);
      
      // Fetch feed data
      await fetchFeedData(defaultFeeds.map(feed => feed.url));
    } catch (err) {
      console.error('Error loading default feeds:', err);
      setError(err instanceof Error ? err.message : 'Error loading default feeds');
      setLoading(false);
    }
  }, [fetchFeedData]);
  
  // Context value
  const contextValue: FeedContextType = {
    feeds,
    feedItems,
    userFeeds,
    loading,
    refreshing,
    error,
    selectedItem,
    refreshFeeds,
    addFeed,
    removeFeed,
    reorderFeeds,
    selectFeedItem,
    discoverFeeds: discoverFeedsFromUrl,
    toggleFavorite,
    toggleReadLater,
    markAsRead,
    loadDefaultFeeds
  };
  
  return (
    <FeedContext.Provider value={contextValue}>
      {children}
    </FeedContext.Provider>
  );
};

/**
 * Custom hook to use the feed context
 */
export const useFeed = (): FeedContextType => {
  const context = useContext(FeedContext);
  
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  
  return context;
};

export default FeedContext;