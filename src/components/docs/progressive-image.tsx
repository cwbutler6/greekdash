'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  quality?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  quality = 75,
  loading = 'lazy',
  onLoad,
  onError
}: ProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate a simple blur placeholder if none provided
  const generateBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  };

  const imageProps = {
    src,
    alt,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading && 'opacity-0',
      !isLoading && 'opacity-100',
      className
    ),
    quality,
    sizes,
    ...(placeholder === 'blur' && {
      placeholder: 'blur' as const,
      blurDataURL: blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined)
    }),
    ...(priority && { priority: true }),
    ...(loading && { loading }),
    ...(fill ? { fill: true } : { width, height })
  };

  if (hasError) {
    return (
      <div 
        ref={imgRef}
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25',
          fill ? 'absolute inset-0' : '',
          className
        )}
        style={!fill && width && height ? { width, height } : undefined}
      >
        <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <span className="text-sm text-center">Failed to load image</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        fill ? 'absolute inset-0' : '',
        className
      )}
      style={!fill && width && height ? { width, height } : undefined}
    >
      {/* Loading placeholder */}
      {isLoading && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center bg-muted animate-pulse',
          fill ? '' : 'rounded-lg'
        )}>
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Actual image - only render when in view or priority */}
      {(isInView || priority) && (
        <Image {...imageProps} />
      )}
    </div>
  );
}

/**
 * Progressive image with responsive sizes for documentation
 */
export function DocsImage({
  src,
  alt,
  caption,
  className,
  priority = false,
  ...props
}: ProgressiveImageProps & {
  caption?: string;
}) {
  return (
    <figure className={cn('space-y-2', className)}>
      <ProgressiveImage
        src={src}
        alt={alt}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        className="rounded-lg border"
        placeholder="blur"
        {...props}
      />
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Progressive image optimized for mobile screenshots
 */
export function MobileScreenshot({
  src,
  alt,
  className,
  ...props
}: ProgressiveImageProps) {
  return (
    <div className={cn('mx-auto max-w-sm', className)}>
      <ProgressiveImage
        src={src}
        alt={alt}
        sizes="(max-width: 768px) 90vw, 400px"
        className="rounded-2xl shadow-lg border"
        placeholder="blur"
        quality={85}
        {...props}
      />
    </div>
  );
}

/**
 * Progressive image for desktop screenshots
 */
export function DesktopScreenshot({
  src,
  alt,
  className,
  ...props
}: ProgressiveImageProps) {
  return (
    <div className={cn('w-full', className)}>
      <ProgressiveImage
        src={src}
        alt={alt}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
        className="rounded-lg shadow-lg border"
        placeholder="blur"
        quality={90}
        {...props}
      />
    </div>
  );
}