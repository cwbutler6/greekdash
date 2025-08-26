'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  getErrorMessage, 
  getContextualSuggestions, 
  type ErrorMessage, 
  type ErrorSuggestion 
} from '@/lib/docs-error-messages';
import { useDocsErrorRecovery } from '@/hooks/use-docs-error-recovery';
import { cn } from '@/lib/utils';

interface ComprehensiveErrorHandlerProps {
  error: Error;
  context?: string;
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
  showDetails?: boolean;
}

export function ComprehensiveErrorHandler({
  error,
  context,
  onRetry,
  onReset,
  className,
  showDetails = false
}: ComprehensiveErrorHandlerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { retry, navigateToFallback, canRetry, isRetrying } = useDocsErrorRecovery({
    onRecovery: onReset
  });

  const errorMessage = getErrorMessage(error, context);
  const contextualSuggestions = getContextualSuggestions(pathname);
  
  // Merge error-specific suggestions with contextual ones
  const allSuggestions = [
    ...errorMessage.suggestions,
    ...contextualSuggestions.filter(
      contextual => !errorMessage.suggestions.some(
        errorSugg => errorSugg.actionData === contextual.actionData
      )
    )
  ].slice(0, 6); // Limit to 6 suggestions

  const handleSuggestionAction = async (suggestion: ErrorSuggestion) => {
    switch (suggestion.action) {
      case 'retry':
        if (onRetry) {
          onRetry();
        } else {
          await retry();
        }
        break;
      
      case 'navigate':
        if (suggestion.actionData) {
          router.push(suggestion.actionData);
        } else {
          navigateToFallback();
        }
        break;
      
      case 'search':
        router.push('/docs/search');
        break;
      
      case 'external':
        if (suggestion.actionData === 'youtube' && context === 'video') {
          // Extract video ID from error context if available
          window.open('https://youtube.com', '_blank');
        } else if (suggestion.actionData === 'support') {
          // Navigate to support or contact page
          router.push('/contact');
        } else if (suggestion.actionData === 'check-connection') {
          // Show connection check instructions
          window.open('https://www.google.com', '_blank');
        }
        break;
    }
  };

  const getSeverityColor = (severity: ErrorMessage['severity']) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const IconComponent = errorMessage.icon;

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Main Error Display */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <IconComponent className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-2xl font-bold">{errorMessage.title}</h2>
            <Badge className={getSeverityColor(errorMessage.severity)}>
              {errorMessage.severity.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            {errorMessage.description}
          </p>
        </div>

        {/* Context Information */}
        {context && (
          <Alert className="max-w-md mx-auto">
            <AlertDescription>
              <strong>Context:</strong> {context.charAt(0).toUpperCase() + context.slice(1)} error
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Error Details (Development) */}
      {showDetails && process.env.NODE_ENV === 'development' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-sm">Error Details (Development)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Name:</strong> {error.name}
              </div>
              <div>
                <strong>Message:</strong> {error.message}
              </div>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">Stack Trace</summary>
                  <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">What you can do:</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {allSuggestions.map((suggestion, index) => {
            const SuggestionIcon = suggestion.icon;
            const isRetryAction = suggestion.action === 'retry';
            const isDisabled = isRetryAction && (!canRetry || isRetrying);
            
            return (
              <Card 
                key={index} 
                className={cn(
                  "hover:shadow-md transition-shadow cursor-pointer",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <CardContent className="p-4">
                  <button
                    onClick={() => !isDisabled && handleSuggestionAction(suggestion)}
                    disabled={isDisabled}
                    className="w-full text-left space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <SuggestionIcon className="h-5 w-5 text-primary" />
                      <span className="font-medium text-sm">{suggestion.title}</span>
                      {isRetryAction && isRetrying && (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {suggestion.description}
                    </CardDescription>
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Help */}
      <div className="text-center space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Still having trouble? Try these additional resources:
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/docs/getting-started">Getting Started</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/docs/search">Search Help</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      {onReset && (
        <div className="text-center">
          <Button onClick={onReset} variant="outline">
            Reset and Try Again
          </Button>
        </div>
      )}
    </div>
  );
}