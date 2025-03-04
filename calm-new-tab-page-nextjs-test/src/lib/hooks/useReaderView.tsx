"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import ReaderView from '@/components/reader/ReaderView';

interface ReaderViewContextType {
  openReaderView: (url: string) => void;
  closeReaderView: () => void;
  isReaderViewOpen: boolean;
  currentUrl: string | null;
}

const ReaderViewContext = createContext<ReaderViewContextType | undefined>(undefined);

export function ReaderViewProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  const openReaderView = useCallback((url: string) => {
    setCurrentUrl(url);
    setIsOpen(true);
    // Prevent background scrolling when modal is open
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const closeReaderView = useCallback(() => {
    setIsOpen(false);
    // Restore scrolling when modal is closed
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, []);

  return (
    <ReaderViewContext.Provider
      value={{
        openReaderView,
        closeReaderView,
        isReaderViewOpen: isOpen,
        currentUrl,
      }}
    >
      {children}
      {currentUrl && (
        <ReaderView 
          url={currentUrl} 
          onClose={closeReaderView} 
          isOpen={isOpen} 
        />
      )}
    </ReaderViewContext.Provider>
  );
}

export function useReaderView() {
  const context = useContext(ReaderViewContext);
  if (context === undefined) {
    throw new Error('useReaderView must be used within a ReaderViewProvider');
  }
  return context;
}