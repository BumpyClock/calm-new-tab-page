// src/components/feed/SmartFeedList.tsx
import { useCallback, useEffect, FC, useState, useMemo } from 'react';
import { Masonry } from 'masonic';
import { FeedItem } from '../../types/api';
import { useFeed } from '../../context';
import { motion, AnimatePresence } from 'motion/react';
import FeedModal from '../modal/FeedModal';
import FeedCard from './FeedCard';
import { SkeletonCard } from '../ui';

export interface SmartFeedListProps {
  /** Additional class name */
  className?: string;
}

/**
 * Enhanced feed list with seamless skeleton to content transitions
 */
const SmartFeedList: FC<SmartFeedListProps> = ({ className = '' }) => {
  // Single loading state to track content readiness
  const [contentReady, setContentReady] = useState<boolean>(false);
  
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

  // Create skeleton placeholders when loading
  const skeletonItems = useMemo(() => {
    if (!loading || feedItems.length > 0) return [];
    
    // Create placeholder items that match the structure of real feed items
    return Array.from({ length: 6 }).map((_, i) => ({
      id: `skeleton-${i}`,
      title: 'Loading...',
      link: '',
      type: 'article',
      isPlaceholder: true
    } as unknown as FeedItem));
  }, [loading, feedItems.length]);
  
  // Error handling is now managed through the try/catch in renderFeedCard
  // and the ErrorBoundary component in App.tsx
  
  // Combine real items with skeletons when loading
  const displayItems = useMemo(() => {
    if (feedItems.length > 0) return feedItems;
    return skeletonItems;
  }, [feedItems, skeletonItems]);

  // Poll for feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFeeds();
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(interval);
  }, [refreshFeeds]);

  // Handler functions
  const handleRefresh = useCallback(() => refreshFeeds(), [refreshFeeds]);
  const handleLoadDefaultFeeds = useCallback(() => loadDefaultFeeds(), [loadDefaultFeeds]);
  const handleSelectItem = useCallback((item: FeedItem) => selectFeedItem(item), [selectFeedItem]);
  const handleCloseModal = useCallback(() => selectFeedItem(null), [selectFeedItem]);

  // Only need to track when the content is ready to display
  useEffect(() => {
    // Reset content ready state when loading changes
    if (loading) {
      setContentReady(false);
    }
    
    // If we have feed items and they're done loading, show content
    if (feedItems.length > 0 && !loading) {
      // Simple delay to ensure smooth transition
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 200);
      
      return () => clearTimeout(timer);
    }
    
    // Explicit return for when the if condition isn't met
    return undefined;
  }, [feedItems, loading]);

  // Simplified renderer with unified skeleton-to-content transition
  const renderFeedCard = useCallback(({ data }: { data: FeedItem; index: number }) => {
    const isPlaceholder = (data as any).isPlaceholder === true;
    
    try {
      // If we're showing placeholders or still loading, show skeleton
      if (isPlaceholder || !contentReady) {
        return (
          <div className="w-full">
            <SkeletonCard id={data.id} />
          </div>
        );
      }
      
      // Content is ready, show the actual card with a simple fade-in
      return (
        <motion.div 
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <FeedCard
            data={data}
            onSelect={handleSelectItem}
          />
        </motion.div>
      );
    } catch (error) {
      console.error('Error rendering feed card:', error);
      // Fallback for any rendering errors
      return (
        <div className="w-full p-4 bg-white dark:bg-gray-800 shadow-md rounded-[24px]">
          <p className="text-red-500">Error displaying this content</p>
        </div>
      );
    }
  }, [contentReady, handleSelectItem]);

  // Handle empty state
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
    <div className={`w-full mx-auto h-full p-4 ${className}`}>
      <div className="flex justify-between items-center mb-6">
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
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Always use the same grid structure whether loading or not */}
      <Masonry
        items={displayItems}
        columnGutter={36}
        columnWidth={350}
        overscanBy={2}
        render={renderFeedCard}
      />
      
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
    </div>
  );
};

export default SmartFeedList;