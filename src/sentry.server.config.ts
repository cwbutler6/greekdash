import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Server-side performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enhanced server error context
  beforeSend(event) {
    // Add server-specific context
    if (event.request) {
      // Extract chapter slug from URL if available
      const url = event.request.url;
      if (url) {
        const chapterMatch = url.match(/\/([^/]+)\/(admin|dashboard|events)/);;
        if (chapterMatch) {
          event.tags = {
            ...event.tags,
            chapterSlug: chapterMatch[1],
          };
        }
      }
    }
    
    return event;
  },
  
  // Server-side integrations
  integrations: [
    Sentry.prismaIntegration(),
  ],
});