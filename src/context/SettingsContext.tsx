// src/context/SettingsContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getFromStorage, setInStorage } from '../utils/storage';

// Define the settings interface
export interface Settings {
  showBingBackground: boolean;
  useCustomApiUrl: boolean;
  customApiUrl: string;
  autoDiscoverFeeds: boolean;
  readerViewFontSize: number;
  readerViewFontFamily: string;
  imageQuality: 'low' | 'medium' | 'high';
  cardSize: 'small' | 'medium' | 'large';
  loadItemsCount: number;
  enableOfflineCache: boolean;
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  showBingBackground: true,
  useCustomApiUrl: false,
  customApiUrl: 'https://api.digests.app',
  autoDiscoverFeeds: true,
  readerViewFontSize: 18,
  readerViewFontFamily: 'Geist',
  imageQuality: 'medium',
  cardSize: 'medium',
  loadItemsCount: 30,
  enableOfflineCache: true
};

// Context type with settings and update function
interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

// Storage key for settings
const STORAGE_KEY = 'user_settings';

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // State for settings
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await getFromStorage<Settings>(STORAGE_KEY);
        
        if (storedSettings) {
          // Merge stored settings with defaults for any missing properties
          setSettings(current => ({ ...current, ...storedSettings }));
        } else {
          // Use defaults and save them to storage
          await setInStorage(STORAGE_KEY, DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Function to update settings
  const updateSettings = async (updates: Partial<Settings>): Promise<void> => {
    try {
      // Update state with new settings
      const updatedSettings = { ...settings, ...updates };
      setSettings(updatedSettings);
      
      // Save to storage
      await setInStorage(STORAGE_KEY, updatedSettings);
      
      // If API URL changed, update background service
      if (updates.customApiUrl !== undefined || updates.useCustomApiUrl !== undefined) {
        updateApiUrl(updatedSettings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  // Function to reset settings to defaults
  const resetSettings = async (): Promise<void> => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await setInStorage(STORAGE_KEY, DEFAULT_SETTINGS);
      updateApiUrl(DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  // Helper to update API URL in background service
  const updateApiUrl = (settings: Settings): void => {
    const apiUrl = settings.useCustomApiUrl ? settings.customApiUrl : 'https://api.digests.app';
    chrome.runtime.sendMessage({ action: 'setApiUrl', apiUrl });
  };

  // Context value
  const contextValue: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};

export default SettingsContext;