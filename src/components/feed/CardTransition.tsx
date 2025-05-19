// src/components/feed/CardTransition.tsx
// This component is kept for backward compatibility but simplified to match our new approach
import { FC } from 'react';
import { motion } from 'motion/react';
import { FeedItem } from '../../types/api';
import FeedCard from './FeedCard';

export interface CardTransitionProps {
  /** Feed item data to display */
  feedItem: FeedItem;
  /** Index for staggered animation (no longer used) */
  index?: number;
  /** Callback when card is selected */
  onSelect: (item: FeedItem) => void;
  /** Minimum loading time in ms (no longer used) */
  minLoadingTime?: number;
  /** Skip the loading animation (no longer used) */
  immediate?: boolean;
  /** CSS class to apply to container */
  className?: string;
}

/**
 * A simplified component that renders FeedCard directly
 * This component is maintained for backward compatibility
 */
const CardTransition: FC<CardTransitionProps> = ({
  feedItem,
  onSelect,
  className = '',
}) => {
  // Safety check: ensure we have valid feed item data
  if (!feedItem || !feedItem.id) {
    return null;
  }
  
  // Simply render the FeedCard directly with minimal animation
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <FeedCard
        data={feedItem}
        onSelect={onSelect}
      />
    </motion.div>
  );
};

export default CardTransition;