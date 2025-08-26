'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, AlertCircle, ExternalLink, FileText, Clock, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { trackChapterEvent } from '@/lib/client-analytics';
import { trackVideoEvent, trackVideoStart, trackVideoComplete, trackTranscriptInteraction, trackRelatedLinkClick } from '@/lib/video-analytics';
import { VideoErrorBoundary } from './error-boundaries/video-error-boundary';
import { ProgressiveImage } from './progressive-image';
import Link from 'next/link';

interface RelatedLink {
  title: string;
  url: string;
  type: 'internal' | 'external';
  description?: string;
}

interface MobileOptimizedVideoProps {
  videoId: string;
  title: string;
  description?: string;
  transcript?: string;
  relatedLinks?: RelatedLink[];
  duration?: string;
  className?: string;
  autoplay?: boolean;
  showControls?: boolean;
  showRelatedContent?: boolean;
  isMobile?: boolean;
}

export function MobileOptimizedVideo({ 
  videoId, 
  title,
  description,
  transcript,
  relatedLinks = [],
  duration,
  className,
  autoplay = false,
  showControls = true,
  showRelatedContent = true,
  isMobile = false
}: MobileOptimizedVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [showTranscript, setShowTranscript] = useState(false);
  const [hasStartedWatching, setHasStartedWatching] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  // Extract video ID from various URL formats
  const extractVideoId = (url: string): string => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match) return match[1];
    
    if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
      return url;
    }
    
    return url;
  };

  const videoIdClean = extractVideoId(videoId);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoIdClean}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoIdClean}?${new URLSearchParams({
    autoplay: isPlaying ? '1' : '0',
    controls: showControls ? '1' : '0',
    modestbranding: '1',
    rel: '0',
    showinfo: '0',
    enablejsapi: '1',
    ...(isMobile && { playsinline: '1' }) // Better mobile playback
  }).toString()}`;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (isLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading when video is 100px away from viewport
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isLoaded]);

  // Track video engagement
  useEffect(() => {
    if (isPlaying && !hasStartedWatching) {
      setHasStartedWatching(true);
      startTimeRef.current = Date.now();
      
      trackVideoStart(videoIdClean, title, {
        source: 'docs',
        hasTranscript: !!transcript,
        relatedLinksCount: relatedLinks.length,
        isMobile
      });
      
      trackChapterEvent('video_started', {
        videoId: videoIdClean,
        videoTitle: title,
        category: 'documentation',
        source: 'docs',
        isMobile
      });
    }
  }, [isPlaying, hasStartedWatching, videoIdClean, title, transcript, relatedLinks.length, isMobile]);

  // Track watch time when component unmounts or video stops
  useEffect(() => {
    return () => {
      if (hasStartedWatching && startTimeRef.current > 0) {
        const totalWatchTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        trackVideoComplete(videoIdClean, title, totalWatchTime, {
          source: 'docs',
          transcriptViewed: showTranscript,
          isMobile
        });
        
        trackChapterEvent('video_engagement', {
          videoId: videoIdClean,
          videoTitle: title,
          watchTimeSeconds: totalWatchTime,
          category: 'documentation',
          source: 'docs',
          isMobile
        });
      }
    };
  }, [hasStartedWatching, videoIdClean, title, showTranscript, isMobile]);

  // Handle fullscreen for mobile
  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    
    trackVideoEvent({
      videoId: videoIdClean,
      videoTitle: title,
      eventType: 'error'
    });
    
    trackChapterEvent('video_error', {
      videoId: videoIdClean,
      videoTitle: title,
      category: 'documentation',
      source: 'docs',
      isMobile
    });
  };

  const handleTranscriptToggle = () => {
    const newShowTranscript = !showTranscript;
    setShowTranscript(newShowTranscript);
    
    trackTranscriptInteraction(videoIdClean, title, newShowTranscript ? 'open' : 'close');
    
    trackChapterEvent('video_transcript_toggled', {
      videoId: videoIdClean,
      videoTitle: title,
      action: newShowTranscript ? 'opened' : 'closed',
      category: 'documentation',
      source: 'docs',
      isMobile
    });
  };

  const handleRelatedLinkClick = (link: RelatedLink) => {
    trackRelatedLinkClick(videoIdClean, title, link.title, link.url);
    
    trackChapterEvent('video_related_link_clicked', {
      videoId: videoIdClean,
      videoTitle: title,
      linkTitle: link.title,
      linkType: link.type,
      linkUrl: link.url,
      category: 'documentation',
      source: 'docs',
      isMobile
    });
  };

  if (hasError) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="aspect-video bg-muted rounded-lg">
          <Alert className="h-full flex items-center justify-center">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load video. Please check your connection or try again later.
            </AlertDescription>
          </Alert>
        </div>
        
        {showRelatedContent && (relatedLinks.length > 0 || transcript) && (
          <div className="space-y-4">
            {relatedLinks.length > 0 && (
              <RelatedContent 
                links={relatedLinks} 
                onLinkClick={handleRelatedLinkClick}
                isMobile={isMobile}
              />
            )}
            
            {transcript && (
              <TranscriptSection 
                transcript={transcript}
                isOpen={showTranscript}
                onToggle={handleTranscriptToggle}
                isMobile={isMobile}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <VideoErrorBoundary 
      videoId={videoIdClean} 
      videoTitle={title}
      showAlternatives={showRelatedContent}
    >
      <div className={cn('space-y-4', className)}>
        {/* Video Player */}
        <div 
          ref={containerRef}
          className={cn(
            'relative aspect-video bg-black rounded-lg overflow-hidden',
            isFullscreen && 'fixed inset-0 z-50 rounded-none'
          )}
        >
          {!isLoaded ? (
            <>
              {/* Progressive Video Thumbnail */}
              <ProgressiveImage
                src={thumbnailUrl}
                alt={`${title} video thumbnail`}
                fill
                className="object-cover"
                onError={handleError}
                priority={isInView}
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-colors">
                <Button
                  onClick={handlePlay}
                  size={isMobile ? "lg" : "default"}
                  className={cn(
                    "rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 text-black hover:text-black",
                    isMobile ? "w-20 h-20" : "w-16 h-16" // Larger touch target on mobile
                  )}
                  aria-label={`Play video: ${title}`}
                >
                  <Play className={cn("ml-1 fill-current", isMobile ? "h-8 w-8" : "h-6 w-6")} />
                </Button>
              </div>
              
              {/* Mobile fullscreen button */}
              {isMobile && (
                <Button
                  onClick={handleFullscreen}
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-0"
                  aria-label="Enter fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              
              {/* Video Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-white font-medium",
                    isMobile ? "text-base" : "text-sm"
                  )}>
                    {title}
                  </h3>
                  {duration && (
                    <Badge variant="secondary" className="bg-black bg-opacity-50 text-white border-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {duration}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          ) : (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              onError={handleError}
            />
          )}
        </div>

        {/* Video Description */}
        {description && (
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">{description}</p>
          </div>
        )}

        {/* Related Content */}
        {showRelatedContent && (relatedLinks.length > 0 || transcript) && (
          <div className="space-y-4">
            {relatedLinks.length > 0 && (
              <RelatedContent 
                links={relatedLinks} 
                onLinkClick={handleRelatedLinkClick}
                isMobile={isMobile}
              />
            )}
            
            {transcript && (
              <TranscriptSection 
                transcript={transcript}
                isOpen={showTranscript}
                onToggle={handleTranscriptToggle}
                isMobile={isMobile}
              />
            )}
          </div>
        )}
      </div>
    </VideoErrorBoundary>
  );
}

// Related Content Component
interface RelatedContentProps {
  links: RelatedLink[];
  onLinkClick: (link: RelatedLink) => void;
  isMobile?: boolean;
}

function RelatedContent({ links, onLinkClick, isMobile = false }: RelatedContentProps) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className={cn(
        "font-semibold mb-3 flex items-center",
        isMobile ? "text-base" : "text-sm"
      )}>
        <ExternalLink className="h-4 w-4 mr-2" />
        Related Resources
      </h4>
      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={index} className="flex items-start space-x-2">
            {link.type === 'internal' ? (
              <Link
                href={link.url}
                className={cn(
                  "text-primary hover:underline flex-1",
                  isMobile ? "text-base py-2" : "text-sm" // Larger touch targets
                )}
                onClick={() => onLinkClick(link)}
              >
                <div className="flex items-center">
                  <span className="flex-1">{link.title}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    Internal
                  </Badge>
                </div>
                {link.description && (
                  <p className={cn(
                    "text-muted-foreground mt-1",
                    isMobile ? "text-sm" : "text-xs"
                  )}>
                    {link.description}
                  </p>
                )}
              </Link>
            ) : (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "text-primary hover:underline flex-1",
                  isMobile ? "text-base py-2" : "text-sm"
                )}
                onClick={() => onLinkClick(link)}
              >
                <div className="flex items-center">
                  <span className="flex-1">{link.title}</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                  <Badge variant="outline" className="ml-2 text-xs">
                    External
                  </Badge>
                </div>
                {link.description && (
                  <p className={cn(
                    "text-muted-foreground mt-1",
                    isMobile ? "text-sm" : "text-xs"
                  )}>
                    {link.description}
                  </p>
                )}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Transcript Section Component
interface TranscriptSectionProps {
  transcript: string;
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

function TranscriptSection({ transcript, isOpen, onToggle, isMobile = false }: TranscriptSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-full justify-between",
            isMobile && "h-12 text-base" // Larger touch target
          )}
        >
          <span className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Video Transcript
          </span>
          <span className="text-xs text-muted-foreground">
            {isOpen ? 'Hide' : 'Show'}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="prose prose-sm max-w-none">
            <div className={cn(
              "whitespace-pre-wrap leading-relaxed",
              isMobile ? "text-base" : "text-sm"
            )}>
              {transcript}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}