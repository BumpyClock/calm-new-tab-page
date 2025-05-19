// src/components/modal/FeedModalControls.tsx
import { FC } from 'react';
import { BaseProps } from '../ui/types';
import { IconButton } from '../ui';

/**
 * Props for the FeedModalControls component
 */
export interface FeedModalControlsProps extends BaseProps {
  /** URL of the original article/content */
  originalUrl: string;
  /** Function to toggle read later status */
  onToggleReadLater?: () => void;
  /** Whether the item is marked for reading later */
  isReadLater?: boolean;
  /** Function to toggle reader mode */
  onToggleReaderMode?: () => void;
  /** Whether reader mode is active */
  isReaderMode?: boolean;
  /** Function to open settings */
  onOpenSettings?: () => void;
}

/**
 * Controls component for the feed modal footer
 */
const FeedModalControls: FC<FeedModalControlsProps> = ({
  originalUrl,
  onToggleReadLater,
  isReadLater = false,
  onToggleReaderMode,
  isReaderMode = true,
  onOpenSettings,
  className = '',
  ...rest
}) => {
  return (
    <div 
      className={`flex justify-between items-center p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 ${className}`}
      {...rest}
    >
      {/* Left side controls */}
      <div className="flex items-center space-x-2">
        {/* Visit original button */}
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
          Visit Original
        </a>
        
        {/* Read later button */}
        {onToggleReadLater && (
          <IconButton
            icon={
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                />
              </svg>
            }
            variant="outline"
            size="md"
            tooltip={isReadLater ? "Remove from reading list" : "Save for later"}
            onClick={onToggleReadLater}
            active={isReadLater}
          />
        )}
      </div>
      
      {/* Right side controls */}
      <div className="flex items-center space-x-2">
        {/* Reader mode toggle */}
        {onToggleReaderMode && (
          <IconButton
            icon={
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                />
              </svg>
            }
            variant="outline"
            size="md"
            tooltip={isReaderMode ? "View original content" : "Switch to reader view"}
            onClick={onToggleReaderMode}
            active={isReaderMode}
          />
        )}
        
        {/* Settings button */}
        {onOpenSettings && (
          <IconButton
            icon={
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            }
            variant="outline"
            size="md"
            tooltip="Reader Settings"
            onClick={onOpenSettings}
          />
        )}
      </div>
    </div>
  );
};

export default FeedModalControls;