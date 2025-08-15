import { NextRequest } from 'next/server';
import { logApiRequest, logApiError, logger } from './logger';

export interface ApiContext {
  chapterSlug?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Generic wrapper that preserves the exact param types
export function withApiLogging<TParams extends Record<string, string>, TResponse>(
  handler: (request: NextRequest, context: { params: Promise<TParams> }) => Promise<TResponse>,
  routeName: string
) {
  return async (
    request: NextRequest,
    context: { params: Promise<TParams> }
  ): Promise<TResponse> => {
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();
    
    try {
      // Extract chapter slug from params if available
      const params = await context.params;
      const chapterSlug = 'chapterSlug' in params ? params.chapterSlug : undefined;
      
      // Log the request
      logApiRequest(method, routeName, chapterSlug, undefined, {
        url,
        userAgent: request.headers.get('user-agent'),
      });
      
      const result = await handler(request, context);
      
      // Log successful completion
      const duration = Date.now() - startTime;
      logger.info(`${method} ${routeName} completed`, {
        chapterSlug,
        action: 'api-success',
        metadata: { duration, url },
      });
      
      return result;
    } catch (error) {
      const params = await context.params;
      const chapterSlug = 'chapterSlug' in params ? params.chapterSlug : undefined;
      const duration = Date.now() - startTime;
      
      logApiError(
        method,
        routeName,
        error instanceof Error ? error : new Error(String(error)),
        chapterSlug,
        undefined,
        { duration, url }
      );
      
      throw error;
    }
  };
}