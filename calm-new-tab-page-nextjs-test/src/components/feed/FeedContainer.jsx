// components/feed/FeedContainer.jsx
import { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import FeedCard from './FeedCard';
import ReaderView from './ReaderView';
import { SlSpinner } from '@shoelace-style/shoelace/react';
import styles from '@/styles/FeedContainer.module.css';

export default function FeedContainer({ feeds = [], loading = false, lastRefreshed }) {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);
  
  // Configure masonry responsive breakpoints
  const breakpointColumns = {
    default: 4,
    1200: 3,
    800: 2,
    500: 1
  };
  
  // Handle card click to open reader view
  const handleCardClick = (item) => {
    setSelectedArticle(item);
    setReaderOpen(true);
  };
  
  // Format last refreshed time
  const formatRefreshTime = (timestamp) => {
    if (!timestamp) return 'Never refreshed';
    return `Last refreshed: ${new Date(timestamp).toLocaleTimeString()}`;
  };
  
  return (
    <>
      <div className={styles.feedContainer} style={{ opacity: loading ? 0.7 : 1 }}>
        {lastRefreshed && (
          <div className={styles.refreshTimestamp}>
            {formatRefreshTime(lastRefreshed)}
          </div>
        )}
        
        {loading && (
          <div className={styles.loadingOverlay}>
            <SlSpinner style={{ fontSize: '3rem' }} />
          </div>
        )}
        
        {feeds.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            <h2>No feeds to display</h2>
            <p>Subscribe to RSS feeds in settings to see content here.</p>
          </div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumns}
            className={styles.masonryGrid}
            columnClassName={styles.masonryColumn}
          >
            {feeds.map(item => (
              <FeedCard 
                key={item.id || `${item.feedUrl}-${item.title}`} 
                item={item} 
                onCardClick={handleCardClick}
              />
            ))}
          </Masonry>
        )}
      </div>
      
      {/* Reader View Modal */}
      <ReaderView
        article={selectedArticle}
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
      />
    </>
  );
}