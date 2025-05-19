// src/components/modal/Modal.tsx
import React, { ReactNode, useEffect, useCallback, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ModalProps {
  /** Function to call when modal should close */
  onClose: () => void;
  /** Content to render inside the modal */
  children: ReactNode;
  /** CSS class name for the container */
  className?: string;
  /** Whether to show a close button */
  showCloseButton?: boolean;
  /** Whether to close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
  /** Initial focus element ref */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * Modal component that handles positioning, animations, and accessibility
 */
const Modal: FC<ModalProps> = ({
  onClose,
  children,
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
}) => {
  // Handle escape key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Setup event listeners and focus management
  useEffect(() => {
    // Disable body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    // Add escape key listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Set focus to initial element if provided
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }
    
    // Clean up on unmount
    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, initialFocusRef]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <AnimatePresence>
        <motion.div
          className={`pointer-events-auto relative z-10 w-[95%] max-w-[85vw] max-h-[95vh] mx-auto overflow-hidden ${className}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="overflow-auto max-h-[95vh] rounded-[40px] relative bg-white dark:bg-gray-800 shadow-xl">
            {children}
          </div>
          
          {showCloseButton && (
            <button
              className="absolute top-4 right-4 z-20 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={onClose}
              title="Close"
              aria-label="Close modal"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Modal;