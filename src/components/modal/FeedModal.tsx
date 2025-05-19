// src/components/modal/FeedModal.tsx
import React, { useEffect, useState, FC, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { Readability } from '@mozilla/readability';
import { Modal } from './index';
import { FeedItem, FeedType } from '../../types/api';
import { useSettings } from '../../context';
import FeedModalHeader from './FeedModalHeader';
import FeedModalContent from './FeedModalContent';
import FeedModalControls from './FeedModalControls';

/**
 * Props for the FeedModal component
 */
export interface FeedModalProps {
  /** Feed item to display in the modal */
  feedItem: FeedItem;
  /** Function to call when modal is closed */
  onClose: () => void;
}

/**
 * Modal for displaying feed item content
 */
const FeedModal: FC<FeedModalProps> = ({ feedItem, onClose }) => {
  const [articleContent, setArticleContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isReaderMode, setIsReaderMode] = useState<boolean>(true);
  const [isReadLater, setIsReadLater] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  // Using settings context but not directly using settings variable
  const { /* settings */ } = useSettings();
  
  // Handler for toggling reader mode
  const handleToggleReaderMode = useCallback(() => {
    setIsReaderMode(prev => !prev);
  }, []);
  
  // Handler for toggling read later status
  const handleToggleReadLater = useCallback(() => {
    setIsReadLater(prev => !prev);
    // You would also save this to storage in a real implementation
  }, []);
  
  // Handler for toggling favorite status
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    // You would also save this to storage in a real implementation
  }, []);
  
  // Function to share the article
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: feedItem.title,
        text: feedItem.description,
        url: feedItem.link
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(feedItem.link).then(() => {
        alert('Link copied to clipboard!');
      }).catch(err => {
        console.error('Error copying to clipboard:', err);
      });
    }
  }, [feedItem]);
  
  // Custom scrollbar renderers
  const renderThumbVertical = useCallback(({ style, ...props }: { style: React.CSSProperties; [key: string]: any }) => {
    const thumbStyle = {
      backgroundColor: 'rgba(155, 155, 155, 0.5)',
      borderRadius: '4px',
      width: '6px',
    };
    return <div style={{ ...style, ...thumbStyle }} {...props} />;
  }, []);
  
  const renderTrackVertical = useCallback(({ style, ...props }: { style: React.CSSProperties; [key: string]: any }) => {
    const trackStyle = {
      right: '2px',
      bottom: '2px',
      top: '2px',
      borderRadius: '3px',
      width: '6px',
    };
    return <div style={{ ...style, ...trackStyle }} {...props} />;
  }, []);
  
  // Fetch and parse article content when feed item changes
  useEffect(() => {
    let isMounted = true;
    let contentLoaded = false;
    let timerElapsed = false;
    
    // Reset loading state when feed item changes
    setLoading(true);
    
    // Set initial states based on feed item properties
    setIsFavorite(feedItem.favorite || false);
    setIsReadLater(feedItem.readLater || false);
    
    // If type=article, fetch & parse content via Readability
    const fetchArticle = async () => {
      try {
        const response = await fetch(feedItem.link);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const article = new Readability(doc).parse();
        
        if (isMounted) {
          const cleaned = cleanupModalContent(article?.content || '', feedItem.thumbnail);
          setArticleContent(cleaned);
          
          // Mark content as loaded
          contentLoaded = true;
          
          // Only stop loading if minimum time has elapsed
          if (timerElapsed) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        if (isMounted) {
          setArticleContent('Error fetching content. Try opening the original article.');
          
          // Mark content as loaded even in error case
          contentLoaded = true;
          
          // Only stop loading if minimum time has elapsed
          if (timerElapsed) {
            setLoading(false);
          }
        }
      }
    };
    
    // Set a timer for minimum loading time
    const timer = setTimeout(() => {
      timerElapsed = true;
      
      // Only stop loading if content has loaded
      if (isMounted && contentLoaded) {
        setLoading(false);
      }
    }, 1200);
    
    if (feedItem.type === FeedType.ARTICLE) {
      fetchArticle();
    } else {
      // For non-article types, still respect the minimum loading time
      setTimeout(() => {
        if (isMounted) {
          setLoading(false);
        }
      }, 1200);
    }
    
    // Clean up the timer on component unmount
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [feedItem]);
  
  return (
    <>
      <Modal onClose={onClose}>
        <motion.div
          layout
          layoutId={`feed-${feedItem.id}`}
          className="relative bg-white dark:bg-gray-800 overflow-hidden w-full max-h-[95vh] mx-auto max-w-[950px]"
          transition={{ duration: .25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Scrollbars
            autoHide
            autoHideTimeout={1000}
            autoHideDuration={200}
            renderThumbVertical={renderThumbVertical}
            renderTrackVertical={renderTrackVertical}
            universal={true}
            style={{ height: '95vh', width: '100%' }}
          >
            <div className="flex flex-col">
              {/* Modal Header */}
              <FeedModalHeader 
                feedItem={feedItem}
                onClose={onClose}
                showThumbnail={true}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
                onShare={handleShare}
              />
              
              {/* Modal Content */}
              <div className="px-8">
                <FeedModalContent 
                  feedItem={feedItem}
                  content={articleContent}
                  isLoading={loading}
                />
              </div>
              
              {/* Modal Controls */}
              <FeedModalControls 
                originalUrl={feedItem.link}
                onToggleReadLater={handleToggleReadLater}
                isReadLater={isReadLater}
                onToggleReaderMode={handleToggleReaderMode}
                isReaderMode={isReaderMode}
              />
            </div>
          </Scrollbars>
        </motion.div>
      </Modal>

      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[1] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: .95 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .125 }}
          onClick={onClose}
        />
      </AnimatePresence>
    </>
  );
};

/**
 * Cleans up modal content by removing duplicate images, excluding the thumbnail,
 * and selecting the highest quality variant when the same image is available with different crop queries.
 * 
 * @param htmlContent The HTML content to clean
 * @param thumbnailUrl The URL of the thumbnail image to exclude from content
 * @returns Cleaned HTML content without duplicates or the thumbnail
 */
function cleanupModalContent(htmlContent: string, thumbnailUrl?: string): string {
  if (!htmlContent) return htmlContent;
  
  try {
    // Parse the HTML string into a document
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Get all images as an array
    const images = Array.from(doc.querySelectorAll('img'));
    
    // Create a set of thumbnail URL variations for removal
    const seenImageUrls = new Set<string>();
    if (thumbnailUrl) {
      seenImageUrls.add(thumbnailUrl);
      if (thumbnailUrl.startsWith('https://')) {
        seenImageUrls.add(thumbnailUrl.replace('https://', 'http://'));
      } else if (thumbnailUrl.startsWith('http://')) {
        seenImageUrls.add(thumbnailUrl.replace('http://', 'https://'));
      }
      seenImageUrls.add(thumbnailUrl.replace(/^https?:\/\//, '//'));
      seenImageUrls.add(thumbnailUrl.replace(/^https?:\/\//, ''));
    }
    
    // Map to track the best (highest quality) image per base URL
    const imageMap = new Map<string, { element: HTMLImageElement, quality: { w: number, cropWidth: number } }>();
    
    // Iterate over all images
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (!src) {
        // Remove images with no source
        img.parentElement?.removeChild(img);
        return;
      }
      
      // Check against thumbnail variations
      if (thumbnailUrl) {
        const normalizedSrc = src.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const normalizedThumbnail = thumbnailUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (normalizedSrc.includes(normalizedThumbnail) || normalizedThumbnail.includes(normalizedSrc)) {
          img.parentElement?.removeChild(img);
          return;
        }
      }
      
      // Determine the base URL (everything before the '?')
      const baseUrl = src.split('?')[0];
      const currentQuality = getQualityMetric(src);
      
      if (imageMap.has(baseUrl)) {
        // Compare with the image already stored for this base URL
        const existing = imageMap.get(baseUrl)!;
        if (isHigherQuality(currentQuality, existing.quality)) {
          // Current image is better quality; remove the previous one
          existing.element.parentElement?.removeChild(existing.element);
          imageMap.set(baseUrl, { element: img, quality: currentQuality });
        } else {
          // Existing image is higher quality; remove the current one
          img.parentElement?.removeChild(img);
        }
      } else {
        // No image for this base URL yet; add this one
        imageMap.set(baseUrl, { element: img, quality: currentQuality });
      }
    });
    
    // Return the cleaned HTML
    return doc.body.innerHTML;
  } catch (error) {
    console.error('Error cleaning up modal content:', error);
    return htmlContent; // Return original content on error
  }
}

/**
 * Helper: compute quality metric from URL query parameters
 */
function getQualityMetric(url: string): { w: number, cropWidth: number } {
  let w = 0;
  let cropWidth = 0;
  
  try {
    const urlObj = new URL(url, document.baseURI);
    const wParam = urlObj.searchParams.get('w');
    if (wParam) {
      w = parseInt(wParam, 10) || 0;
    }
    
    const cropParam = urlObj.searchParams.get('crop');
    if (cropParam) {
      // Split by commas or whitespace
      const parts = cropParam.split(/[\s,]+/);
      if (parts.length >= 3) {
        cropWidth = parseFloat(parts[2]) || 0;
      }
    }
  } catch (err) {
    // If the URL cannot be parsed, quality defaults remain
  }
  
  return { w, cropWidth };
}

/**
 * Helper: compare two quality metrics. Returns true if q1 is higher than q2
 */
function isHigherQuality(q1: { w: number, cropWidth: number }, q2: { w: number, cropWidth: number }): boolean {
  if (q1.w !== q2.w) {
    return q1.w > q2.w;
  }
  return q1.cropWidth > q2.cropWidth;
}

export default FeedModal;