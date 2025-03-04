"use client";

import { useState, useEffect } from 'react';

export function useWindowSize(): [number, number] {
  // Initialize with reasonable defaults in case window is undefined (SSR)
  const [size, setSize] = useState<[number, number]>([1200, 800]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Handler to call on window resize
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }

    // Set size at initial load
    updateSize();

    // Add event listener
    window.addEventListener('resize', updateSize);

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', updateSize);
  }, []); // Empty array ensures this only runs on mount and unmount

  return size;
}