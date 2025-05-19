// src/components/FeedModal.tsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Modal from './Modal';
import { FeedItem } from '../types/api';
import { Readability } from '@mozilla/readability';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface FeedModalProps {
  feedItem: FeedItem;
  onClose: () => void;
}

/**
 * Cleans up modal content by removing duplicate images, excluding the thumbnail,
 * and selecting the highest quality variant when the same image is available with different crop queries.
 * 
 * The quality metric is determined by:
 *   1. The "w" query parameter (parsed as an integer).
 *   2. If "w" values are equal, the third value of the "crop" parameter (parsed as a float).
 * 
 * @param htmlContent The HTML content to clean.
 * @param thumbnailUrl The URL of the thumbnail image to exclude from content.
 * @returns Cleaned HTML content without duplicates or the thumbnail.
 */
const cleanupModalContent = (htmlContent: string, thumbnailUrl?: string): string => {
  if (!htmlContent) return htmlContent;
  
  // Parse the HTML string into a document.
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Get all images as an array.
  const images = Array.from(doc.querySelectorAll('img'));
  
  // Create a set of thumbnail URL variations for removal.
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
    const withoutTrailingSlash = thumbnailUrl.replace(/\/$/, '');
    const withTrailingSlash = thumbnailUrl.endsWith('/') ? thumbnailUrl : `${thumbnailUrl}/`;
    seenImageUrls.add(withoutTrailingSlash);
    seenImageUrls.add(withTrailingSlash);
    const baseUrl = thumbnailUrl.split('?')[0];
    seenImageUrls.add(baseUrl);
  }
  
  // Map to track the best (highest quality) image per base URL.
  const imageMap = new Map<string, { element: HTMLImageElement, quality: { w: number, cropWidth: number } }>();

  // Helper: compute quality metric from URL query parameters.
  const getQualityMetric = (url: string): { w: number, cropWidth: number } => {
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
        // Split by commas or whitespace.
        const parts = cropParam.split(/[\s,]+/);
        if (parts.length >= 3) {
          cropWidth = parseFloat(parts[2]) || 0;
        }
      }
    } catch (err) {
      // If the URL cannot be parsed, quality defaults remain.
    }
    return { w, cropWidth };
  };

  // Helper: compare two quality metrics. Returns true if q1 is higher than q2.
  const isHigherQuality = (q1: { w: number, cropWidth: number }, q2: { w: number, cropWidth: number }) => {
    if (q1.w !== q2.w) {
      return q1.w > q2.w;
    }
    return q1.cropWidth > q2.cropWidth;
  };

  // Iterate over all images.
  images.forEach((img) => {
    const src = img.getAttribute('src');
    if (!src) {
      // Remove images with no source.
      img.parentElement?.removeChild(img);
      return;
    }
    
    // Check against thumbnail variations.
    if (thumbnailUrl) {
      const normalizedSrc = src.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const normalizedThumbnail = thumbnailUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (normalizedSrc.includes(normalizedThumbnail) || normalizedThumbnail.includes(normalizedSrc)) {
        img.parentElement?.removeChild(img);
        return;
      }
    }
    
    // Determine the base URL (everything before the '?').
    const baseUrl = src.split('?')[0];
    const currentQuality = getQualityMetric(src);
    
    if (imageMap.has(baseUrl)) {
      // Compare with the image already stored for this base URL.
      const existing = imageMap.get(baseUrl)!;
      if (isHigherQuality(currentQuality, existing.quality)) {
        // Current image is better quality; remove the previous one.
        existing.element.parentElement?.removeChild(existing.element);
        imageMap.set(baseUrl, { element: img, quality: currentQuality });
      } else {
        // Existing image is higher quality; remove the current one.
        img.parentElement?.removeChild(img);
      }
    } else {
      // No image for this base URL yet; add this one.
      imageMap.set(baseUrl, { element: img, quality: currentQuality });
    }
    
    // Optionally, add the src to the seen set (if you need additional duplicate checks).
    seenImageUrls.add(src);
  });
  
  // Return the cleaned HTML.
  return doc.body.innerHTML;
};


const renderThumbVertical = ({ style, ...props }: { style: React.CSSProperties; [key: string]: any }) => {
  const thumbStyle = {
    backgroundColor: 'rgba(155, 155, 155, 0.5)',
    borderRadius: '4px',
    width: '6px',
  };
  return <div style={{ ...style, ...thumbStyle }} {...props} />;
};

const renderTrackVertical = ({ style, ...props }: { style: React.CSSProperties; [key: string]: any }) => {
  const trackStyle = {
    right: '2px',
    bottom: '2px',
    top: '2px',
    borderRadius: '3px',
    width: '6px',
  };
  return <div style={{ ...style, ...trackStyle }} {...props} />;
};

