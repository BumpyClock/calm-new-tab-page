// src/components/settings/types.ts
import { FeedConfig } from '../../config/feeds.config';
import { BaseProps } from '../ui/types';

/**
 * Props for the settings page component
 */
export interface SettingsPageProps extends BaseProps {
  /** Whether the settings page is open */
  isOpen?: boolean;
  /** Function to call when settings page is closed */
  onClose?: () => void;
}

/**
 * Props for the feed settings section
 */
export interface FeedSettingsProps extends BaseProps {
  /** User-selected feeds */
  userFeeds: FeedConfig[];
  /** Function to add a new feed */
  onAddFeed: (feed: FeedConfig) => void;
  /** Function to remove a feed */
  onRemoveFeed: (feedUrl: string) => void;
  /** Function to reorder feeds */
  onReorderFeeds?: (feeds: FeedConfig[]) => void;
}

/**
 * Props for the feed list in settings
 */
export interface SubscribedFeedsListProps extends BaseProps {
  /** List of user-subscribed feeds */
  feeds: FeedConfig[];
  /** Function to remove a feed */
  onRemoveFeed: (feedUrl: string) => void;
  /** Function to reorder feeds */
  onReorderFeeds?: (feeds: FeedConfig[]) => void;
}

/**
 * Props for individual feed item in settings
 */
export interface SubscribedFeedItemProps extends BaseProps {
  /** Feed configuration */
  feed: FeedConfig;
  /** Function to remove this feed */
  onRemove: (feedUrl: string) => void;
  /** Index of the feed in the list */
  index: number;
}

/**
 * Props for the add feed form
 */
export interface AddFeedFormProps extends BaseProps {
  /** Function to add a new feed */
  onAddFeed: (feed: FeedConfig) => void;
  /** Whether the form is in loading state */
  isLoading?: boolean;
}

/**
 * Props for the appearance settings section
 */
export interface AppearanceSettingsProps extends BaseProps {
  /** Current theme setting */
  theme: 'light' | 'dark' | 'system';
  /** Function to change theme */
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  /** Whether to show the Bing background */
  showBingBackground: boolean;
  /** Function to toggle Bing background */
  onToggleBingBackground: (show: boolean) => void;
  /** Current font size for reader view */
  readerViewFontSize: number;
  /** Function to change reader view font size */
  onReaderViewFontSizeChange: (size: number) => void;
  /** Current font family for reader view */
  readerViewFontFamily: string;
  /** Function to change reader view font family */
  onReaderViewFontFamilyChange: (family: string) => void;
}

/**
 * Props for the general settings section
 */
export interface GeneralSettingsProps extends BaseProps {
  /** Whether to auto-discover feeds */
  autoDiscoverFeeds: boolean;
  /** Function to toggle auto-discover feeds */
  onToggleAutoDiscoverFeeds: (autoDiscover: boolean) => void;
  /** Current image quality setting */
  imageQuality: 'low' | 'medium' | 'high';
  /** Function to change image quality */
  onImageQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  /** Whether to enable offline cache */
  enableOfflineCache: boolean;
  /** Function to toggle offline cache */
  onToggleOfflineCache: (enable: boolean) => void;
}

/**
 * Props for the API settings section
 */
export interface ApiSettingsProps extends BaseProps {
  /** Whether to use a custom API URL */
  useCustomApiUrl: boolean;
  /** Function to toggle use of custom API URL */
  onToggleUseCustomApiUrl: (use: boolean) => void;
  /** Current custom API URL */
  customApiUrl: string;
  /** Function to change custom API URL */
  onCustomApiUrlChange: (url: string) => void;
}

/**
 * Props for the reset settings button
 */
export interface ResetSettingsButtonProps extends BaseProps {
  /** Function to reset settings to defaults */
  onResetSettings: () => void;
}