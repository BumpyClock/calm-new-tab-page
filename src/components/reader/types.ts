// src/components/reader/types.ts
import { FeedItem } from '../../types/api';
import { BaseProps } from '../ui/types';

/**
 * Props for the reader view component
 */
export interface ReaderViewProps extends BaseProps {
  /** Feed item to display in reader view */
  feedItem: FeedItem;
  /** Function to call when reader view is closed */
  onClose: () => void;
  /** Whether to show the reader controls */
  showControls?: boolean;
}

/**
 * Props for the reader view header component
 */
export interface ReaderViewHeaderProps extends BaseProps {
  /** Title of the article */
  title: string;
  /** Author of the article */
  author?: string;
  /** Publication date */
  date?: string;
  /** Site name */
  siteName?: string;
  /** Site favicon URL */
  favicon?: string;
  /** Featured image URL */
  image?: string;
  /** Estimated reading time in minutes */
  readingTime?: number;
  /** Function to close the reader view */
  onClose: () => void;
}

/**
 * Props for the reader view content component
 */
export interface ReaderViewContentProps extends BaseProps {
  /** HTML content to display */
  content: string;
  /** Type of content (article, podcast, video) */
  contentType: 'article' | 'podcast' | 'video';
  /** Additional media for the content (e.g., audio/video URLs) */
  media?: Array<{
    url: string;
    type: string;
    duration?: number;
  }>;
  /** Current font size */
  fontSize?: number;
  /** Current font family */
  fontFamily?: string;
}

/**
 * Props for the reader view controls component
 */
export interface ReaderViewControlsProps extends BaseProps {
  /** Current font size */
  fontSize: number;
  /** Function to change font size */
  onFontSizeChange: (size: number) => void;
  /** Current font family */
  fontFamily: string;
  /** Function to change font family */
  onFontFamilyChange: (family: string) => void;
  /** Original article URL */
  articleUrl: string;
  /** Whether the article is in favorites */
  isFavorite?: boolean;
  /** Function to toggle favorite status */
  onToggleFavorite?: () => void;
  /** Function to share the article */
  onShare?: () => void;
}

/**
 * Props for the progress indicator component
 */
export interface ProgressIndicatorProps extends BaseProps {
  /** Current scroll progress (0-100) */
  progress: number;
  /** Total reading time in minutes */
  totalTime?: number;
  /** Time remaining in minutes */
  remainingTime?: number;
}

/**
 * Props for media player components in reader view
 */
export interface MediaPlayerProps extends BaseProps {
  /** URL of the media */
  src: string;
  /** Type of media (audio/video) */
  type: string;
  /** Poster image URL for video */
  poster?: string;
  /** Title of the media */
  title?: string;
  /** Author of the media */
  author?: string;
  /** Duration in seconds */
  duration?: number;
  /** Whether to autoplay */
  autoPlay?: boolean;
}