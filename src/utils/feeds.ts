// src/utils/feeds.ts
import { FeedItem, FeedType, Feed } from '../types/api';
import { FeedConfig } from '../config/feeds.config';
import { sendExtensionMessage } from './browser';

/**
 * Get the color for a feed item based on site or category
 * @param feedItem - Feed item to get color for
 * @returns Hex color code
 */
export function getFeedItemColor(feedItem: FeedItem): string {
  // If the feed item already has a computed color, use that
  if (feedItem.thumbnailColorComputed) {
    return feedItem.thumbnailColorComputed;
  }
  
  // Otherwise generate a color based on the site name
  const siteName = feedItem.siteTitle || feedItem.feedTitle || '';
  
  // Simple hashing algorithm to get consistent colors for the same site
  let hash = 0;
  for (let i = 0; i < siteName.length; i++) {
    hash = siteName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to hex color
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
}

/**
 * Sort feed items by date, newest first
 * @param items - Feed items to sort
 * @returns Sorted array of feed items
 */
export function sortFeedItemsByDate(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.published || a.created || 0).getTime();
    const dateB = new Date(b.published || b.created || 0).getTime();
    return dateB - dateA;
  });
}

/**
 * Group feed items by site
 * @param items - Feed items to group
 * @returns Object with site titles as keys and arrays of feed items as values
 */
export function groupFeedItemsBySite(items: FeedItem[]): Record<string, FeedItem[]> {
  const grouped: Record<string, FeedItem[]> = {};
  
  items.forEach(item => {
    const siteKey = item.siteTitle || item.feedTitle || 'Unknown';
    
    if (!grouped[siteKey]) {
      grouped[siteKey] = [];
    }
    
    grouped[siteKey].push(item);
  });
  
  return grouped;
}

/**
 * Filter feed items by type
 * @param items - Feed items to filter
 * @param type - Feed type to filter by
 * @returns Filtered array of feed items
 */
export function filterFeedItemsByType(items: FeedItem[], type: FeedType): FeedItem[] {
  return items.filter(item => item.type === type);
}

/**
 * Search feed items for a query string
 * @param items - Feed items to search
 * @param query - Search query
 * @returns Filtered array of feed items matching the query
 */
export function searchFeedItems(items: FeedItem[], query: string): FeedItem[] {
  if (!query.trim()) {
    return items;
  }
  
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => {
    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    const content = item.content?.toLowerCase() || '';
    const author = item.author?.toLowerCase() || '';
    const siteName = item.siteTitle?.toLowerCase() || '';
    
    return title.includes(lowerQuery) || 
           description.includes(lowerQuery) || 
           content.includes(lowerQuery) || 
           author.includes(lowerQuery) ||
           siteName.includes(lowerQuery);
  });
}

/**
 * Fetch feed data from the background service
 * @param feedUrls - URLs of feeds to fetch
 * @param forceRefresh - Whether to force a refresh of cached data
 * @returns Promise that resolves with feed data
 */
export async function fetchFeeds(
  feedUrls: string[],
  forceRefresh: boolean = false
): Promise<{ feeds: Feed[]; items: FeedItem[] }> {
  try {
    const response = await sendExtensionMessage({
      action: 'fetchRSS',
      feedUrls,
      forceRefresh
    });
    
    if ('error' in response) {
      throw new Error(response.error);
    }
    
    return {
      feeds: response.feeds || [],
      items: response.items || []
    };
  } catch (error) {
    console.error('Error fetching feeds:', error);
    return { feeds: [], items: [] };
  }
}

/**
 * Discover feeds for a website URL
 * @param url - URL to discover feeds for
 * @returns Promise that resolves with discovered feeds
 */
export async function discoverFeeds(url: string): Promise<FeedConfig[]> {
  try {
    const response = await sendExtensionMessage({
      action: 'discoverFeeds',
      discoverUrls: [url]
    });
    
    if ('error' in response) {
      throw new Error(response.error);
    }
    
    // Map discovered feeds to FeedConfig format
    if (response.feeds && Array.isArray(response.feeds)) {
      return response.feeds
        .filter((feed: any) => feed.status !== 'error' && feed.feedUrl)
        .map((feed: any) => ({
          url: feed.feedUrl || feed.url,
          title: feed.feedTitle || feed.siteTitle || 'Unknown Feed',
          description: feed.description || '',
          favicon: feed.favicon || ''
        }));
    }
    
    return [];
  } catch (error) {
    console.error('Error discovering feeds:', error);
    return [];
  }
}

/**
 * Extract feed URLs from HTML content
 * @param htmlContent - HTML content to extract feed URLs from
 * @returns Array of extracted feed URLs
 */
export function extractFeedUrlsFromHtml(htmlContent: string): string[] {
  try {
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    const feedLinks: string[] = [];
    
    // Look for link tags with RSS/Atom type
    const linkTags = doc.querySelectorAll('link[type="application/rss+xml"], link[type="application/atom+xml"]');
    linkTags.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        feedLinks.push(href);
      }
    });
    
    return feedLinks;
  } catch (error) {
    console.error('Error extracting feed URLs from HTML:', error);
    return [];
  }
}