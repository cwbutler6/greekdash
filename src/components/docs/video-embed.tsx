'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, AlertCircle, ExternalLink, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { trackChapterEvent } from '@/lib/client-analytics';
import { trackVideoEvent, trackVideoStart, trackVideoComplete, trackTranscriptInteraction, trackRelatedLinkClick } from '@/lib/video-analytics';
import Image from 'next/image';
import Link from 'next/link';

interface RelatedLink {
  title: string;
  url: string;
  type: 'internal' | 'external';
  description?: string;
}

interface VideoEmbedProps {
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
}

export function VideoEmbed({ 
  videoId, 
  title,
  description,
  transcript,
  relatedLinks = [],
  duration,
  className,
  autoplay = false,
  showControls = true,
  showRelatedContent = true
}: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [showTranscript, setShowTranscript] = useState(false);
  const [hasStartedWatching, setHasStartedWatching] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number>(0);

  // Extract video ID from various URL formats
  const extractVideoId = (url: string): string => {
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match) return match[1];
    
    // If it's already just an ID, return it
    if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
      return url;
    }
    
    // Return as-is if we can't parse it
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
    enablejsapi: '1'
  }).toString()}`;

  // Track video engagement
  useEffect(() => {
    if (isPlaying && !hasStartedWatching) {
      setHasStartedWatching(true);
      startTimeRef.current = Date.now();
      
      // Track video start with both systems
      trackVideoStart(videoIdClean, title, {
        source: 'docs',
        hasTranscript: !!transcript,
        relatedLinksCount: relatedLinks.length
      });
      
      trackChapterEvent('video_started', {
        videoId: videoIdClean,
        videoTitle: title,
        category: 'documentation',
        source: 'docs'
      });
    }
  }, [isPlaying, hasStartedWatching, videoIdClean, title, transcript, relatedLinks.length]);

  // Track watch time when component unmounts or video stops
  useEffect(() => {
    return () => {
      if (hasStartedWatching && startTimeRef.current > 0) {
        const totalWatchTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        // Track completion with video analytics
        trackVideoComplete(videoIdClean, title, totalWatchTime, {
          source: 'docs',
          transcriptViewed: showTranscript
        });
        
        trackChapterEvent('video_engagement', {
          videoId: videoIdClean,
          videoTitle: title,
          watchTimeSeconds: totalWatchTime,
          category: 'documentation',
          source: 'docs'
        });
      }
    };
  }, [hasStartedWatching, videoIdClean, title, showTranscript]);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    
    // Track video error with video analytics
    trackVideoEvent({
      videoId: videoIdClean,
      videoTitle: title,
      eventType: 'error'
    });
    
    // Track with general analytics
    trackChapterEvent('video_error', {
      videoId: videoIdClean,
      videoTitle: title,
      category: 'documentation',
      source: 'docs'
    });
  };

  const handleTranscriptToggle = () => {
    const newShowTranscript = !showTranscript;
    setShowTranscript(newShowTranscript);
    
    // Track transcript usage with video analytics
    trackTranscriptInteraction(videoIdClean, title, newShowTranscript ? 'open' : 'close');
    
    // Track with general analytics
    trackChapterEvent('video_transcript_toggled', {
      videoId: videoIdClean,
      videoTitle: title,
      action: newShowTranscript ? 'opened' : 'closed',
      category: 'documentation',
      source: 'docs'
    });
  };

  const handleRelatedLinkClick = (link: RelatedLink) => {
    // Track with video analytics
    trackRelatedLinkClick(videoIdClean, title, link.title, link.url);
    
    // Track with general analytics
    trackChapterEvent('video_related_link_clicked', {
      videoId: videoIdClean,
      videoTitle: title,
      linkTitle: link.title,
      linkType: link.type,
      linkUrl: link.url,
      category: 'documentation',
      source: 'docs'
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
        
        {/* Show related content even if video fails */}
        {showRelatedContent && (relatedLinks.length > 0 || transcript) && (
          <div className="space-y-4">
            {relatedLinks.length > 0 && (
              <RelatedContent 
                links={relatedLinks} 
                onLinkClick={handleRelatedLinkClick}
              />
            )}
            
            {transcript && (
              <TranscriptSection 
                transcript={transcript}
                isOpen={showTranscript}
                onToggle={handleTranscriptToggle}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {!isLoaded ? (
          <>
            {/* Video Thumbnail */}
            <Image
              src={thumbnailUrl}
              alt={`${title} video thumbnail`}
              fill
              className="object-cover"
              onError={handleError}
            />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-colors">
              <Button
                onClick={handlePlay}
                size="lg"
                className="rounded-full w-16 h-16 bg-white bg-opacity-90 hover:bg-opacity-100 text-black hover:text-black"
                aria-label={`Play video: ${title}`}
              >
                <Play className="h-6 w-6 ml-1" fill="currentColor" />
              </Button>
            </div>
            
            {/* Video Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">{title}</h3>
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
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
            />
          )}
          
          {transcript && (
            <TranscriptSection 
              transcript={transcript}
              isOpen={showTranscript}
              onToggle={handleTranscriptToggle}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Related Content Component
interface RelatedContentProps {
  links: RelatedLink[];
  onLinkClick: (link: RelatedLink) => void;
}

function RelatedContent({ links, onLinkClick }: RelatedContentProps) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-3 flex items-center">
        <ExternalLink className="h-4 w-4 mr-2" />
        Related Resources
      </h4>
      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={index} className="flex items-start space-x-2">
            {link.type === 'internal' ? (
              <Link
                href={link.url}
                className="text-sm text-primary hover:underline flex-1"
                onClick={() => onLinkClick(link)}
              >
                <div className="flex items-center">
                  <span className="flex-1">{link.title}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    Internal
                  </Badge>
                </div>
                {link.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {link.description}
                  </p>
                )}
              </Link>
            ) : (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex-1"
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
                  <p className="text-xs text-muted-foreground mt-1">
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
}

function TranscriptSection({ transcript, isOpen, onToggle }: TranscriptSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
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
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {transcript}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}