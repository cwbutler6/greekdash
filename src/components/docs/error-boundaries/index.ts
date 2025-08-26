// Documentation-specific error boundaries
export { DocsErrorBoundary } from './docs-error-boundary';
export { SearchErrorBoundary } from './search-error-boundary';
export { VideoErrorBoundary } from './video-error-boundary';
export { NavigationErrorBoundary } from './navigation-error-boundary';

// Fallback components
export { MissingContentFallback } from '../fallbacks/missing-content-fallback';
export { SearchFailureFallback } from '../fallbacks/search-failure-fallback';

// Re-export base error boundary for convenience
export { ErrorBoundary } from '@/components/error-boundaries/ErrorBoundary';