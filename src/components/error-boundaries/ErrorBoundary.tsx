'use client';

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { createComponentLogger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

const logger = createComponentLogger('ErrorBoundary');

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry with context
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', this.props.context || 'unknown');
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.props.context,
      });
      Sentry.captureException(error);
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Replace console.error with structured logging
    logger.error('Error caught by boundary', error, {
      action: 'componentDidCatch',
      metadata: {
        context: this.props.context || 'unknown',
        componentStack: errorInfo.componentStack,
        errorMessage: error.message,
        errorName: error.name
      }
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
          </div>
          <p className="text-center text-muted-foreground max-w-md">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full max-w-2xl">
              <summary className="cursor-pointer text-sm font-medium">Error Details (Development)</summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <Button onClick={this.handleRetry} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}