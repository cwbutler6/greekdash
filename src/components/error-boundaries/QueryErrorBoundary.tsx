'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function QueryErrorBoundary({ children, fallback }: QueryErrorBoundaryProps) {
  const queryFallback = (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 p-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Failed to load data</h3>
          </div>
          <p className="text-center text-muted-foreground max-w-sm">
            There was an error loading the requested data. Please try again.
          </p>
          <Button onClick={reset} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      )}
    </QueryErrorResetBoundary>
  );

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          context="query"
          onError={() => reset()}
          fallback={fallback || queryFallback}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}