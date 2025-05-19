// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getFromStorage, setInStorage } from '../utils/storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme_preference';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initialize theme from storage and system preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Get theme from storage
        const savedTheme = await getFromStorage<Theme>(STORAGE_KEY);
        const initialTheme = savedTheme || 'system';
        setThemeState(initialTheme);
        
        // Set initial dark mode based on theme and system preference
        updateDarkMode(initialTheme);
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        setIsDarkMode(mediaQuery.matches);
        applyThemeToDOM(mediaQuery.matches);
      }
    };

    // Set up event listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Apply theme to DOM
  const applyThemeToDOM = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Update dark mode based on theme and system preference
  const updateDarkMode = (newTheme: Theme) => {
    if (newTheme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isSystemDark);
      applyThemeToDOM(isSystemDark);
    } else {
      const isDark = newTheme === 'dark';
      setIsDarkMode(isDark);
      applyThemeToDOM(isDark);
    }
  };

  // Set theme function
  const setTheme = async (newTheme: Theme): Promise<void> => {
    try {
      setThemeState(newTheme);
      updateDarkMode(newTheme);
      await setInStorage(STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;