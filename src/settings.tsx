// src/settings.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SettingsPage } from './components/settings';
import { ThemeProvider, SettingsProvider, FeedProvider } from './context';
import './index.css';

/**
 * Settings page entry point
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <FeedProvider>
          <SettingsPage />
        </FeedProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>
);