import * as Sentry from '@sentry/nextjs';
import { redirect } from 'next/navigation';
import { logger } from './logger';

export interface ServerActionError {
  message: string;
  code?: string;
  statusCode?: number;
}

export function handleServerActionError(
  error: unknown,
  context: {
    action: string;
    chapterSlug?: string;
    userId?: string;
  }
): ServerActionError {
  const errorInstance = error instanceof Error ? error : new Error(String(error));
  
  // Use structured logging instead of console.error
  logger.error(`Server action error in ${context.action}`, errorInstance, {
    chapterSlug: context.chapterSlug,
    userId: context.userId,
    action: context.action,
  });

  // Log to Sentry with context
  Sentry.withScope((scope) => {
    scope.setTag('errorType', 'server-action');
    scope.setContext('action', context);
    
    if (context.chapterSlug) {
      scope.setTag('chapterSlug', context.chapterSlug);
    }
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    Sentry.captureException(errorInstance);
  });

  // Handle different error types
  if (errorInstance.message.includes('Unauthorized')) {
    return {
      message: 'You are not authorized to perform this action.',
      code: 'UNAUTHORIZED',
      statusCode: 401,
    };
  }
  
  if (errorInstance.message.includes('Not found')) {
    return {
      message: 'The requested resource was not found.',
      code: 'NOT_FOUND',
      statusCode: 404,
    };
  }
  
  if (errorInstance.message.includes('Validation')) {
    return {
      message: 'Invalid input provided.',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    };
  }
  
  return {
    message: errorInstance.message,
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}

export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: { action: string; chapterSlug?: string }
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const serverError = handleServerActionError(error, context);
      
      // For critical errors, redirect to error page
      if (serverError.statusCode === 500) {
        redirect('/error');
      }
      
      throw error;
    }
  };
}