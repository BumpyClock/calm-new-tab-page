// src/components/settings/FeedList.tsx
import React, { useState, useEffect } from 'react';
import { FeedConfig } from '../../config/feeds.config';
import { groupFeedsByCategory } from '../../utils/feedStorage';

interface FeedListProps {
  feeds: FeedConfig[];
  onRemove: (feedUrl: string) => void;
  onReorder: (feedUrls: string[]) => void;
  loading: boolean;
}

/**
 * List of feeds for the settings page with actions to manage them
 */
const FeedList: React.FC<FeedListProps> = ({ feeds, onRemove, onReorder, loading }) => {
  const [draggedFeed, setDraggedFeed] = useState<string | null>(null);
  const [groupedFeeds, setGroupedFeeds] = useState<Record<string, FeedConfig[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Group feeds by category
  useEffect(() => {
    const grouped = groupFeedsByCategory(feeds);
    setGroupedFeeds(grouped);
    
    // Initialize expanded state for all categories
    const expanded: Record<string, boolean> = {};
    Object.keys(grouped).forEach(category => {
      // By default, expand all categories
      expanded[category] = true;
    });
    setExpandedCategories(expanded);
  }, [feeds]);

  /**
   * Toggle category expansion
   */
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  /**
   * Handle drag start event
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, feedUrl: string) => {
    setDraggedFeed(feedUrl);
    e.dataTransfer.setData('text/plain', feedUrl);
    e.currentTarget.classList.add('opacity-50');
  };

  /**
   * Handle drag end event
   */
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedFeed(null);
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Handle drop event for reordering
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetFeedUrl: string) => {
    e.preventDefault();
    
    if (!draggedFeed || draggedFeed === targetFeedUrl) return;
    
    // Create a new array of feed URLs in the correct order
    const feedUrls = feeds.map(feed => feed.url);
    const draggedIndex = feedUrls.indexOf(draggedFeed);
    const targetIndex = feedUrls.indexOf(targetFeedUrl);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove the dragged feed
      feedUrls.splice(draggedIndex, 1);
      
      // Insert it at the target position
      feedUrls.splice(targetIndex, 0, draggedFeed);
      
      // Update the order
      onReorder(feedUrls);
    }
    
    setDraggedFeed(null);
  };

  /**
   * Render loading skeleton
   */
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
            <div className="ml-3 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 mt-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (feeds.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No feeds</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You don't have any feeds added yet. Go to "Discover Feeds" to add some.
        </p>
      </div>
    );
  }

  /**
   * Render feed list by category
   */
  return (
    <div className="space-y-6">
      {Object.entries(groupedFeeds).map(([category, categoryFeeds]) => (
        <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Category header */}
          <div
            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 cursor-pointer"
            onClick={() => toggleCategory(category)}
          >
            <h4 className="font-medium text-gray-800 dark:text-gray-200 capitalize">
              {category}
              <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">
                ({categoryFeeds.length})
              </span>
            </h4>
            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              {expandedCategories[category] ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Feed items */}
          {expandedCategories[category] && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categoryFeeds.map(feed => (
                <div
                  key={feed.url}
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  draggable
                  onDragStart={e => handleDragStart(e, feed.url)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, feed.url)}
                >
                  {/* Drag handle */}
                  <div className="text-gray-400 dark:text-gray-500 cursor-move mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </div>
                  
                  {/* Feed favicon */}
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {feed.favicon ? (
                      <img 
                        src={feed.favicon} 
                        alt={feed.title} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // On error, replace with the first letter of the title
                          (e.target as HTMLImageElement).style.display = 'none';
                          const nextElement = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="h-full w-full flex items-center justify-center text-xl font-semibold text-gray-700 dark:text-gray-300"
                      style={{ display: feed.favicon ? 'none' : 'flex' }}
                    >
                      {feed.title.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Feed info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {feed.title}
                    </h4>
                    {feed.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {feed.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => onRemove(feed.url)}
                    className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:outline-none"
                    title="Remove feed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FeedList;