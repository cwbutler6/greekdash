'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundaries/ErrorBoundary';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Home, BookOpen, AlertTriangle, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DocsErrorBoundaryProps {
  children: React.ReactNode;
  pageSlug?: string;
  section?: string;
  fallback?: React.ReactNode;
}

export function DocsErrorBoundary({ 
  children, 
  pageSlug, 
  section, 
  fallback 
}: DocsErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Add documentation context to Sentry
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'documentation');
      scope.setContext('documentation', {
        pageSlug,
        section,
        component: 'DocsErrorBoundary',
      });
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });
  };

  const docsFallback = (
    <div className="flex min-h-[600px] flex-col items-center justify-center space-y-8 p-8">
      <div className="flex items-center space-x-3 text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <div>
          <h2 className="text-3xl font-bold">Documentation Error</h2>
          <p className="text-lg text-muted-foreground mt-1">
            We encountered an error while loading this documentation page.
          </p>
        </div>
      </div>

      {/* Error Context */}
      {(pageSlug || section) && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-sm">Page Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {section && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Section:</span>
                <span className="font-mono">{section}</span>
              </div>
            )}
            {pageSlug && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Page:</span>
                <span className="font-mono">{pageSlug}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggested Actions */}
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-semibold">What you can do:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
          <Card className="p-4">
            <CardContent className="p-0 space-y-2">
              <RefreshCw className="h-6 w-6 mx-auto text-muted-foreground" />
              <h4 className="font-medium">Try Again</h4>
              <CardDescription className="text-xs">
                Reload the page to see if the issue resolves
              </CardDescription>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardContent className="p-0 space-y-2">
              <Search className="h-6 w-6 mx-auto text-muted-foreground" />
              <h4 className="font-medium">Search Docs</h4>
              <CardDescription className="text-xs">
                Find what you&apos;re looking for using search
              </CardDescription>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/docs/search">
                  Search Documentation
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardContent className="p-0 space-y-2">
              <BookOpen className="h-6 w-6 mx-auto text-muted-foreground" />
              <h4 className="font-medium">Browse Docs</h4>
              <CardDescription className="text-xs">
                Start from the documentation homepage
              </CardDescription>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/docs">
                  Documentation Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alternative Resources */}
      <div className="space-y-3 text-center max-w-md">
        <h4 className="font-medium text-muted-foreground">Need immediate help?</h4>
        <div className="flex justify-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/getting-started">
              Getting Started Guide
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/admin-guide">
              Admin Guide
            </Link>
          </Button>
        </div>
      </div>

      {/* Home Link */}
      <Button asChild className="mt-8">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Return to Home
        </Link>
      </Button>
    </div>
  );

  return (
    <ErrorBoundary
      context={`docs-${section || 'unknown'}-${pageSlug || 'unknown'}`}
      onError={handleError}
      fallback={fallback || docsFallback}
    >
      {children}
    </ErrorBoundary>
  );
}