// src/components/feed/FeedCard.tsx
import { useMemo, FC, memo } from "react";
import { motion } from "motion/react";
import { FeedItem, FeedType } from "../../types/api";
import { formatDate, createTextPreview, sanitizeHTML } from "../../utils";
import { BlurImage } from "../ui";

export interface FeedCardProps {
  /** Feed item data to display */
  data: FeedItem;
  /** Callback when card is selected */
  onSelect: (item: FeedItem) => void;
  /** CSS class to apply to container */
  className?: string;
}

/**
 * Card component that displays a feed item preview
 */
const FeedCard: FC<FeedCardProps> = memo(({ 
  data, 
  onSelect,
  className = "" 
}) => {
  // Memoize derived values for performance
  const displayDate = useMemo(() => 
    formatDate(data.published || data.created), 
    [data.published, data.created]
  );
  
  const description = useMemo(() => 
    data.description || createTextPreview(data.content), 
    [data.description, data.content]
  );
  
  const sanitizedTitle = useMemo(() => 
    sanitizeHTML(data.title), 
    [data.title]
  );
  
  const sanitizedDescription = useMemo(() => 
    sanitizeHTML(description), 
    [description]
  );
  
  // Generate subtitle based on feed type
  const subtitle = useMemo(() => {
    switch (data.type) {
      case FeedType.PODCAST:
        return `Podcast${data.duration ? ` • ${Math.round(data.duration / 60)} min` : ''}`;
      case FeedType.VIDEO:
        return `Video${data.duration ? ` • ${Math.round(data.duration / 60)} min` : ''}`;
      default:
        return displayDate;
    }
  }, [data.type, data.duration, displayDate]);

  const handleClick = () => {
    onSelect(data);
  };

  // Determine card icon based on type
  const getTypeIcon = () => {
    switch (data.type) {
      case FeedType.PODCAST:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
          </svg>
        );
      case FeedType.VIDEO:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      layoutId={`feed-${data.id}`}
      className={`cursor-pointer bg-white dark:bg-gray-800 shadow-md overflow-hidden hover:shadow-lg rounded-[24px] transition-shadow duration-150 ease-in-out ${className}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      role="article"
      tabIndex={0}
      aria-label={`Article: ${sanitizedTitle}`}
      // Start fully visible to avoid flashing
      initial={{ opacity: 1 }}
      whileHover={{ y: -3 }}
      transition={{ 
        type: "spring", 
        stiffness: 80,  // Gentler spring
        damping: 20,    // More damping for less bounce
        mass: 1,
        layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } // Smoother layout transitions
      }}
    >
      {data.thumbnail && (
        <div className="p-2 pt-2">
          <div className="relative h-48 overflow-hidden rounded-[20px]">
            <BlurImage
              src={data.thumbnail}
              alt={sanitizedTitle}
              layout={true}
              layoutId={`feed-image-${data.id}`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {data.type === FeedType.VIDEO && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-40 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center mb-2">
          {data.favicon && (
            <img
              src={data.favicon}
              alt={data.siteTitle || data.feedTitle || "Favicon"}
              className="w-5 h-5 mr-2 rounded-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 text-left truncate max-w-[200px]">
            {data.siteTitle || data.feedTitle || "Unknown Site"}
          </span>
        </div>

        <motion.h3 
          layoutId={`feed-title-${data.id}`}
          className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100 text-left line-clamp-2"
        >
          {sanitizedTitle}
        </motion.h3>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            {getTypeIcon()}
            {data.author && (
              <motion.span 
                layoutId={`feed-author-${data.id}`}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left truncate max-w-[150px]"
              >
                By {data.author}
              </motion.span>
            )}
          </div>
          
          <span className="text-xs text-gray-500 dark:text-gray-400 text-right">
            {subtitle}
          </span>
        </div>
        
        {sanitizedDescription && (
          <div className="pt-2">
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 text-left line-clamp-3">
              {sanitizedDescription}
            </p>
          </div>
        )}
        
        <motion.div
          layoutId={`feed-content-${data.id}`}
          className="opacity-0 h-0 overflow-hidden"
        >
          {/* This content will be visible in the modal */}
          <div className="w-full animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-between items-center mt-2">
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm text-left"
            onClick={(e) => e.stopPropagation()}
          >
            Read more
          </a>
          
          {/* Favorite button could go here */}
        </div>
      </div>
    </motion.div>
  );
});

// Display name for debugging
FeedCard.displayName = 'FeedCard';

export default FeedCard;