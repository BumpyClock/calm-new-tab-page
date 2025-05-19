// src/components/ui/BlurImage.tsx
import { FC, useState } from 'react';
import { motion } from 'motion/react';

export interface BlurImageProps {
  /** Source URL for the image */
  src: string;
  /** Alternative text for the image */
  alt: string;
  /** Whether to use the layout animation */
  layout?: boolean;
  /** Layout ID for shared element transitions */
  layoutId?: string;
  /** CSS class for the container */
  className?: string;
  /** Function called when image errors */
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Image component with blur-up loading effect
 */
const BlurImage: FC<BlurImageProps> = ({
  src,
  alt,
  layout = false,
  layoutId,
  className = '',
  onError
}) => {
  // Single useState with object to avoid hook count issues
  const [state, setState] = useState({
    loaded: false,
    error: false
  });
  
  // Handle image load
  const handleLoad = () => {
    setState(prev => ({ ...prev, loaded: true }));
  };
  
  // Handle image error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setState(prev => ({ ...prev, error: true }));
    if (onError) onError(e);
  };
  
  return (
    <motion.div 
      className={`relative w-full h-full overflow-hidden ${className}`}
      layoutId={layout && layoutId ? layoutId : undefined}
    >
      {/* Placeholder/skeleton */}
      <div 
        className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" 
        style={{ 
          opacity: state.loaded ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />
      
      {/* Actual image */}
      {!state.error && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          fetchPriority="auto"
          className="relative w-full h-full object-cover z-10"
          style={{ 
            opacity: state.loaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </motion.div>
  );
};

export default BlurImage;