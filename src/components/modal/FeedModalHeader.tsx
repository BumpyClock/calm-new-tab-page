// src/components/modal/FeedModalHeader.tsx
import { FC } from 'react';
import { motion } from 'motion/react';
import { FeedItem } from '../../types/api';
import { BaseProps } from '../ui/types';
import { SiteInfo, FormatDate, IconButton } from '../ui';

/**
 * Props for the FeedModalHeader component
 */
export interface FeedModalHeaderProps extends BaseProps {
  /** Feed item to display in the header */
  feedItem: FeedItem;
  /** Function to close the modal */
  onClose: () => void;
  /** Whether to show the thumbnail image */
  showThumbnail?: boolean;
  /** Function to toggle favorite status */
  onToggleFavorite?: () => void;
  /** Whether the item is a favorite */
  isFavorite?: boolean;
  /** Function to share the content */
  onShare?: () => void;
}

/**
 * Header component for the feed modal
 */
const FeedModalHeader: FC<FeedModalHeaderProps> = ({
  feedItem,
  onClose,
  showThumbnail = true,
  onToggleFavorite,
  isFavorite = false,
  onShare,
  className = '',
  ...rest
}) => {
  return (
    <div 
      className={`relative p-4 md:p-6 ${className}`}
      {...rest}
    >
      {/* Thumbnail image */}
      {showThumbnail && feedItem.thumbnail && (
        <motion.img
          layout
          layoutId={`feed-image-${feedItem.id}`}
          src={feedItem.thumbnail}
          alt={feedItem.title}
          className="w-full max-h-[550px] object-cover rounded-[32px] mb-4"
          transition={{ duration: 0.25 }}
        />
      )}
      
      {/* Title */}
      <motion.h1
        layoutId={`feed-title-${feedItem.id}`}
        className="text-2xl font-bold mb-4 text-left"
        initial={{ fontSize: '1.5rem' }}
        animate={{ fontSize: '2rem' }}
        transition={{ duration: 0.25 }}
      >
        {feedItem.title}
      </motion.h1>
      
      {/* Metadata row */}
      <div className="flex items-center justify-between mb-6">
        {/* Site info */}
        <SiteInfo
          siteName={feedItem.siteTitle || feedItem.feedTitle || "Unknown Site"}
          favicon={feedItem.favicon}
          size="md"
        />
        
        {/* Right side info */}
        <div className="flex items-center space-x-4">
          {/* Author */}
          {feedItem.author && (
            <motion.div
              layoutId={`feed-author-${feedItem.id}`}
              transition={{ duration: 0.25 }}
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">
                By {feedItem.author}
              </span>
            </motion.div>
          )}
          
          {/* Date */}
          {(feedItem.published || feedItem.created) && (
            <FormatDate 
              date={feedItem.published || feedItem.created}
              format="full"
            />
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex space-x-2">
        {/* Favorite button */}
        {onToggleFavorite && (
          <IconButton
            icon={
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={isFavorite ? "0" : "2"}
                className={isFavorite ? "fill-current" : "fill-none"}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
            }
            variant="ghost"
            size="md"
            tooltip={isFavorite ? "Remove from favorites" : "Add to favorites"}
            onClick={onToggleFavorite}
            active={isFavorite}
          />
        )}
        
        {/* Share button */}
        {onShare && (
          <IconButton
            icon={
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
                />
              </svg>
            }
            variant="ghost"
            size="md"
            tooltip="Share"
            onClick={onShare}
          />
        )}
        
        {/* Close button */}
        <IconButton
          icon={
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          }
          variant="ghost"
          size="md"
          tooltip="Close"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

export default FeedModalHeader;