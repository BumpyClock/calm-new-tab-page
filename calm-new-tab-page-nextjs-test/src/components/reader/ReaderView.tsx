"use client";

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReaderViewResponse } from '@/types';
import { fetchReaderView, estimateReadingTime } from '@/lib/api';

interface ReaderViewProps {
  url: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function ReaderView({ url, onClose, isOpen }: ReaderViewProps) {
  const [article, setArticle] = useState<ReaderViewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url || !isOpen) return;
    
    const loadArticle = async () => {
      setIsLoading(true);
      try {
        const response = await fetchReaderView(url);
        setArticle(response);
      } catch (error) {
        console.error('Failed to load article:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadArticle();
  }, [url, isOpen]);

  // Calculate reading progress as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadingProgress(Math.min(Math.max(0, progress), 100));
    };
    
    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Prevent modal events from propagating to the background
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="reader-view-modal fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center transition-opacity duration-300"
      style={{ opacity: isOpen ? 1 : 0 }}
      onClick={onClose}
    >
      <div className="noise absolute inset-0 bg-[url('/images/noisy-background.jpg')] bg-repeat opacity-5 pointer-events-none"></div>
      
      <div 
        ref={contentRef}
        className="reader-view-content bg-background max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4 md:mx-auto rounded-lg shadow-xl"
        onClick={handleModalClick}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="reader-view-close absolute top-6 right-6 z-10 text-foreground/80 hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X size={24} />
        </Button>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner h-12 w-12 rounded-full border-4 border-t-primary animate-spin"></div>
          </div>
        ) : article ? (
          <>
            <div className="reader-view-header sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-8 pb-4 border-b">
              <div id="website-info-placeholder" className="flex items-center gap-2 mb-2">
                {article.favicon && (
                  <img 
                    src={article.favicon} 
                    alt={`${article.siteName} Favicon`} 
                    className="site-favicon w-5 h-5 rounded"
                  />
                )}
                <span className="text-sm font-medium">{article.siteName}</span>
              </div>
              
              <h1 className="reader-view-title text-2xl font-bold mb-2">{article.title}</h1>
              
              <p className="reader-view-reading-time text-sm font-bold opacity-75 mb-3">
                {estimateReadingTime(article.textContent)} minutes
              </p>
            </div>
            
            <div 
              className="reader-view-article px-8 py-6 prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </>
        ) : (
          <div className="p-8">
            <p>Failed to load article content.</p>
          </div>
        )}
      </div>
      
      <div className="progress-indicator-container fixed bottom-6 right-6 w-12 h-12 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
        <svg className="progress-circle" viewBox="0 0 36 36" width="100%" height="100%">
          <circle 
            className="progress-circle__background stroke-muted-foreground/20" 
            cx="18" cy="18" r="16" 
            fill="none" 
            strokeWidth="2"
          />
          <circle 
            className="progress-circle__progress stroke-primary" 
            cx="18" cy="18" r="16" 
            fill="none" 
            strokeWidth="2"
            strokeDasharray="100.53" 
            strokeDashoffset={100.53 - (readingProgress * 100.53 / 100)} 
            strokeLinecap="round"
            style={{ 
              transform: 'rotate(-90deg)', 
              transformOrigin: '50% 50%',
              transition: 'all 50ms ease-in' 
            }}
          />
        </svg>
      </div>
    </div>
  );
}