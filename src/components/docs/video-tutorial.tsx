'use client';

import { VideoEmbed } from './video-embed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoTutorialProps {
  videoId: string;
  title: string;
  description?: string;
  transcript?: string;
  duration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  audience?: string[];
  prerequisites?: string[];
  relatedLinks?: Array<{
    title: string;
    url: string;
    type: 'internal' | 'external';
    description?: string;
  }>;
  className?: string;
}

export function VideoTutorial({
  videoId,
  title,
  description,
  transcript,
  duration,
  difficulty = 'beginner',
  audience = [],
  prerequisites = [],
  relatedLinks = [],
  className
}: VideoTutorialProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tutorial Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{title}</CardTitle>
              {description && (
                <CardDescription className="text-base">
                  {description}
                </CardDescription>
              )}
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge className={difficultyColors[difficulty]}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Badge>
              {duration && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {duration}
                </div>
              )}
            </div>
          </div>
          
          {/* Tutorial Metadata */}
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            {audience.length > 0 && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  For: {audience.join(', ')}
                </span>
              </div>
            )}
            
            {prerequisites.length > 0 && (
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Prerequisites: {prerequisites.join(', ')}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Video Player */}
      <VideoEmbed
        videoId={videoId}
        title={title}
        description={description}
        transcript={transcript}
        duration={duration}
        relatedLinks={relatedLinks}
        showRelatedContent={true}
      />

      {/* Prerequisites Section */}
      {prerequisites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {prerequisites.map((prerequisite, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-sm">{prerequisite}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Simplified version for inline use in documentation
export function InlineVideoTutorial({
  videoId,
  title,
  description,
  duration,
  className
}: Pick<VideoTutorialProps, 'videoId' | 'title' | 'description' | 'duration' | 'className'>) {
  return (
    <div className={cn('my-6', className)}>
      <VideoEmbed
        videoId={videoId}
        title={title}
        description={description}
        duration={duration}
        showRelatedContent={false}
      />
    </div>
  );
}