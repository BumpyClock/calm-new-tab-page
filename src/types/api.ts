// src/types/api.ts

/**
 * Feed type enumeration for different content types
 */
export enum FeedType {
  ARTICLE = 'article',
  PODCAST = 'podcast',
  VIDEO = 'video',
  IMAGE = 'image'
}

/**
 * Status enumeration for feed processing
 */
export enum FeedStatus {
  OK = 'ok',
  ERROR = 'error',
  LOADING = 'loading',
  STALE = 'stale'
}

/**
 * API Response for fetching feeds
 */
export interface FetchFeedsResponse {
  feeds: Feed[];
  items: FeedItem[];
}

/**
 * API Response for fetching reader view
 */
export interface ReaderViewResponse {
  url: string;
  status: string;
  content: string;
  title: string;
  siteName: string;
  image: string;
  favicon: string;
  textContent: string;
  excerpt?: string;
  author?: string;
  publishedDate?: string;
  estimatedReadTime?: number;
}

/**
 * API Response for discovering feeds
 */
export interface DiscoverFeedsResponse {
  feeds: DiscoveredFeed[];
}

/**
 * Discovered feed structure
 */
export interface DiscoveredFeed {
  feedUrl: string;
  siteTitle?: string;
  feedTitle?: string;
  type?: string;
  status: string;
  favicon?: string;
  description?: string;
}

/**
 * RGB color structure
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Feed schema - representing an RSS/Atom feed
 */
export interface Feed {
  type: string;
  guid: string;
  status: FeedStatus;
  siteTitle: string;
  feedTitle: string;
  feedUrl: string;
  description: string;
  link: string;
  lastUpdated: string;
  lastRefreshed: string;
  published: string;
  author: string | null;
  language: string;
  favicon: string;
  categories: string;
  items: FeedItem[];
}

/**
 * Feed item schema - representing a single post/article/episode
 */
export interface FeedItem {
  // Core properties
  id: string;
  type: FeedType;
  title: string;
  description: string;
  link: string;
  
  // Content
  content: string;
  content_encoded: string;
  
  // Metadata
  author: string;
  published: string;
  created: string;
  categories: string;
  
  // Media
  enclosures: Enclosure[] | null;
  thumbnail: string;
  thumbnailColor: RGBColor;
  thumbnailColorComputed: string;
  
  // Source information
  siteTitle: string;
  feedTitle: string;
  feedUrl: string;
  favicon: string;
  
  // Optional properties
  favorite?: boolean;
  readLater?: boolean;
  read?: boolean;
  
  // Podcast/media specific
  duration?: number;
  itunesEpisode?: string;
  itunesSeason?: string;
  feedImage?: string;
  
  // Reader view data
  readerViewContent?: string;
  estimatedReadTime?: number;
  
  // UI state
  isExpanded?: boolean;
  isLoading?: boolean;
}

/**
 * Enclosure schema (for podcast audio files, attachments)
 */
export interface Enclosure {
  url: string;
  type: string;
  length?: string;
  title?: string;
  duration?: number;
}

/**
 * API Request for fetching feeds
 */
export interface FetchFeedsRequest {
  urls: string[];
  forceRefresh?: boolean;
  maxItems?: number;
}

/**
 * API Request for fetching reader view
 */
export interface FetchReaderViewRequest {
  url: string;
  includeSummary?: boolean;
}

/**
 * API Request for discovering feeds
 */
export interface DiscoverFeedsRequest {
  urls: string[];
}

/**
 * Media type enumeration
 */
export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  OTHER = 'other'
}

/**
 * Message types for communication with background service
 */
export enum MessageType {
  FETCH_RSS = 'fetchRSS',
  DISCOVER_FEEDS = 'discoverFeeds',
  FETCH_BING_IMAGE = 'fetchBingImage',
  SET_API_URL = 'setApiUrl',
  GET_API_URL = 'getApiUrl'
}

/**
 * Structure for messages to background service
 */
export interface BackgroundServiceMessage {
  action: MessageType;
  [key: string]: any;
}