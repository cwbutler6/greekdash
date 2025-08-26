'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundaries/ErrorBoundary';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Home, 
  BookOpen, 
  Search,
  Menu,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface NavigationErrorBoundaryProps {
  children: React.ReactNode;
  navigationContext?: 'sidebar' | 'breadcrumbs' | 'header' | 'footer';
  fallback?: React.ReactNode;
}

// Simplified navigation structure for fallback
const FALLBACK_NAVIGATION = [
  {
    title: 'Documentation Home',
    href: '/docs',
    icon: BookOpen,
    description: 'Start here for an overview of all documentation'
  },
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    icon: BookOpen,
    description: 'New user onboarding and setup guide'
  },
  {
    title: 'Admin Guide',
    href: '/docs/admin-guide',
    icon: BookOpen,
    description: 'Comprehensive administrator documentation'
  },
  {
    title: 'Search Documentation',
    href: '/docs/search',
    icon: Search,
    description: 'Find specific information quickly'
  }
];

export function NavigationErrorBoundary({ 
  children, 
  navigationContext = 'sidebar',
  fallback 
}: NavigationErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Add navigation context to Sentry
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'navigation');
      scope.setContext('navigation', {
        context: navigationContext,
        component: 'NavigationErrorBoundary',
      });
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });
  };

  const getContextualMessage = () => {
    switch (navigationContext) {
      case 'sidebar':
        return {
          title: 'Sidebar Navigation Error',
          description: 'The documentation sidebar failed to load properly.'
        };
      case 'breadcrumbs':
        return {
          title: 'Breadcrumb Navigation Error',
          description: 'The page breadcrumbs could not be displayed.'
        };
      case 'header':
        return {
          title: 'Header Navigation Error',
          description: 'The documentation header navigation failed to load.'
        };
      case 'footer':
        return {
          title: 'Footer Navigation Error',
          description: 'The documentation footer navigation failed to load.'
        };
      default:
        return {
          title: 'Navigation Error',
          description: 'A navigation component failed to load properly.'
        };
    }
  };

  const navigationFallback = (
    <div className="space-y-6 p-4">
      {/* Error Alert */}
      <div className="flex items-center space-x-3 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <div>
          <h3 className="font-semibold">{getContextualMessage().title}</h3>
          <p className="text-sm text-muted-foreground">
            {getContextualMessage().description}
          </p>
        </div>
      </div>

      {/* Recovery Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm"
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload Page
        </Button>
        
        <Button asChild variant="outline" size="sm">
          <Link href="/docs">
            <BookOpen className="mr-2 h-4 w-4" />
            Documentation Home
          </Link>
        </Button>
      </div>

      {/* Fallback Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <Menu className="h-4 w-4 mr-2" />
            Quick Navigation
          </CardTitle>
          <CardDescription>
            Use these links to navigate the documentation:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {FALLBACK_NAVIGATION.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <IconComponent className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Additional Help */}
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          Navigation issues? Try refreshing the page or return to the homepage.
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      context={`navigation-${navigationContext}`}
      onError={handleError}
      fallback={fallback || navigationFallback}
    >
      {children}
    </ErrorBoundary>
  );
}