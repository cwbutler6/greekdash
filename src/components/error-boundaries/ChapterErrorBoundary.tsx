'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Home, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ChapterErrorBoundaryProps {
  children: React.ReactNode;
  chapterSlug?: string;
  fallback?: React.ReactNode;
}

export function ChapterErrorBoundary({ children, chapterSlug, fallback }: ChapterErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Add chapter context to Sentry
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'chapter');
      scope.setContext('chapter', {
        slug: chapterSlug,
        component: 'ChapterErrorBoundary',
      });
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });
  };

  const chapterFallback = (
    <div className="flex min-h-[500px] flex-col items-center justify-center space-y-6 p-8">
      <div className="flex items-center space-x-2 text-destructive">
        <AlertTriangle className="h-10 w-10" />
        <h2 className="text-2xl font-semibold">Chapter Error</h2>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg text-muted-foreground">
          We encountered an error while loading your chapter content.
        </p>
        {chapterSlug && (
          <p className="text-sm text-muted-foreground">
            Chapter: <span className="font-mono">{chapterSlug}</span>
          </p>
        )}
      </div>
      <div className="flex space-x-4">
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      context={`chapter-${chapterSlug || 'unknown'}`}
      onError={handleError}
      fallback={fallback || chapterFallback}
    >
      {children}
    </ErrorBoundary>
  );
}