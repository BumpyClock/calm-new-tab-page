// src/components/ui/SiteInfo.tsx
import { FC } from 'react';
import { BaseProps } from './types';
import ImageWithFallback from './ImageWithFallback';

/**
 * Props for the SiteInfo component
 */
export interface SiteInfoProps extends BaseProps {
  /** Site name */
  siteName: string;
  /** Site favicon URL */
  favicon?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to make the text bold */
  bold?: boolean;
  /** Maximum width for the site name (with text truncation) */
  maxWidth?: string | number;
}

/**
 * Component for displaying site information with favicon
 */
const SiteInfo: FC<SiteInfoProps> = ({
  siteName,
  favicon,
  size = 'md',
  bold = false,
  maxWidth = '200px',
  className = '',
  ...rest
}) => {
  // Size variants
  const sizeClasses = {
    sm: {
      container: 'text-xs',
      favicon: 16,
      gap: 'gap-1'
    },
    md: {
      container: 'text-sm',
      favicon: 20, 
      gap: 'gap-2'
    },
    lg: {
      container: 'text-base',
      favicon: 24,
      gap: 'gap-3'
    }
  };
  
  const { container, favicon: faviconSize, gap } = sizeClasses[size];
  
  // Generate styles for max width
  const maxWidthStyle = {
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth
  };
  
  return (
    <div 
      className={`flex items-center ${gap} ${container} ${className}`}
      {...rest}
    >
      {favicon && (
        <ImageWithFallback
          src={favicon}
          alt={`${siteName} favicon`}
          width={faviconSize}
          height={faviconSize}
          className="flex-shrink-0 rounded-sm"
          fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3C/svg%3E"
        />
      )}
      <span 
        className={`text-gray-600 dark:text-gray-300 truncate ${bold ? 'font-semibold' : 'font-normal'}`}
        style={maxWidthStyle}
        title={siteName}
      >
        {siteName}
      </span>
    </div>
  );
};

export default SiteInfo;