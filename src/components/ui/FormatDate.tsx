// src/components/ui/FormatDate.tsx
import { FC } from 'react';
import { BaseProps } from './types';
import { formatDate, formatRelativeTime } from '../../utils';

/**
 * Props for the FormatDate component
 */
export interface FormatDateProps extends BaseProps {
  /** The date string to format */
  date: string | undefined;
  /** Format style */
  format?: 'relative' | 'full' | 'date' | 'time';
  /** Whether to show both full date and relative time */
  showBoth?: boolean;
  /** CSS classes for text */
  textClassName?: string;
}

/**
 * Component for consistently formatting dates
 */
const FormatDate: FC<FormatDateProps> = ({
  date,
  format = 'relative',
  showBoth = false,
  className = '',
  textClassName = 'text-xs text-gray-500 dark:text-gray-400',
  ...rest
}) => {
  if (!date) {
    return null;
  }
  
  // Full date formatting
  const fullDate = formatDate(date);
  
  // Relative time formatting (e.g., "2 hours ago")
  const relativeTime = formatRelativeTime(date);
  
  // Decide what to display based on format and showBoth
  let displayText: string;
  let title: string;
  
  if (showBoth) {
    displayText = relativeTime;
    title = fullDate;
  } else {
    switch (format) {
      case 'relative':
        displayText = relativeTime;
        title = fullDate;
        break;
      case 'full':
        displayText = fullDate;
        title = relativeTime;
        break;
      case 'date':
        const dateOnly = new Date(date).toLocaleDateString();
        displayText = dateOnly;
        title = relativeTime;
        break;
      case 'time':
        const timeOnly = new Date(date).toLocaleTimeString();
        displayText = timeOnly;
        title = fullDate;
        break;
      default:
        displayText = fullDate;
        title = relativeTime;
    }
  }
  
  return (
    <time 
      dateTime={new Date(date).toISOString()}
      className={`${textClassName} ${className}`}
      title={title}
      {...rest}
    >
      {displayText}
    </time>
  );
};

export default FormatDate;