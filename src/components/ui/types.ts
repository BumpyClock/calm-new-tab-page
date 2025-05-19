// src/components/ui/types.ts

/**
 * Common props for all UI components
 */
export interface BaseProps {
  /** Additional CSS class name */
  className?: string;
  /** ID attribute */
  id?: string;
  /** ARIA label */
  'aria-label'?: string;
}

/**
 * Props for button components
 */
export interface ButtonProps extends BaseProps {
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button shows a loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button children/content */
  children: React.ReactNode;
}

/**
 * Props for input components
 */
export interface InputProps extends BaseProps {
  /** Input name */
  name: string;
  /** Input label */
  label?: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'search';
  /** Input placeholder */
  placeholder?: string;
  /** Input value */
  value?: string | number;
  /** Default value */
  defaultValue?: string | number;
  /** Whether the input is required */
  required?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is readonly */
  readOnly?: boolean;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * Props for checkbox components
 */
export interface CheckboxProps extends Omit<InputProps, 'type'> {
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
}

/**
 * Props for toggle/switch components
 */
export interface ToggleProps extends Omit<InputProps, 'type'> {
  /** Whether the toggle is checked/on */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Size of the toggle */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for select components
 */
export interface SelectProps extends Omit<InputProps, 'type'> {
  /** Select options */
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  /** Whether multiple options can be selected */
  multiple?: boolean;
  /** Size of the select list when multiple=true */
  size?: number;
}

/**
 * Props for card components
 */
export interface CardProps extends BaseProps {
  /** Card title */
  title?: React.ReactNode;
  /** Card content */
  children: React.ReactNode;
  /** Card footer */
  footer?: React.ReactNode;
  /** Whether the card has hover effects */
  hoverable?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Props for tooltip components
 */
export interface TooltipProps extends BaseProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactElement;
  /** Tooltip position */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /** Delay before showing tooltip (ms) */
  delay?: number;
}

/**
 * Props for badge components
 */
export interface BadgeProps extends BaseProps {
  /** Badge content */
  children: React.ReactNode;
  /** Badge variant */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for avatar components
 */
export interface AvatarProps extends BaseProps {
  /** Image source */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Fallback initials when no image is available */
  initials?: string;
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Avatar shape */
  shape?: 'circle' | 'square';
}

/**
 * Props for image components
 */
export interface ImageProps extends BaseProps {
  /** Image source */
  src: string;
  /** Alt text */
  alt: string;
  /** Fallback image source to use if the primary source fails to load */
  fallbackSrc?: string;
  /** Object fit property */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Width of the image (px or %) */
  width?: string | number;
  /** Height of the image (px or %) */
  height?: string | number;
  /** Whether to lazy load the image */
  lazy?: boolean;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Error handler */
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  /** Load handler */
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Props for icon components
 */
export interface IconProps extends BaseProps {
  /** Icon name or path */
  name: string;
  /** Icon size */
  size?: number | string;
  /** Icon color */
  color?: string;
  /** Whether the icon should spin */
  spin?: boolean;
}

/**
 * Props for spinner/loader components
 */
export interface SpinnerProps extends BaseProps {
  /** Spinner size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Spinner color */
  color?: string;
  /** Spinner type */
  type?: 'border' | 'grow' | 'dots';
  /** Optional label */
  label?: string;
}