'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundaries/ErrorBoundary';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Search, AlertCircle, BookOpen, TrendingUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SearchErrorBoundaryProps {
  children: React.ReactNode;
  query?: string;
  fallback?: React.ReactNode;
}

// Popular documentation pages to suggest when search fails
const POPULAR_PAGES = [
  {
    title: 'Getting Started',
    description: 'New to GreekDash? Start here for setup and onboarding.',
    href: '/docs/getting-started',
    icon: BookOpen
  },
  {
    title: 'Member Management',
    description: 'Learn how to invite, manage, and organize your members.',
    href: '/docs/admin-guide/members',
    icon: TrendingUp
  },
  {
    title: 'Financial Management',
    description: 'Set up dues, track expenses, and manage chapter finances.',
    href: '/docs/admin-guide/finance',
    icon: TrendingUp
  },
  {
    title: 'Event Management',
    description: 'Create events, manage RSVPs, and track engagement.',
    href: '/docs/admin-guide/events',
    icon: TrendingUp
  }
];

export function SearchErrorBoundary({ 
  children, 
  query, 
  fallback 
}: SearchErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Add search context to Sentry
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'search');
      scope.setContext('search', {
        query,
        component: 'SearchErrorBoundary',
      });
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });
  };

  const searchFallback = (
    <div className="flex min-h-[500px] flex-col items-center justify-center space-y-8 p-8">
      <div className="flex items-center space-x-3 text-destructive">
        <AlertCircle className="h-10 w-10" />
        <div className="text-center">
          <h2 className="text-2xl font-bold">Search Unavailable</h2>
          <p className="text-muted-foreground mt-1">
            We&apos;re having trouble with the search function right now.
          </p>
        </div>
      </div>

      {/* Query Context */}
      {query && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Your Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm bg-muted p-2 rounded">
              &quot;{query}&quot;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recovery Actions */}
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-semibold">Try these alternatives:</h3>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Search
          </Button>
          
          <Button asChild variant="outline">
            <Link href="/docs">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Documentation
            </Link>
          </Button>
        </div>
      </div>

      {/* Popular Pages */}
      <div className="w-full max-w-4xl space-y-4">
        <h4 className="text-center font-medium text-muted-foreground">
          Popular Documentation Pages
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POPULAR_PAGES.map((page, index) => {
            const IconComponent = page.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link href={page.href} className="block space-y-2">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <h5 className="font-semibold">{page.title}</h5>
                    </div>
                    <CardDescription className="text-sm">
                      {page.description}
                    </CardDescription>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Manual Search Suggestion */}
      <div className="text-center space-y-2 max-w-md">
        <p className="text-sm text-muted-foreground">
          You can also browse our documentation sections manually:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/admin-guide/members">Members</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/admin-guide/finance">Finance</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/admin-guide/events">Events</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/security">Security</Link>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      context={`search-${query || 'unknown'}`}
      onError={handleError}
      fallback={fallback || searchFallback}
    >
      {children}
    </ErrorBoundary>
  );
}