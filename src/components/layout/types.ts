// src/components/layout/types.ts
import { BaseProps } from '../ui/types';

/**
 * Props for the main app layout component
 */
export interface AppLayoutProps extends BaseProps {
  /** Layout children */
  children: React.ReactNode;
  /** Header content */
  header?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Whether to show the background */
  showBackground?: boolean;
}

/**
 * Props for the header component
 */
export interface HeaderProps extends BaseProps {
  /** Header title */
  title?: React.ReactNode;
  /** Right-side actions */
  actions?: React.ReactNode;
  /** Whether the header is sticky */
  sticky?: boolean;
}

/**
 * Props for the footer component
 */
export interface FooterProps extends BaseProps {
  /** Footer content */
  children?: React.ReactNode;
  /** Whether to show credits */
  showCredits?: boolean;
}

/**
 * Props for container components
 */
export interface ContainerProps extends BaseProps {
  /** Container children */
  children: React.ReactNode;
  /** Whether to add padding */
  padded?: boolean;
  /** Container max width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | string;
  /** Whether to center the container */
  centered?: boolean;
}

/**
 * Props for grid layout components
 */
export interface GridProps extends BaseProps {
  /** Grid children */
  children: React.ReactNode;
  /** Grid columns count */
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  /** Grid gap */
  gap?: number | string;
}

/**
 * Props for sidebar layout components
 */
export interface SidebarLayoutProps extends BaseProps {
  /** Main content */
  children: React.ReactNode;
  /** Sidebar content */
  sidebar: React.ReactNode;
  /** Sidebar position */
  sidebarPosition?: 'left' | 'right';
  /** Whether the sidebar is collapsible */
  collapsible?: boolean;
  /** Whether the sidebar is collapsed by default */
  defaultCollapsed?: boolean;
  /** Sidebar width */
  sidebarWidth?: number | string;
}

/**
 * Props for tab layout components
 */
export interface TabsProps extends BaseProps {
  /** List of tabs */
  tabs: Array<{
    id: string;
    label: React.ReactNode;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
  /** Currently active tab ID */
  activeTab?: string;
  /** Function to call when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Tab style variant */
  variant?: 'underline' | 'pills' | 'enclosed' | 'soft-rounded';
  /** Tab size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for section components
 */
export interface SectionProps extends BaseProps {
  /** Section title */
  title?: React.ReactNode;
  /** Section description */
  description?: React.ReactNode;
  /** Section content */
  children: React.ReactNode;
  /** Whether the section is collapsible */
  collapsible?: boolean;
  /** Whether the section is collapsed by default */
  defaultCollapsed?: boolean;
  /** Whether to add padding */
  padded?: boolean;
}