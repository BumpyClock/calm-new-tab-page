// src/components/modal/FeedModalContent.tsx
import { FC } from 'react';
import { motion } from 'motion/react';
import { FeedItem, FeedType } from '../../types/api';
import { BaseProps } from '../ui/types';
import { useSettings } from '../../context';

/**
 * Props for the FeedModalContent component
 */
export interface FeedModalContentProps extends BaseProps {
  /** Feed item to display */
  feedItem: FeedItem;
  /** HTML content to display */
  content: string;
  /** Whether the content is loading */
  isLoading: boolean;
}

/**
 * Content component for the feed modal
 */
const FeedModalContent: FC<FeedModalContentProps> = ({
  feedItem,
  content,
  isLoading,
  className = '',
  ...rest
}) => {
  const { settings } = useSettings();
  
  // Render appropriate content based on content type and loading state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full animate-pulse">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10/12"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-9/12"></div>
            </div>
            
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8/12"></div>
            </div>
            
            <div className="h-52 bg-gray-200 dark:bg-gray-700 rounded"></div>
            
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-7/12 my-4"></div>
            
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10/12"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-9/12"></div>
            </div>
          </div>
        </div>
      );
    }
    
    switch (feedItem.type) {
      case FeedType.ARTICLE:
        return (
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            style={{
              fontSize: `${settings.readerViewFontSize}px`,
              fontFamily: settings.readerViewFontFamily
            }}
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        );
        
      case FeedType.PODCAST:
        return (
          <div className="flex flex-col items-center space-y-6 p-4">
            <div className="w-full max-w-3xl bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Podcast Player</h3>
              {feedItem.enclosures && feedItem.enclosures.length > 0 ? (
                <audio 
                  controls 
                  className="w-full" 
                  src={feedItem.enclosures[0].url}
                  preload="metadata"
                >
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <p>No audio found for this podcast. Please visit the original site.</p>
              )}
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {feedItem.duration ? `Duration: ${Math.floor(feedItem.duration / 60)}:${String(feedItem.duration % 60).padStart(2, '0')}` : ''}
                </p>
              </div>
            </div>
            <div className="w-full max-w-3xl">
              <h3 className="text-xl font-semibold mb-4">Show Notes</h3>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: content || feedItem.description || 'No show notes available.' }} 
              />
            </div>
          </div>
        );
        
      case FeedType.VIDEO:
        return (
          <div className="flex flex-col items-center space-y-6 p-4">
            <div className="w-full max-w-3xl">
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-black">
                {feedItem.enclosures && feedItem.enclosures.length > 0 ? (
                  <video 
                    controls 
                    className="w-full" 
                    src={feedItem.enclosures[0].url}
                    poster={feedItem.thumbnail}
                  >
                    Your browser does not support the video element.
                  </video>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white">Video not available. Please visit the original site.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full max-w-3xl">
              <h3 className="text-xl font-semibold mb-4">Description</h3>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: content || feedItem.description || 'No description available.' }} 
              />
            </div>
          </div>
        );
        
      default:
        return <div>Unsupported content type.</div>;
    }
  };
  
  return (
    <motion.div 
      layout
      layoutId={`feed-content-${feedItem.id}`}
      key={`feed-content-${feedItem.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`text-left text-gray-600 dark:text-gray-300 reader-view-article ${className}`}
      {...rest}
    >
      {renderContent()}
    </motion.div>
  );
};

export default FeedModalContent;