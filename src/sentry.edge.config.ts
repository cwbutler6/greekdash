import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Edge runtime has limited capabilities
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,
  
  beforeSend(event) {
    // Minimal processing for edge runtime
    return event;
  },
});