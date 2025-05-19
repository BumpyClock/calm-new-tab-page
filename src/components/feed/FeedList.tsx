// src/components/feed/FeedList.tsx
import { useCallback, useEffect, FC, useState } from 'react';
import { Masonry } from 'masonic';
import { FeedItem } from '../../types/api';
import { useFeed } from '../../context';
import { motion, AnimatePresence } from 'motion/react';
import FeedModal from '../modal/FeedModal';
import CardTransition from './CardTransition';

export interface FeedListProps {
  /** Additional class name */
  className?: string;
}

/**
 * Component that displays a grid of feed items
 */
const FeedList: FC<FeedListProps> = ({ className = '' }) => {
  // IMPORTANT: All useState and useEffect hooks must be at the top level to avoid the 
  // "Rendered more hooks than during the previous render" error
  const [transitionComplete, setTransitionComplete] = useState(false);
  
  const { 
    feedItems, 
    loading, 
    refreshing, 
    selectedItem,
    error,
    selectFeedItem,
    refreshFeeds,
    loadDefaultFeeds
  } = useFeed();

  useEffect(() => {
    // Set up polling to refresh feeds periodically
    const interval = setInterval(() => {
      refreshFeeds();
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(interval);
  }, [refreshFeeds]);
  
  // Handle transition from loading to loaded state
  useEffect(() => {
    if (!loading && !transitionComplete) {
      // Use a delayed state update to allow for animation completion
      const timer = setTimeout(() => {
        setTransitionComplete(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, transitionComplete]);

  const handleRefresh = useCallback(() => {
    refreshFeeds();
  }, [refreshFeeds]);

  const handleLoadDefaultFeeds = useCallback(() => {
    loadDefaultFeeds();
  }, [loadDefaultFeeds]);

  const handleSelectItem = useCallback((item: FeedItem) => {
    selectFeedItem(item);
  }, [selectFeedItem]);

  const handleCloseModal = useCallback(() => {
    selectFeedItem(null);
  }, [selectFeedItem]);

  // Masonry renderer with smooth skeleton-to-content transition
  // Reduced loading time to minimize transition issues
  const renderFeedCard = useCallback(({ data, index }: { data: FeedItem, index: number }) => (
    <CardTransition
      feedItem={data}
      index={index}
      onSelect={handleSelectItem}
      minLoadingTime={400} // Reduced loading time for faster transitions
    />
  ), [handleSelectItem]);
  
  if (loading && feedItems.length === 0) {
    // Simplified skeleton with fewer animations to reduce browser load
    return (
      <div className={`w-full h-full flex flex-col items-center p-4 ${className}`}>
        <div className="w-full">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-40 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-24 animate-pulse"></div>
          </div>
          
          {/* Grid layout */}
          <div 
            className="mx-auto"
            style={{ maxWidth: "calc(350px * 3 + 36px * 2)" }}  
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-full" style={{ marginBottom: '36px' }}>
                  {/* Static skeleton cards without layoutId to avoid ID conflicts */}
                  <div className="bg-white dark:bg-gray-800 shadow-md overflow-hidden rounded-[24px]">
                    {/* Thumbnail skeleton */}
                    <div className="p-2 pt-2">
                      <div className="h-48 rounded-[20px] bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    </div>
                    
                    {/* Content skeleton */}
                    <div className="p-4">
                      {/* Site info */}
                      <div className="flex items-center mb-2">
                        <div className="w-5 h-5 rounded-sm bg-gray-200 dark:bg-gray-700 animate-pulse mr-2"></div>
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      
                      {/* Title */}
                      <div className="mb-2 space-y-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      </div>
                      
                      {/* Meta */}
                      <div className="mt-2 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (feedItems.length === 0 && !loading) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">No Feeds Available</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You don't have any feeds configured yet. Add feeds in the settings
            or use the default feeds to get started.
          </p>
          <button
            onClick={handleLoadDefaultFeeds}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Load Default Feeds
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={`w-full mx-auto h-full p-4 ${className}`}
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="flex justify-between items-center mb-6"
      >
        <h2 className="text-2xl font-bold">Latest Feeds</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors disabled:opacity-50"
        >
          {refreshing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </motion.div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Masonry
          items={feedItems}
          columnGutter={36}
          columnWidth={350}
          overscanBy={2}
          render={renderFeedCard}
        />
      </motion.div>
      
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <FeedModal
              feedItem={selectedItem}
              onClose={handleCloseModal}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FeedList;