// src/components/settings/FeedDiscoveryEnhanced.tsx
import React, { useState, useEffect } from 'react';
import { useFeed } from '../../context/FeedContext';
import { FeedConfig } from '../../config/feeds.config';
import { defaultFeedCategories } from '../../config/feeds.config';

interface FeedDiscoveryEnhancedProps {
  onAddFeed: (feed: FeedConfig) => void;
}

/**
 * Enhanced feed discovery component for finding and adding new feeds
 */
const FeedDiscoveryEnhanced: React.FC<FeedDiscoveryEnhancedProps> = ({ onAddFeed }) => {
  const { discoverFeeds, userFeeds } = useFeed();
  
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredFeeds, setDiscoveredFeeds] = useState<FeedConfig[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  
  // Generate suggestions from default feed categories
  const suggestions = defaultFeedCategories.flatMap(category => category.feeds);
  
  // Filter out feeds that are already in user feeds
  const userFeedUrls = new Set(userFeeds.map(feed => feed.url));
  const filteredSuggestions = suggestions.filter(feed => !userFeedUrls.has(feed.url));
  
  // Filter discovered feeds to remove any that are already in user feeds
  useEffect(() => {
    setDiscoveredFeeds(prevDiscovered => 
      prevDiscovered.filter(feed => !userFeedUrls.has(feed.url))
    );
  }, [userFeeds]);

  /**
   * Handle URL input change
   */
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  /**
   * Discover feeds from the entered URL
   */
  const handleDiscover = async () => {
    // Basic URL validation
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    // Add https:// if no protocol is specified
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      formattedUrl = `https://${url}`;
    }
    
    try {
      setLoading(true);
      setError(null);
      setShowSuggestions(false);
      
      const feeds = await discoverFeeds(formattedUrl);
      
      if (feeds.length === 0) {
        setError(`No feeds found at ${formattedUrl}`);
      } else {
        // Filter out feeds that are already in user feeds
        const newFeeds = feeds.filter(feed => !userFeedUrls.has(feed.url));
        setDiscoveredFeeds(newFeeds);
        
        if (newFeeds.length === 0 && feeds.length > 0) {
          setError('All discovered feeds are already in your subscriptions');
        }
      }
    } catch (err) {
      setError(`Error discovering feeds: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle adding a discovered feed
   */
  const handleAddFeed = (feed: FeedConfig) => {
    onAddFeed(feed);
    
    // Remove from discovered feeds
    setDiscoveredFeeds(prev => prev.filter(f => f.url !== feed.url));
  };

  /**
   * Handle showing feed suggestions
   */
  const handleShowSuggestions = () => {
    setShowSuggestions(true);
    setDiscoveredFeeds([]);
    setError(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Discover Feeds
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enter a website URL to discover available RSS feeds.
        </p>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter website URL (e.g., nytimes.com)"
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleDiscover}
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? 'Discovering...' : 'Discover'}
          </button>
          
          {(discoveredFeeds.length > 0 || error) && (
            <button
              onClick={handleShowSuggestions}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Back to Suggestions
            </button>
          )}
        </div>
        
        {error && (
          <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
      
      {/* Feed suggestions or discovery results */}
      <div>
        {showSuggestions ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Suggested Feeds
            </h3>
            {filteredSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSuggestions.map(feed => (
                  <FeedCard
                    key={feed.url}
                    feed={feed}
                    onAdd={() => handleAddFeed(feed)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                You've already added all the suggested feeds.
              </p>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Discovered Feeds
            </h3>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 mt-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : discoveredFeeds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveredFeeds.map(feed => (
                  <FeedCard
                    key={feed.url}
                    feed={feed}
                    onAdd={() => handleAddFeed(feed)}
                  />
                ))}
              </div>
            ) : !error ? (
              <p className="text-gray-600 dark:text-gray-400">
                No feeds discovered. Try a different URL.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Card component for displaying a feed
 */
interface FeedCardProps {
  feed: FeedConfig;
  onAdd: () => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ feed, onAdd }) => {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start">
        {/* Feed favicon */}
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
              {feed.description}
            </p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            <a 
              href={feed.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-500 dark:hover:text-blue-400"
            >
              {feed.url}
            </a>
          </div>
        </div>
        
        {/* Add button */}
        <button
          onClick={onAdd}
          className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default FeedDiscoveryEnhanced;