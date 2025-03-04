"use client";

import {  useRef } from 'react';
import { useWindowSize } from '@/lib/hooks/useWindowSize';
import { FeedItem } from '@/types';
import FeedCard from './FeedCard';
import { MasonryScroller, useContainerPosition, usePositioner, useResizeObserver } from 'masonic';

interface FeedContainerProps {
  feedItems: FeedItem[];
}

export default function FeedContainer({ feedItems }: FeedContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowWidth, windowHeight] = useWindowSize();
  const { offset, width } = useContainerPosition(containerRef, [windowWidth, windowHeight]);
  const positioner = usePositioner({
    width,
    columnWidth: 360, // Base width of cards
    columnGutter: 24, // Gap between cards
  });
  const resizeObserver = useResizeObserver(positioner);

  // Calculate number of columns based on container width
//   const columnCount = Math.max(1, Math.floor((width || 1200) / (360 + 24)));
  
  // Render individual FeedCard
  const renderItem = ({ index, data, width }: { index: number; data: FeedItem; width: number }) => (
    <div style={{ width, margin: '0 auto 24px auto' }}>
      <FeedCard item={data} />
    </div>
  );

  if (feedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No feeds to display. Please add some feeds in the settings.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      id="feed-container" 
      className="feedsContainer opacity-100 transition-opacity duration-500 mx-auto"
      style={{ maxWidth: '1600px' }}
    >
      <MasonryScroller
        positioner={positioner}
        resizeObserver={resizeObserver}
        containerRef={containerRef}
        items={feedItems}
        height={windowHeight}
        offset={offset}
        overscanBy={5} // Render extra items for smoother scrolling
        render={renderItem}
      />
    </div>
  );
}