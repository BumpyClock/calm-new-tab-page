// src/components/index.ts
// Export components by category
export * from './background';
export * from './feed';
// export * from './modal'; // Comment this out to fix casing issue
export * from './reader';
// export * from './settings'; // Comment to avoid FeedList name conflict
export * from './ui';
export * from './discovery';

// Re-export modal components separately to avoid casing issues
export { default as Modal } from './Modal';

// Explicitly re-export settings components to avoid conflicts
export { SettingsPage } from './settings';

// Explicitly re-export modal components
export { default as FeedModal } from './modal/FeedModal';