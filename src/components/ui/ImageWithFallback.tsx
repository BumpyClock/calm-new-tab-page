// src/components/ui/ImageWithFallback.tsx
import { useState, useEffect, FC } from 'react';
import { ImageProps } from './types';

/**
 * Image component with fallback support for when images fail to load
 */
const ImageWithFallback: FC<ImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className = '',
  width,
  height,
  objectFit = 'cover',
  lazy = true,
  loading = 'lazy',
  onError,
  onLoad,
  ...rest
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  // Update src when the prop changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);
  
  // Handle image load error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
    if (!hasError && fallbackSrc) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
    
    if (onError) {
      onError(e);
    }
  };
  
  // Handle image load success
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
    setIsLoaded(true);
    
    if (onLoad) {
      onLoad(e);
    }
  };
  
  // Generate style object for the image
  const imgStyle: React.CSSProperties = {
    objectFit,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" 
          style={{ width, height }}
        />
      )}
      
      {/* Image */}
      <img
        src={imgSrc}
        alt={alt}
        loading={loading}
        style={imgStyle}
        onError={handleError}
        onLoad={handleLoad}
        {...rest}
      />
    </div>
  );
};

export default ImageWithFallback;