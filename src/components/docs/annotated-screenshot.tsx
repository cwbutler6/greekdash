'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface Annotation {
  id: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  content: string;
  title?: string;
  type?: 'info' | 'warning' | 'success' | 'highlight';
}

export interface AnnotatedScreenshotProps {
  src: string;
  alt: string;
  annotations: Annotation[];
  className?: string;
  showAnnotationsOnHover?: boolean;
}

export function AnnotatedScreenshot({
  src,
  alt,
  annotations,
  className,
  showAnnotationsOnHover = false
}: AnnotatedScreenshotProps) {
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
  const [showAllAnnotations, setShowAllAnnotations] = useState(!showAnnotationsOnHover);

  const handleAnnotationClick = (annotationId: string) => {
    setActiveAnnotation(activeAnnotation === annotationId ? null : annotationId);
  };

  const getAnnotationColor = (type: Annotation['type'] = 'info') => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-500 border-yellow-600 text-yellow-50';
      case 'success':
        return 'bg-green-500 border-green-600 text-green-50';
      case 'highlight':
        return 'bg-blue-500 border-blue-600 text-blue-50';
      default:
        return 'bg-primary border-primary-foreground text-primary-foreground';
    }
  };

  const getPulseColor = (type: Annotation['type'] = 'info') => {
    switch (type) {
      case 'warning':
        return 'animate-pulse bg-yellow-400';
      case 'success':
        return 'animate-pulse bg-green-400';
      case 'highlight':
        return 'animate-pulse bg-blue-400';
      default:
        return 'animate-pulse bg-primary';
    }
  };

  return (
    <div className={cn('relative group', className)}>
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-lg border shadow-sm">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto"
          onMouseEnter={() => showAnnotationsOnHover && setShowAllAnnotations(true)}
          onMouseLeave={() => showAnnotationsOnHover && setShowAllAnnotations(false)}
        />

        {/* Annotation Markers */}
        {annotations.map((annotation, index) => (
          <div key={annotation.id}>
            {/* Marker */}
            <button
              className={cn(
                'absolute w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110 z-10',
                getAnnotationColor(annotation.type),
                activeAnnotation === annotation.id && 'scale-110 ring-2 ring-white ring-offset-2'
              )}
              style={{
                left: `${annotation.x}%`,
                top: `${annotation.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleAnnotationClick(annotation.id)}
            >
              {index + 1}
            </button>

            {/* Pulse Effect */}
            {(showAllAnnotations || activeAnnotation === annotation.id) && (
              <div
                className={cn(
                  'absolute w-6 h-6 rounded-full opacity-75 z-0',
                  getPulseColor(annotation.type)
                )}
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}

            {/* Tooltip/Callout */}
            {activeAnnotation === annotation.id && (
              <div
                className="absolute z-20"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  transform: 'translate(-50%, calc(-100% - 10px))'
                }}
              >
                <Card className="w-64 shadow-lg">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex-1">
                        {annotation.title && (
                          <h4 className="font-semibold text-sm mb-1">
                            {annotation.title}
                          </h4>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {annotation.content}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => setActiveAnnotation(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
                  </div>
                </Card>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Annotation List */}
      {annotations.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">
            Annotations:
          </h4>
          <div className="grid gap-2">
            {annotations.map((annotation, index) => (
              <button
                key={annotation.id}
                className={cn(
                  'flex items-start space-x-3 p-3 rounded-lg border text-left transition-colors hover:bg-muted/50',
                  activeAnnotation === annotation.id && 'bg-muted border-primary'
                )}
                onClick={() => handleAnnotationClick(annotation.id)}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0',
                  getAnnotationColor(annotation.type)
                )}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {annotation.title && (
                    <h5 className="font-medium text-sm mb-1">
                      {annotation.title}
                    </h5>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {annotation.content}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility component for creating callout boxes
export interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'tip';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Callout({ type = 'info', title, children, className }: CalloutProps) {
  const getCalloutStyles = () => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'tip':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'tip':
        return '💡';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={cn(
      'rounded-lg border p-4',
      getCalloutStyles(),
      className
    )}>
      <div className="flex items-start space-x-3">
        <span className="text-lg shrink-0">{getIcon()}</span>
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-2">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Component for highlighting specific areas of an image
export interface ImageHighlightProps {
  src: string;
  alt: string;
  highlights: {
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  }[];
  className?: string;
}

export function ImageHighlight({ src, alt, highlights, className }: ImageHighlightProps) {
  return (
    <div className={cn('relative', className)}>
      <img src={src} alt={alt} className="w-full h-auto rounded-lg border" />
      {highlights.map((highlight, index) => (
        <div
          key={index}
          className="absolute border-2 border-yellow-400 bg-yellow-400/20 rounded"
          style={{
            left: `${highlight.x}%`,
            top: `${highlight.y}%`,
            width: `${highlight.width}%`,
            height: `${highlight.height}%`
          }}
        >
          {highlight.label && (
            <div className="absolute -top-6 left-0 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
              {highlight.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}