// src/components/settings/FeedCategorization.tsx
import React, { useState, useEffect } from 'react';
import { FeedConfig } from '../../config/feeds.config';
import { groupFeedsByCategory } from '../../utils/feedStorage';

interface FeedCategorizationProps {
  feeds: FeedConfig[];
  onUpdateFeed: (feedUrl: string, updates: Partial<FeedConfig>) => Promise<void>;
  availableCategories: string[];
}

/**
 * Component for categorizing feeds
 */
const FeedCategorization: React.FC<FeedCategorizationProps> = ({ 
  feeds, 
  onUpdateFeed,
  availableCategories
}) => {
  const [groupedFeeds, setGroupedFeeds] = useState<Record<string, FeedConfig[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Group feeds by category
  useEffect(() => {
    setGroupedFeeds(groupFeedsByCategory(feeds));
  }, [feeds]);

  /**
   * Handle changing a feed's category
   */
  const handleCategoryChange = async (feed: FeedConfig, category: string) => {
    try {
      setLoading(true);
      await onUpdateFeed(feed.url, { category });
      
      setMessage({ 
        text: `Moved "${feed.title}" to ${category} category`, 
        type: 'success' 
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        text: `Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Categorize Feeds
      </h3>
      
      {/* Status message */}
      {message && (
        <div 
          className={`p-3 mb-4 rounded ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
      
      {/* No feeds message */}
      {feeds.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          No feeds to categorize. Add some feeds first.
        </p>
      ) : (
        <div className="space-y-6">
          {/* List of feeds by category */}
          {Object.entries(groupedFeeds).map(([category, categoryFeeds]) => (
            <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-50 dark:bg-gray-750">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                  {category}
                  <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">
                    ({categoryFeeds.length})
                  </span>
                </h4>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {categoryFeeds.map(feed => (
                  <div key={feed.url} className="flex items-center p-3">
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
                    
                    {/* Category dropdown */}
                    <select
                      value={feed.category || 'uncategorized'}
                      onChange={(e) => handleCategoryChange(feed, e.target.value)}
                      disabled={loading}
                      className="ml-2 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedCategorization;