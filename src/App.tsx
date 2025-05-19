// src/App.tsx
import { FC } from 'react';
import { LayoutGroup } from 'motion/react';
import { BingBackground } from './components/background';
import { SmartFeedList } from './components/feed';
import { useSettings } from './context';
import { ErrorBoundary } from './components/ui';
import './App.css';

/**
 * Main App component
 */
const App: FC = () => {
  const { settings } = useSettings();

  return (
    <LayoutGroup>
      <div className="app-container">
        {settings.showBingBackground && <BingBackground />}
        
        <header className="py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Calm New Tab</h1>
          <button 
            onClick={() => chrome.runtime.openOptionsPage()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </header>
        
        <main className="flex-1 w-full max-w-7xl mx-auto">
          <ErrorBoundary
            fallback={
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
                <p className="mb-6">We encountered an error loading your feeds.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Reload page
                </button>
              </div>
            }
          >
            <SmartFeedList />
          </ErrorBoundary>
        </main>
        
        <footer className="py-4 text-center text-sm text-white opacity-70">
          <p className="mb-1">Calm New Tab Page</p>
          <p>A clean, customizable new tab experience with RSS feeds</p>
        </footer>
      </div>
    </LayoutGroup>
  );
};

export default App;
