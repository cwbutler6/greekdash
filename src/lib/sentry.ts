import * as Sentry from '@sentry/nextjs';

interface ChapterContext {
  chapterSlug?: string;
  chapterName?: string;
  subscriptionTier?: string;
}

interface UserContext {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session replay for debugging
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Enhanced error context
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Filter out network errors that aren't actionable
          if (error.message.includes('NetworkError') || 
              error.message.includes('fetch')) {
            return null;
          }
        }
      }
      
      return event;
    },
    
    // Custom integrations
    integrations: [
      Sentry.replayIntegration(),
      Sentry.browserTracingIntegration(),
    ],
  });
}

// Set user context with chapter information
export function setSentryUser(user: UserContext, chapter?: ChapterContext) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
  
  // Set chapter context as tags for filtering
  Sentry.setTags({
    chapterSlug: chapter?.chapterSlug,
    chapterName: chapter?.chapterName,
    subscriptionTier: chapter?.subscriptionTier,
    userRole: user.role,
  });
  
  // Set chapter context for detailed debugging
  Sentry.setContext('chapter', {
    slug: chapter?.chapterSlug,
    name: chapter?.chapterName,
    tier: chapter?.subscriptionTier,
  });
}

// Clear user context on logout
export function clearSentryUser() {
  Sentry.setUser(null);
  Sentry.setTags({});
  Sentry.setContext('chapter', null);
}

// Capture errors with chapter context
export function captureErrorWithContext(
  error: Error,
  context: {
    chapterSlug?: string;
    operation?: string;
    userId?: string;
    additionalData?: Record<string, string | number | boolean | null>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag('chapterSlug', context.chapterSlug);
    scope.setTag('operation', context.operation);
    scope.setContext('operation_context', {
      chapterSlug: context.chapterSlug,
      operation: context.operation,
      userId: context.userId,
      ...context.additionalData,
    });
    
    Sentry.captureException(error);
  });
}

// Capture performance metrics
export function capturePerformanceMetric(
  name: string,
  value: number,
  context?: {
    chapterSlug?: string;
    operation?: string;
  }
) {
  Sentry.addBreadcrumb({
    message: `Performance: ${name}`,
    level: 'info',
    data: {
      metric: name,
      value,
      chapterSlug: context?.chapterSlug,
      operation: context?.operation,
    },
  });
}

// Capture business logic events
export function captureBusinessEvent(
  event: string,
  data: {
    chapterSlug?: string;
    userId?: string;
    [key: string]: string | number | boolean | undefined;
  }
) {
  Sentry.addBreadcrumb({
    message: `Business Event: ${event}`,
    level: 'info',
    category: 'business',
    data,
  });
}