const FeedModal: React.FC<FeedModalProps> = ({ feedItem, onClose }) => {
  const [articleContent, setArticleContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  // const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Track both content loading and minimum timeout
    let contentLoaded = false;
    let timerElapsed = false;
    
    // Set loading to true immediately when the effect runs
    setLoading(true);
    
    // If type=article, fetch & parse content via Readability
    const fetchArticle = async () => {
      try {
        const response = await fetch(feedItem.link);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const article = new Readability(doc).parse();
        const cleaned = cleanupModalContent(article?.content || '', feedItem.thumbnail);
        setArticleContent(cleaned);
      } catch (err) {
        console.error('Error fetching article:', err);
        setArticleContent('Error fetching content.');
      }
      
      // Mark content as loaded
      contentLoaded = true;
      
      // Only stop loading if minimum time has elapsed
      if (timerElapsed) {
        setLoading(false);
      }
    };

    // Set a timer for minimum loading time (1.2 seconds)
    const timer = setTimeout(() => {
      timerElapsed = true;
      
      // Only stop loading if content has loaded
      if (contentLoaded) {
        setLoading(false);
      }
    }, 1200);

    if (feedItem.type === 'article') {
      fetchArticle();
    } else {
      // For non-article types, still respect the minimum loading time
      setTimeout(() => setLoading(false), 1200);
    }
    
    // Clean up the timer on component unmount
    return () => clearTimeout(timer);
  }, [feedItem]);


  // Once the layout (shared element) animation completes, show the overlay
  const handleLayoutAnimationComplete = () => {
    // setShowOverlay(true);
  
  };

  let modalBody;
  if (feedItem.type === 'article') {
    modalBody = loading ? (
      <div className="w-full animate-pulse">
        {/* Skeleton loading UI */}
        <div className="space-y-6">
          {/* Skeleton paragraph */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10/12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-9/12"></div>
          </div>
          
          {/* Skeleton paragraph */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8/12"></div>
          </div>
          
          {/* Skeleton image */}
          <div className="h-52 bg-gray-200 dark:bg-gray-700 rounded"></div>
          
          {/* Skeleton heading */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-7/12 my-4"></div>
          
          {/* Skeleton paragraph */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10/12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-9/12"></div>
          </div>
          
          {/* Skeleton paragraph */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10/12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8/12"></div>
          </div>
        </div>
      </div>
    ) : (
      <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: articleContent }} />
    );
   } else if (feedItem.type === 'podcast') {
    modalBody = <div>Podcast player here...</div>;
  } else if (feedItem.type === 'video') {
    modalBody = <div>Video player here...</div>;
  } else {
    modalBody = <div>Unsupported type.</div>;
  }

  return (
    <>
      <Modal onClose={onClose}>
        <motion.div
          layout
          layoutId={`feed-${feedItem.id}`}
          className="relative bg-white dark:bg-gray-800 overflow-hidden w-full max-h-[95vh] mx-auto max-w-[950px]"
          onLayoutAnimationComplete={handleLayoutAnimationComplete}
          transition={{ duration: .25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Use Scrollbars with a fixed height instead of autoHeight */}
          <Scrollbars
            autoHide
            autoHideTimeout={1000}
            autoHideDuration={200}
            renderThumbVertical={renderThumbVertical}
            renderTrackVertical={renderTrackVertical}
            universal={true}
            style={{ height: '95vh', width: '100%' }}  // Fixed height instead of autoHeight
          >
            <div className="p-8">
              {feedItem.thumbnail && (
                <motion.img
                  layout
                  layoutId={`feed-image-${feedItem.id}`}
                  src={feedItem.thumbnail}
                  alt={feedItem.title}
                  className="w-full max-h-[550px] object-cover rounded-[32px] mb-4"
                  transition={{ duration: .25 }}
                />
              )}

              <motion.h1
                layoutId={`feed-title-${feedItem.id}`}
                className="text-2xl font-bold mb-4 text-left p-4"
                initial={{ fontSize: '1.5rem' }}
                animate={{ fontSize: '2rem' }}
                transition={{ duration: .25 }}
              >
                {feedItem.title}
              </motion.h1>

              {feedItem.author && (
                <motion.p
                  layoutId={`feed-author-${feedItem.id}`}
                  className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-left"
                  transition={{ duration: .25 }}
                >
                  By {feedItem.author}
                </motion.p>
              )}

              <AnimatePresence>
                <motion.div 
                  layout
                  layoutId={`feed-content-${feedItem.id}`}
                  key={`feed-content-${feedItem.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-left text-gray-600 dark:text-gray-300 reader-view-article"
                >
                  {modalBody}
                </motion.div>
              </AnimatePresence>
            </div>
          </Scrollbars>
        </motion.div>
      </Modal>

      {/* AnimatePresence for overlay remains the same */}
      <AnimatePresence>
        {
          <motion.div
            className="fixed inset-0 z-[1] bg-black "
            initial={{ opacity: 0 }}
            animate={{ opacity: .95,  }}
            exit={{ opacity: 0 }}
            transition={{ duration: .125 }}
            onClick={onClose}
          />
        }
      </AnimatePresence>
    </>
  );
};

export default FeedModal;