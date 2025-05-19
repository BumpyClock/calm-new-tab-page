// src/components/discovery/types.ts
import { DiscoveredFeed } from '../../types/api';
import { FeedConfig } from '../../config/feeds.config';
import { BaseProps } from '../ui/types';

/**
 * Props for the feed discovery component
 */
export interface FeedDiscoveryProps extends BaseProps {
  /** Function to call when feeds are subscribed to */
  onSubscribe: (feeds: FeedConfig[]) => void;
  /** Whether feed discovery is enabled in settings */
  isEnabled?: boolean;
}

/**
 * Props for the feed discovery modal
 */
export interface FeedDiscoveryModalProps extends BaseProps {
  /** Function to call when modal is closed */
  onClose: () => void;
  /** Function to call when feeds are subscribed to */
  onSubscribe: (feeds: FeedConfig[]) => void;
  /** Initial URL to discover feeds from */
  initialUrl?: string;
}

/**
 * Props for the feed discovery input
 */
export interface FeedDiscoveryInputProps extends BaseProps {
  /** Initial URL value */
  initialValue?: string;
  /** Function to call when URL is submitted */
  onSubmit: (url: string) => void;
  /** Whether the input is in loading state */
  isLoading?: boolean;
}

/**
 * Props for the discovered feeds list
 */
export interface DiscoveredFeedsListProps extends BaseProps {
  /** List of discovered feeds */
  feeds: DiscoveredFeed[];
  /** Function to call when feeds are selected */
  onSelect: (selected: DiscoveredFeed[]) => void;
  /** Function to call when feeds are subscribed to */
  onSubscribe: (feeds: FeedConfig[]) => void;
  /** Whether the list is in loading state */
  isLoading?: boolean;
}

/**
 * Props for an individual discovered feed item
 */
export interface DiscoveredFeedItemProps extends BaseProps {
  /** Discovered feed data */
  feed: DiscoveredFeed;
  /** Whether the feed is selected */
  isSelected: boolean;
  /** Function to toggle selection */
  onToggleSelect: (feed: DiscoveredFeed) => void;
  /** Whether the feed is already subscribed to */
  isSubscribed?: boolean;
}