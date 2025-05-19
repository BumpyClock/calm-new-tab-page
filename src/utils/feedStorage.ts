// src/utils/feedStorage.ts
import { FeedConfig } from '../config/feeds.config';
import { getFromStorage, setInStorage, removeFromStorage } from './storage';

/**
 * Storage key for user-selected feeds
 */
export const USER_FEEDS_STORAGE_KEY = 'user_selected_feeds';

/**
 * Storage key for feed categories
 */
export const FEED_CATEGORIES_STORAGE_KEY = 'feed_categories';

/**
 * Get all user-selected feeds from storage
 * @returns Promise that resolves with an array of user-selected feeds
 */
export async function getUserFeeds(): Promise<FeedConfig[]> {
  try {
    const feeds = await getFromStorage<FeedConfig[]>(USER_FEEDS_STORAGE_KEY);
    return feeds || [];
  } catch (error) {
    console.error('Error getting user feeds:', error);
    return [];
  }
}

/**
 * Save user-selected feeds to storage
 * @param feeds - Array of feed configurations to save
 * @returns Promise that resolves when feeds are saved
 */
export async function saveUserFeeds(feeds: FeedConfig[]): Promise<void> {
  try {
    await setInStorage(USER_FEEDS_STORAGE_KEY, feeds);
  } catch (error) {
    console.error('Error saving user feeds:', error);
    throw error;
  }
}

/**
 * Add a new feed to user-selected feeds
 * @param feed - Feed configuration to add
 * @returns Promise that resolves with the updated array of feeds
 */
export async function addUserFeed(feed: FeedConfig): Promise<FeedConfig[]> {
  try {
    // Get current feeds
    const currentFeeds = await getUserFeeds();
    
    // Check if feed already exists
    const existingFeedIndex = currentFeeds.findIndex(f => f.url === feed.url);
    
    if (existingFeedIndex !== -1) {
      // Update existing feed
      currentFeeds[existingFeedIndex] = {
        ...currentFeeds[existingFeedIndex],
        ...feed
      };
    } else {
      // Add new feed
      currentFeeds.push(feed);
    }
    
    // Save updated feeds
    await saveUserFeeds(currentFeeds);
    
    return currentFeeds;
  } catch (error) {
    console.error('Error adding user feed:', error);
    throw error;
  }
}

/**
 * Remove a feed from user-selected feeds
 * @param feedUrl - URL of the feed to remove
 * @returns Promise that resolves with the updated array of feeds
 */
export async function removeUserFeed(feedUrl: string): Promise<FeedConfig[]> {
  try {
    // Get current feeds
    const currentFeeds = await getUserFeeds();
    
    // Filter out the feed to remove
    const updatedFeeds = currentFeeds.filter(feed => feed.url !== feedUrl);
    
    // Save updated feeds
    await saveUserFeeds(updatedFeeds);
    
    return updatedFeeds;
  } catch (error) {
    console.error('Error removing user feed:', error);
    throw error;
  }
}

/**
 * Update a feed in user-selected feeds
 * @param feedUrl - URL of the feed to update
 * @param updates - Partial feed configuration with updates
 * @returns Promise that resolves with the updated array of feeds
 */
export async function updateUserFeed(
  feedUrl: string,
  updates: Partial<FeedConfig>
): Promise<FeedConfig[]> {
  try {
    // Get current feeds
    const currentFeeds = await getUserFeeds();
    
    // Find the feed to update
    const feedIndex = currentFeeds.findIndex(feed => feed.url === feedUrl);
    
    if (feedIndex === -1) {
      // Feed not found
      throw new Error(`Feed with URL ${feedUrl} not found`);
    }
    
    // Update the feed
    currentFeeds[feedIndex] = {
      ...currentFeeds[feedIndex],
      ...updates
    };
    
    // Save updated feeds
    await saveUserFeeds(currentFeeds);
    
    return currentFeeds;
  } catch (error) {
    console.error('Error updating user feed:', error);
    throw error;
  }
}

/**
 * Clear all user-selected feeds
 * @returns Promise that resolves when all feeds are cleared
 */
export async function clearUserFeeds(): Promise<void> {
  try {
    await removeFromStorage(USER_FEEDS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user feeds:', error);
    throw error;
  }
}

/**
 * Reorder user-selected feeds
 * @param feedUrls - Array of feed URLs in the desired order
 * @returns Promise that resolves with the reordered array of feeds
 */
export async function reorderUserFeeds(feedUrls: string[]): Promise<FeedConfig[]> {
  try {
    // Get current feeds
    const currentFeeds = await getUserFeeds();
    
    // Create a map of feeds by URL for quick lookup
    const feedMap = new Map<string, FeedConfig>();
    currentFeeds.forEach(feed => {
      feedMap.set(feed.url, feed);
    });
    
    // Reorder feeds according to the provided URLs
    const reorderedFeeds = feedUrls
      .map(url => feedMap.get(url))
      .filter((feed): feed is FeedConfig => feed !== undefined);
    
    // Add any feeds that weren't in the provided URLs at the end
    const reorderedUrls = new Set(feedUrls);
    currentFeeds.forEach(feed => {
      if (!reorderedUrls.has(feed.url)) {
        reorderedFeeds.push(feed);
      }
    });
    
    // Save reordered feeds
    await saveUserFeeds(reorderedFeeds);
    
    return reorderedFeeds;
  } catch (error) {
    console.error('Error reordering user feeds:', error);
    throw error;
  }
}

/**
 * Group feeds by category
 * @param feeds - Array of feed configurations
 * @returns Object with category IDs as keys and arrays of feeds as values
 */
export function groupFeedsByCategory(
  feeds: FeedConfig[]
): Record<string, FeedConfig[]> {
  const grouped: Record<string, FeedConfig[]> = {};
  
  feeds.forEach(feed => {
    const category = feed.category || 'uncategorized';
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push(feed);
  });
  
  return grouped;
}