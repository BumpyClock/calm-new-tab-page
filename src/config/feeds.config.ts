// src/config/feeds.config.ts

export interface FeedCategory {
  id: string;
  name: string;
  description: string;
  feeds: FeedConfig[];
}

export interface FeedConfig {
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  category?: string;
}

// Default feeds organized by category
export const defaultFeedCategories: FeedCategory[] = [
  {
    id: 'technology',
    name: 'Technology',
    description: 'Latest tech news and updates',
    feeds: [
      {
        url: 'https://www.theverge.com/rss/index.xml',
        title: 'The Verge',
        description: 'Tech news and reviews',
        favicon: 'https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395363/favicon-32x32.0.png'
      },
      {
        url: 'https://www.wired.com/feed/rss',
        title: 'Wired',
        description: 'Tech trends and analysis',
        favicon: 'https://www.wired.com/favicon.ico'
      },
      {
        url: 'https://www.engadget.com/rss.xml',
        title: 'Engadget',
        description: 'Tech news and gadget reviews',
        favicon: 'https://s.yimg.com/cv/apiv2/social/images/yahoo_default_logo.png'
      },
      {
        url: 'https://www.techradar.com/rss',
        title: 'TechRadar',
        description: 'The source for tech buying advice',
        favicon: 'https://vanilla.futurecdn.net/techradar/media/img/techradar-favicon.ico'
      }
    ]
  },
  {
    id: 'news',
    name: 'News',
    description: 'General news sources',
    feeds: [
      {
        url: 'https://www.vox.com/rss/index.xml',
        title: 'Vox',
        description: 'General news and explanatory journalism',
        favicon: 'https://cdn.vox-cdn.com/community_logos/52517/voxv.png'
      },
      {
        url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
        title: 'New York Times',
        description: 'Breaking news, world news & multimedia',
        favicon: 'https://www.nytimes.com/favicon.ico'
      },
      {
        url: 'https://feeds.bbci.co.uk/news/rss.xml',
        title: 'BBC News',
        description: 'World news coverage',
        favicon: 'https://www.bbc.co.uk/favicon.ico'
      }
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Movies, games, and culture',
    feeds: [
      {
        url: 'https://www.polygon.com/rss/index.xml',
        title: 'Polygon',
        description: 'Gaming and entertainment news',
        favicon: 'https://cdn.vox-cdn.com/community_logos/51928/polygon-favicon-512.png'
      },
      {
        url: 'https://screenrant.com/feed/',
        title: 'ScreenRant',
        description: 'Movie and TV news',
        favicon: 'https://static.srcdn.com/favicon.ico'
      },
      {
        url: 'https://kotaku.com/rss',
        title: 'Kotaku',
        description: 'Gaming culture and news',
        favicon: 'https://i.kinja-img.com/gawker-media/image/upload/c_fill,f_auto,fl_progressive,g_center,h_80,q_80,w_80/u0939doeuioaqhspkjyc.png'
      }
    ]
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Scientific discoveries and research',
    feeds: [
      {
        url: 'https://www.sciencedaily.com/rss/all.xml',
        title: 'ScienceDaily',
        description: 'Latest scientific research news',
        favicon: 'https://www.sciencedaily.com/favicon.ico'
      },
      {
        url: 'https://www.sciencealert.com/feed',
        title: 'Science Alert',
        description: 'Latest science news',
        favicon: 'https://www.sciencealert.com/favicon.ico'
      }
    ]
  }
];

// Flat array of all default feeds
export const defaultFeeds: FeedConfig[] = defaultFeedCategories.flatMap(category => 
  category.feeds.map(feed => ({
    ...feed,
    category: category.id
  }))
);

/**
 * Get the URLs of all default feeds
 * @returns Array of feed URLs
 */
export function getDefaultFeedUrls(): string[] {
  return defaultFeeds.map(feed => feed.url);
}

/**
 * Get feeds by category ID
 * @param categoryId The category ID to filter by
 * @returns Array of feeds in the specified category
 */
export function getFeedsByCategory(categoryId: string): FeedConfig[] {
  return defaultFeeds.filter(feed => feed.category === categoryId);
}

/**
 * Chrome storage keys for feeds
 */
export const STORAGE_KEYS = {
  USER_FEEDS: 'user_feeds',
  FEED_PREFERENCES: 'feed_preferences',
  DEFAULT_CATEGORIES: 'default_categories'
};