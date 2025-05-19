# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Build: `npm run build` - Builds the Vite application and Chrome extension
- Dev: `npm run dev` - Starts Vite dev server for local development
- Preview: `npm run preview` - Preview the built application locally
- Watch: `npm run watch` - Uses nodemon to rebuild on file changes

## Lint/Test Commands
- Lint: `npm run lint` - Runs ESLint with TypeScript rules
- TypeCheck: `tsc --noEmit` - Validates TypeScript types without emitting files

## Code Style Guidelines
- Use TypeScript with strict mode enabled and explicit return types
- React components: Use functional components with explicit interface definitions
- Imports order: React, third-party libraries, components, utilities, styles
- Naming: PascalCase for components/interfaces, camelCase for functions/variables/props
- Error handling: Use optional chaining, null checks, and provide fallback values
- Type definitions: Store shared interfaces in dedicated `/types` directory
- Styling: Use TailwindCSS utilities with proper dark mode support
- Performance: Use useMemo/useCallback for expensive operations, avoid re-renders

## Project Structure
- Chrome extension built with React and Vite targeting Manifest V3
- Main interface in `src/App.tsx`, settings page in `src/settings.tsx`
- Background service worker in `public/background.js` for extension functionality
- Components organized in feature-based folders under `/src/components`
- Context providers in `/src/context` including `FeedContext`, `ThemeContext`, and `SettingsContext`
- Shared utilities and hooks in `/src/utils`
- Type definitions in `/src/types`

## Key Features
- RSS feed reader with feed discovery functionality
- Theme system with light/dark mode support
- Chrome extension specific functionality (background service worker, storage API)
- Bing daily background image integration
- Reader view for articles

## Data Flow
- The app uses Chrome's storage API for persistent data (local and sync)
- RSS feeds are fetched and processed in the background service worker
- React context providers manage state and communicate with the background service
- UI components consume context data and trigger actions

## Extension Architecture
- Extension entry points: `index.html` (new tab page) and `settings.html` (settings page)
- Background service worker (`background.js`) handles API requests and caching
- Content is loaded from RSS feeds and displayed in a customizable interface
- Communication between UI and background uses Chrome's messaging system