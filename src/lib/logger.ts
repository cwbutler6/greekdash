import * as Sentry from '@sentry/nextjs';

export interface LogContext {
  chapterSlug?: string;
  userId?: string;
  action?: string;
  component?: string;
  metadata?: Record<string, unknown>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: Error, context?: LogContext) => void;
}

class ChapterLogger implements Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const chapterInfo = context?.chapterSlug ? `[${context.chapterSlug}]` : '[no-chapter]';
    const userInfo = context?.userId ? `[user:${context.userId}]` : '';
    const actionInfo = context?.action ? `[${context.action}]` : '';
    const componentInfo = context?.component ? `[${context.component}]` : '';
    
    return `${timestamp} ${level.toUpperCase()} ${chapterInfo}${userInfo}${actionInfo}${componentInfo} ${message}`;
  }

  private logToSentry(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    Sentry.withScope((scope) => {
      scope.setLevel(level === 'error' ? 'error' : level === 'warn' ? 'warning' : 'info');
      scope.setTag('logLevel', level);
      
      if (context?.chapterSlug) {
        scope.setTag('chapterSlug', context.chapterSlug);
        scope.setContext('chapter', { slug: context.chapterSlug });
      }
      
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      
      if (context?.component) {
        scope.setTag('component', context.component);
      }
      
      if (context?.metadata) {
        scope.setContext('metadata', context.metadata);
      }
      
      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message);
      }
    });
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('info', message, context);
    console.log(formattedMessage);
    
    // Log important info messages to Sentry in production
    if (process.env.NODE_ENV === 'production' && context?.action) {
      this.logToSentry('info', message, undefined, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('warn', message, context);
    console.warn(formattedMessage);
    this.logToSentry('warn', message, undefined, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const formattedMessage = this.formatMessage('error', message, context);
    console.error(formattedMessage, error);
    this.logToSentry('error', message, error, context);
  }
}

// Singleton logger instance
export const logger = new ChapterLogger();

// Utility functions for common logging patterns
export const createChapterLogger = (chapterSlug: string, userId?: string): Logger => ({
  debug: (message: string, context?: LogContext) => 
    logger.debug(message, { ...context, chapterSlug, userId }),
  info: (message: string, context?: LogContext) => 
    logger.info(message, { ...context, chapterSlug, userId }),
  warn: (message: string, context?: LogContext) => 
    logger.warn(message, { ...context, chapterSlug, userId }),
  error: (message: string, error?: Error, context?: LogContext) => 
    logger.error(message, error, { ...context, chapterSlug, userId }),
});

export const createComponentLogger = (component: string): Logger => ({
  debug: (message: string, context?: LogContext) => 
    logger.debug(message, { ...context, component }),
  info: (message: string, context?: LogContext) => 
    logger.info(message, { ...context, component }),
  warn: (message: string, context?: LogContext) => 
    logger.warn(message, { ...context, component }),
  error: (message: string, error?: Error, context?: LogContext) => 
    logger.error(message, error, { ...context, component }),
});

// API route logging helper
export const logApiRequest = (
  method: string,
  path: string,
  chapterSlug?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.info(`${method} ${path}`, {
    chapterSlug,
    userId,
    action: 'api-request',
    metadata: { method, path, ...metadata },
  });
};

export const logApiError = (
  method: string,
  path: string,
  error: Error,
  chapterSlug?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.error(`${method} ${path} failed`, error, {
    chapterSlug,
    userId,
    action: 'api-error',
    metadata: { method, path, ...metadata },
  });
};

// Migration utilities for replacing console statements
export const logAuthFlow = (
  action: string,
  message: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.info(message, {
    userId,
    action: `auth-${action}`,
    component: 'auth',
    metadata,
  });
};

export const logAuthError = (
  action: string,
  error: Error,
  userId?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.error(`Auth ${action} failed`, error, {
    userId,
    action: `auth-${action}`,
    component: 'auth',
    metadata,
  });
};

export const logClientError = (
  component: string,
  error: Error,
  chapterSlug?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.error(`Client error in ${component}`, error, {
    chapterSlug,
    userId,
    component,
    action: 'client-error',
    metadata,
  });
};

export const logClientAction = (
  component: string,
  action: string,
  message: string,
  chapterSlug?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.info(message, {
    chapterSlug,
    userId,
    component,
    action: `client-${action}`,
    metadata,
  });
};

export const logStripeEvent = (
  eventType: string,
  message: string,
  chapterSlug?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.info(message, {
    chapterSlug,
    action: `stripe-${eventType}`,
    component: 'stripe',
    metadata,
  });
};

export const logStripeError = (
  eventType: string,
  error: Error,
  chapterSlug?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.error(`Stripe ${eventType} failed`, error, {
    chapterSlug,
    action: `stripe-${eventType}`,
    component: 'stripe',
    metadata,
  });
};

export const logDatabaseOperation = (
  operation: string,
  table: string,
  chapterSlug?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.info(`Database ${operation} on ${table}`, {
    chapterSlug,
    userId,
    action: `db-${operation}`,
    component: 'database',
    metadata: { table, ...metadata },
  });
};

export const logDatabaseError = (
  operation: string,
  table: string,
  error: Error,
  chapterSlug?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void => {
  logger.error(`Database ${operation} on ${table} failed`, error, {
    chapterSlug,
    userId,
    action: `db-${operation}`,
    component: 'database',
    metadata: { table, ...metadata },
  });
};

// Helper to extract chapter context from Next.js params
export const extractChapterContext = async (
  params: Promise<{ chapterSlug?: string }> | { chapterSlug?: string }
): Promise<{ chapterSlug?: string }> => {
  if ('then' in params) {
    return await params;
  }
  return params;
};

// Helper to safely convert unknown errors to Error objects
export const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
};