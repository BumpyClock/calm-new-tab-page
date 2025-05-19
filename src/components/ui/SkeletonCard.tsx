// src/components/ui/SkeletonCard.tsx
import { FC } from 'react';
import { motion } from 'motion/react';

export interface SkeletonCardProps {
  /** Unique ID for the skeleton card */
  id: string;
  /** Optional class name */
  className?: string;
}

/**
 * Skeleton loader card that matches FeedCard dimensions and layout
 */
const SkeletonCard: FC<SkeletonCardProps> = ({ id, className = '' }) => {
  // Randomize heights to mimic real content variation
  const titleLines = Math.floor(Math.random() * 2) + 1; // 1 or 2 lines
  const descriptionLines = Math.floor(Math.random() * 2) + 2; // 2 or 3 lines

  // Randomize widths for more realistic appearance
  const getRandomWidth = () => `${65 + Math.floor(Math.random() * 35)}%`;
  
  return (
    <motion.div
      layout
      layoutId={`feed-${id}`}
      // Start already visible - no animation on mount
      initial={{ opacity: 1 }}
      transition={{
        layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } // Only smooth layout transitions
      }}
      className={`bg-white dark:bg-gray-800 shadow-md overflow-hidden rounded-[24px] ${className}`}
    >
      {/* Thumbnail placeholder */}
      <div className="p-2 pt-2">
        <motion.div 
          layoutId={`feed-image-${id}`}
          className="relative h-48 rounded-[20px] bg-gray-200 dark:bg-gray-700 animate-pulse overflow-hidden"
        />
      </div>
      
      <div className="p-4">
        {/* Site info with favicon */}
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 rounded-sm bg-gray-200 dark:bg-gray-700 animate-pulse mr-2"></div>
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Title placeholder */}
        <motion.div 
          layoutId={`feed-title-${id}`}
          className="mb-2 space-y-2"
        >
          {Array.from({ length: titleLines }).map((_, i) => (
            <div 
              key={`title-${i}`} 
              className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" 
              style={{ width: i === titleLines - 1 ? getRandomWidth() : '100%' }}
            ></div>
          ))}
        </motion.div>
        
        {/* Author and date */}
        <div className="flex justify-between items-center">
          <motion.div 
            layoutId={`feed-author-${id}`}
            className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          ></motion.div>
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Description */}
        <div className="pt-2 space-y-2">
          {Array.from({ length: descriptionLines }).map((_, i) => (
            <div 
              key={`desc-${i}`} 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" 
              style={{ width: i === descriptionLines - 1 ? getRandomWidth() : '100%' }}
            ></div>
          ))}
        </div>
        
        {/* Read more link */}
        <div className="mt-4">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Hidden content placeholder for modal */}
        <motion.div
          layoutId={`feed-content-${id}`}
          className="opacity-0 h-0 overflow-hidden"
        >
          <div className="w-full">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SkeletonCard;