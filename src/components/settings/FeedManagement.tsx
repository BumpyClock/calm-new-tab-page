// src/components/settings/FeedManagement.tsx
import React, { useState } from 'react';
import { useFeed } from '../../context/FeedContext';
import { FeedConfig } from '../../config/feeds.config';
import FeedDiscoveryEnhanced from './FeedDiscoveryEnhanced';
import FeedList from './FeedList';

/**
 * Component for managing feeds in the settings page
 */
const FeedManagement: React.FC = () => {
  const { 
    userFeeds, 
    addFeed, 
    removeFeed, 
    reorderFeeds, 
    loadDefaultFeeds, 
    loading 
  } = useFeed();
  
  const [activeTab, setActiveTab] = useState<'current' | 'discover'>('current');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  /**
   * Handle adding a new feed
   */
  const handleAddFeed = async (feed: FeedConfig) => {
    try {
      await addFeed(feed);
      setMessage({ text: `Added feed: ${feed.title}`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        text: `Failed to add feed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    }
  };

  /**
   * Handle removing a feed
   */
  const handleRemoveFeed = async (feedUrl: string) => {
    try {
      await removeFeed(feedUrl);
      setMessage({ text: 'Feed removed successfully', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        text: `Failed to remove feed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    }
  };

  /**
   * Handle reordering feeds
   */
  const handleReorderFeeds = async (feedUrls: string[]) => {
    try {
      await reorderFeeds(feedUrls);
      setMessage({ text: 'Feeds reordered successfully', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        text: `Failed to reorder feeds: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    }
  };

  /**
   * Handle resetting to default feeds
   */
  const handleResetToDefaults = async () => {
    try {
      await loadDefaultFeeds();
      setMessage({ text: 'Reset to default feeds successfully', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        text: `Failed to reset feeds: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Feed Management</h2>
        
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
        
        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-2 px-4 ${
              activeTab === 'current'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('current')}
          >
            Your Feeds
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === 'discover'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('discover')}
          >
            Discover Feeds
          </button>
        </div>
        
        {/* Tab content */}
        <div className="mb-6">
          {activeTab === 'current' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Your Subscribed Feeds</h3>
                <button
                  onClick={handleResetToDefaults}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
              
              <FeedList 
                feeds={userFeeds} 
                onRemove={handleRemoveFeed} 
                onReorder={handleReorderFeeds}
                loading={loading}
              />
            </div>
          ) : (
            <FeedDiscoveryEnhanced onAddFeed={handleAddFeed} />
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedManagement;