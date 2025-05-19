// src/components/ui/IconButton.tsx
import { FC, ButtonHTMLAttributes } from 'react';
import { BaseProps } from './types';

/**
 * Props for the IconButton component
 */
export interface IconButtonProps extends BaseProps, ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon content (usually SVG) */
  icon: React.ReactNode;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button shape */
  shape?: 'circle' | 'square';
  /** Whether the button should have a tooltip */
  tooltip?: string;
  /** Whether the button is active */
  active?: boolean;
}

/**
 * Button component with icon
 */
const IconButton: FC<IconButtonProps> = ({
  icon,
  variant = 'primary',
  size = 'md',
  shape = 'circle',
  tooltip,
  active = false,
  className = '',
  ...rest
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200',
    outline: 'bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };
  
  // Shape classes
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-md'
  };
  
  // Active classes
  const activeClasses = active
    ? 'ring-2 ring-blue-400 dark:ring-blue-500 ring-opacity-50'
    : '';
  
  return (
    <button
      type="button"
      className={`
        flex items-center justify-center 
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${shapeClasses[shape]}
        ${activeClasses}
        ${className}
      `}
      title={tooltip}
      aria-label={tooltip}
      {...rest}
    >
      {icon}
    </button>
  );
};

export default IconButton;