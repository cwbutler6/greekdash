'use client';

import { useState } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

interface VideoEmbedProps {
  videoId: string;
  title: string;
  className?: string;
  autoplay?: boolean;
  showControls?: boolean;
}

export function VideoEmbed({ 
  videoId, 
  title, 
  className,
  autoplay = false,
  showControls = true
}: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);

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
    showinfo: '0'
  }).toString()}`;

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={cn('aspect-video bg-muted rounded-lg', className)}>
        <Alert className="h-full flex items-center justify-center">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load video. Please check your connection or try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn('relative aspect-video bg-black rounded-lg overflow-hidden', className)}>
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
            >
              <Play className="h-6 w-6 ml-1" fill="currentColor" />
            </Button>
          </div>
          
          {/* Video Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <h3 className="text-white font-medium text-sm">{title}</h3>
          </div>
        </>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={handleError}
        />
      )}
    </div>
  );
}