'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackUrl?: string;
  onError?: (error: Error) => void;
  onRecovery?: () => void;
}

interface ErrorRecoveryState {
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
  hasRecovered: boolean;
}

export function useDocsErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    fallbackUrl = '/docs',
    onError,
    onRecovery
  } = options;

  const router = useRouter();
  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    retryCount: 0,
    isRetrying: false,
    hasRecovered: false
  });

  // Handle error occurrence
  const handleError = useCallback((error: Error, context?: string) => {
    setState(prev => ({
      ...prev,
      error,
      hasRecovered: false
    }));

    // Log to Sentry with context
    Sentry.withScope((scope) => {
      scope.setTag('errorRecovery', 'docs');
      if (context) {
        scope.setContext('errorContext', { context });
      }
      Sentry.captureException(error);
    });

    // Call custom error handler
    onError?.(error);
  }, [onError]);

  // Retry mechanism
  const retry = useCallback(async () => {
    if (state.retryCount >= maxRetries) {
      return false;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }));

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    try {
      // Clear error state to trigger re-render
      setState(prev => ({
        ...prev,
        error: null,
        isRetrying: false,
        hasRecovered: true
      }));

      onRecovery?.();
      return true;
    } catch (retryError) {
      setState(prev => ({
        ...prev,
        isRetrying: false,
        error: retryError as Error
      }));
      return false;
    }
  }, [state.retryCount, maxRetries, retryDelay, onRecovery]);

  // Navigate to fallback
  const navigateToFallback = useCallback(() => {
    router.push(fallbackUrl);
  }, [router, fallbackUrl]);

  // Reset error state
  const reset = useCallback(() => {
    setState({
      error: null,
      retryCount: 0,
      isRetrying: false,
      hasRecovered: false
    });
  }, []);

  // Auto-retry for certain error types
  useEffect(() => {
    if (state.error && !state.isRetrying && state.retryCount < maxRetries) {
      const shouldAutoRetry = 
        state.error.name === 'NetworkError' ||
        state.error.message.includes('fetch') ||
        state.error.message.includes('network');

      if (shouldAutoRetry) {
        const timeoutId = setTimeout(() => {
          retry();
        }, retryDelay);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [state.error, state.isRetrying, state.retryCount, maxRetries, retry, retryDelay]);

  return {
    error: state.error,
    retryCount: state.retryCount,
    isRetrying: state.isRetrying,
    hasRecovered: state.hasRecovered,
    canRetry: state.retryCount < maxRetries,
    handleError,
    retry,
    navigateToFallback,
    reset
  };
}

// Specialized hooks for different documentation contexts

export function useSearchErrorRecovery() {
  return useDocsErrorRecovery({
    maxRetries: 2,
    retryDelay: 500,
    fallbackUrl: '/docs/search',
    onError: (error) => {
      // Track search-specific errors
      Sentry.addBreadcrumb({
        category: 'search',
        message: 'Search error occurred',
        level: 'error',
        data: { error: error.message }
      });
    }
  });
}

export function useVideoErrorRecovery(videoId?: string) {
  return useDocsErrorRecovery({
    maxRetries: 1,
    retryDelay: 2000,
    fallbackUrl: '/docs',
    onError: (error) => {
      // Track video-specific errors
      Sentry.addBreadcrumb({
        category: 'video',
        message: 'Video error occurred',
        level: 'error',
        data: { 
          error: error.message,
          videoId 
        }
      });
    }
  });
}

export function useNavigationErrorRecovery() {
  return useDocsErrorRecovery({
    maxRetries: 2,
    retryDelay: 1000,
    fallbackUrl: '/docs',
    onError: (error) => {
      // Track navigation-specific errors
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: 'Navigation error occurred',
        level: 'error',
        data: { error: error.message }
      });
    }
  });
}

export function useContentErrorRecovery(pageSlug?: string) {
  return useDocsErrorRecovery({
    maxRetries: 1,
    retryDelay: 1500,
    fallbackUrl: '/docs',
    onError: (error) => {
      // Track content-specific errors
      Sentry.addBreadcrumb({
        category: 'content',
        message: 'Content error occurred',
        level: 'error',
        data: { 
          error: error.message,
          pageSlug 
        }
      });
    }
  });
}