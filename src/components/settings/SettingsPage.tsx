// src/components/settings/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useFeed } from '../../context/FeedContext';
import FeedManagement from './FeedManagement';
import FeedCategorization from './FeedCategorization';
import { defaultFeedCategories } from '../../config/feeds.config';
import { updateUserFeed } from '../../utils/feedStorage';

/**
 * Component for the settings page, including feed management
 */
const SettingsPage: React.FC = () => {
  const { userFeeds } = useFeed();
  const [apiUrl, setApiUrl] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'feeds' | 'categories'>('general');

  // Get all unique category IDs from default feed categories
  const defaultCategoryIds = defaultFeedCategories.map(cat => cat.id);
  
  // Add "uncategorized" to the list
  const availableCategories = ['uncategorized', ...defaultCategoryIds];

  useEffect(() => {
    // Get API URL from Chrome storage
    chrome.runtime.sendMessage({ action: 'getApiUrl' }, (response: any) => {
      setApiUrl(response.apiUrl);
    });
  }, []);

  /**
   * Update API URL in Chrome storage
   */
  const updateApiUrl = () => {
    chrome.runtime.sendMessage({ action: 'setApiUrl', apiUrl }, (response: any) => {
      if (response.success) {
        setMessage('API URL updated successfully!');
      } else {
        setMessage('Failed to update API URL.');
      }
    });
  };

  /**
   * Update a feed's properties
   */
  const handleUpdateFeed = async (feedUrl: string, updates: Partial<any>): Promise<void> => {
    await updateUserFeed(feedUrl, updates);
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Extension Settings
        </h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'general'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'feeds'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('feeds')}
          >
            Feeds
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'categories'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
        </div>
        
        {/* Tab content */}
        <div>
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                General Settings
              </h2>
              
              <div className="space-y-4">
                {/* API URL Setting */}
                <div>
                  <label 
                    htmlFor="apiUrl" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    API URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="apiUrl"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button 
                      onClick={updateApiUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Update
                    </button>
                  </div>
                  
                  {message && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                      {message}
                    </p>
                  )}
                </div>
                
                {/* Theme Settings - placeholder for future implementation */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    Theme
                  </h3>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        value=""
                        className="sr-only peer"
                        disabled
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                        Dark Mode (Auto)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'feeds' && (
            <FeedManagement />
          )}
          
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <FeedCategorization 
                feeds={userFeeds} 
                onUpdateFeed={handleUpdateFeed}
                availableCategories={availableCategories}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;