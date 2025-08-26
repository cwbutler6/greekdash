'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundaries/ErrorBoundary';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  AlertCircle, 
  ExternalLink, 
  FileText, 
  RefreshCw,
  Monitor,
  Wifi
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoErrorBoundaryProps {
  children: React.ReactNode;
  videoId?: string;
  videoTitle?: string;
  fallback?: React.ReactNode;
  showAlternatives?: boolean;
}

interface VideoAlternative {
  type: 'transcript' | 'guide' | 'external';
  title: string;
  description: string;
  href?: string;
  content?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function VideoErrorBoundary({ 
  children, 
  videoId, 
  videoTitle,
  fallback,
  showAlternatives = true
}: VideoErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Add video context to Sentry
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'video');
      scope.setContext('video', {
        videoId,
        videoTitle,
        component: 'VideoErrorBoundary',
      });
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });
  };

  // Generate alternatives based on video content
  const getVideoAlternatives = (): VideoAlternative[] => {
    const alternatives: VideoAlternative[] = [];

    // Always suggest text-based guide
    alternatives.push({
      type: 'guide',
      title: 'Step-by-Step Guide',
      description: 'Follow our written instructions for the same process covered in this video.',
      href: '/docs/admin-guide',
      icon: FileText
    });

    // Suggest external video if we have a video ID
    if (videoId) {
      alternatives.push({
        type: 'external',
        title: 'Watch on YouTube',
        description: 'View this video directly on YouTube if embedding is not working.',
        href: `https://www.youtube.com/watch?v=${videoId}`,
        icon: ExternalLink
      });
    }

    return alternatives;
  };

  const videoFallback = (
    <div className="space-y-6">
      {/* Error Alert */}
      <Alert className="border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Unable to load video content. This might be due to network issues or video service problems.
          </span>
        </AlertDescription>
      </Alert>

      {/* Video Information */}
      {(videoTitle || videoId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Play className="h-4 w-4 mr-2" />
              Video Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {videoTitle && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Title:</span>
                <span className="font-medium">{videoTitle}</span>
              </div>
            )}
            {videoId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Video ID:</span>
                <span className="font-mono text-xs">{videoId}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Check Connection</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Ensure you have a stable internet connection and try refreshing the page.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Browser Issues</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Try disabling ad blockers or switching to a different browser.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Loading Video
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Content */}
      {showAlternatives && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Alternative Resources</CardTitle>
            <CardDescription>
              Access the same information through these alternative formats:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {getVideoAlternatives().map((alternative, index) => {
              const IconComponent = alternative.icon;
              return (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <IconComponent className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 space-y-1">
                    {alternative.href ? (
                      <Link 
                        href={alternative.href}
                        className="font-medium text-sm hover:underline"
                        {...(alternative.type === 'external' && {
                          target: '_blank',
                          rel: 'noopener noreferrer'
                        })}
                      >
                        {alternative.title}
                        {alternative.type === 'external' && (
                          <ExternalLink className="inline h-3 w-3 ml-1" />
                        )}
                      </Link>
                    ) : (
                      <span className="font-medium text-sm">{alternative.title}</span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {alternative.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Still having trouble? Check our troubleshooting guide or contact support.
        </p>
        <div className="flex justify-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/admin-guide">
              Browse Documentation
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/search">
              Search Help
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      context={`video-${videoId || 'unknown'}`}
      onError={handleError}
      fallback={fallback || videoFallback}
    >
      {children}
    </ErrorBoundary>
  );
}