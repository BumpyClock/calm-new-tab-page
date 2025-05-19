// src/components/Modal.tsx
import React, { ReactNode, useEffect } from 'react';
import { motion } from 'motion/react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

/**
 * A simple container that positions the modal content absolutely in the center.
 * We remove scrolling from the body while it's mounted, but we do NOT handle
 * the backdrop here (that’s done in FeedModal).
 */
const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  // Disable body scroll when modal is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/** The motion.div for the modal container */}
      <motion.div
        className="pointer-events-auto relative z-10 w-[95%] max-w-[85vw] max-h-[95vh] mx-auto overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.25 }}
      >
        <div className="overflow-auto max-h-[95vh] rounded-[40px] relative bg-white dark:bg-gray-800">
          {children}
        </div>
        {/** A close button if you want an explicit “X” in the corner */}
        <button
          className="absolute top-2 right-2 z-20 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={onClose}
          title="Close"
        >
          X
        </button>
      </motion.div>
    </div>
  );
};

export default Modal;
