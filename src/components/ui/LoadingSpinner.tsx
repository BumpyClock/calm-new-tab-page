// src/components/ui/LoadingSpinner.tsx
import { FC } from 'react';
import { BaseProps } from './types';

/**
 * Props for the LoadingSpinner component
 */
export interface LoadingSpinnerProps extends BaseProps {
  /** Spinner size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Spinner color */
  color?: 'primary' | 'secondary' | 'white' | 'black' | 'gray';
  /** Optional label text */
  label?: string;
  /** Whether to center the spinner */
  centered?: boolean;
}

/**
 * Loading spinner component
 */
const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  label,
  centered = false,
  className = '',
  ...rest
}) => {
  // Size classes mapping
  const sizeMap = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  };
  
  // Color classes mapping
  const colorMap = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    black: 'border-black border-t-transparent',
    gray: 'border-gray-300 dark:border-gray-600 border-t-transparent'
  };
  
  const containerClasses = centered ? 'flex flex-col items-center justify-center' : '';
  
  return (
    <div className={`${containerClasses} ${className}`} {...rest}>
      <div
        className={`
          rounded-full
          animate-spin
          ${sizeMap[size]}
          ${colorMap[color]}
        `}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {label}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;