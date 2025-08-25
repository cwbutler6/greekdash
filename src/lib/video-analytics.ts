/**
 * Video Analytics Service
 * Tracks video engagement metrics for documentation videos
 */

import { trackChapterEvent } from '@/lib/client-analytics';

export interface VideoEngagementMetrics {
  videoId: string;
  videoTitle: string;
  totalViews: number;
  uniqueViews: number;
  averageWatchTime: number;
  completionRate: number;
  transcriptViews: number;
  relatedLinkClicks: number;
  lastWatched: Date;
}

export interface VideoAnalyticsEvent {
  videoId: string;
  videoTitle: string;
  eventType: 'start' | 'pause' | 'resume' | 'complete' | 'transcript_open' | 'transcript_close' | 'related_link_click' | 'error';
  timestamp: Date;
  watchTime?: number;
  userId?: string;
  chapterSlug?: string;
  metadata?: Record<string, unknown>;
}

// In-memory storage for demo purposes
// In production, this would be stored in a database
const videoMetrics: Map<string, VideoEngagementMetrics> = new Map();
let videoEvents: VideoAnalyticsEvent[] = [];

/**
 * Track video engagement event
 */
export function trackVideoEvent(event: Omit<VideoAnalyticsEvent, 'timestamp'>): void {
  const fullEvent: VideoAnalyticsEvent = {
    ...event,
    timestamp: new Date()
  };

  // Add to events history
  videoEvents.push(fullEvent);

  // Update metrics
  updateVideoMetrics(fullEvent);

  // Track with general analytics system
  trackChapterEvent('video_analytics_event', {
    videoId: event.videoId,
    videoTitle: event.videoTitle,
    eventType: event.eventType,
    category: 'documentation',
    source: 'video_tutorial',
    ...(event.watchTime && { watchTime: event.watchTime }),
    ...(event.metadata && event.metadata)
  });

  // Log for debugging (in production, send to analytics service)
  console.log(`Video Analytics: ${event.eventType} - ${event.videoTitle}`, {
    videoId: event.videoId,
    watchTime: event.watchTime,
    metadata: event.metadata
  });
}

/**
 * Update video metrics based on event
 */
function updateVideoMetrics(event: VideoAnalyticsEvent): void {
  const existing = videoMetrics.get(event.videoId);
  
  if (!existing) {
    videoMetrics.set(event.videoId, {
      videoId: event.videoId,
      videoTitle: event.videoTitle,
      totalViews: event.eventType === 'start' ? 1 : 0,
      uniqueViews: event.eventType === 'start' ? 1 : 0,
      averageWatchTime: event.watchTime || 0,
      completionRate: 0,
      transcriptViews: event.eventType === 'transcript_open' ? 1 : 0,
      relatedLinkClicks: event.eventType === 'related_link_click' ? 1 : 0,
      lastWatched: event.timestamp
    });
    return;
  }

  const updated = { ...existing };

  switch (event.eventType) {
    case 'start':
      updated.totalViews += 1;
      // Note: uniqueViews would need user tracking to be accurate
      updated.lastWatched = event.timestamp;
      break;
    
    case 'complete':
      // Calculate completion rate
      const completedViews = videoEvents.filter(
        e => e.videoId === event.videoId && e.eventType === 'complete'
      ).length;
      updated.completionRate = (completedViews / updated.totalViews) * 100;
      break;
    
    case 'transcript_open':
      updated.transcriptViews += 1;
      break;
    
    case 'related_link_click':
      updated.relatedLinkClicks += 1;
      break;
  }

  // Update average watch time
  if (event.watchTime) {
    const watchTimeEvents = videoEvents.filter(
      e => e.videoId === event.videoId && e.watchTime
    );
    const totalWatchTime = watchTimeEvents.reduce((sum, e) => sum + (e.watchTime || 0), 0);
    updated.averageWatchTime = totalWatchTime / watchTimeEvents.length;
  }

  videoMetrics.set(event.videoId, updated);
}

/**
 * Get metrics for a specific video
 */
export function getVideoMetrics(videoId: string): VideoEngagementMetrics | null {
  return videoMetrics.get(videoId) || null;
}

/**
 * Get all video metrics
 */
export function getAllVideoMetrics(): VideoEngagementMetrics[] {
  return Array.from(videoMetrics.values());
}

/**
 * Get popular videos based on engagement
 */
export function getPopularVideos(limit: number = 10): VideoEngagementMetrics[] {
  return Array.from(videoMetrics.values())
    .sort((a, b) => {
      // Sort by engagement score (views + completion rate + transcript views)
      const scoreA = a.totalViews + (a.completionRate / 10) + a.transcriptViews;
      const scoreB = b.totalViews + (b.completionRate / 10) + b.transcriptViews;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

/**
 * Get video analytics summary
 */
export function getVideoAnalyticsSummary(): {
  totalVideos: number;
  totalViews: number;
  averageCompletionRate: number;
  totalTranscriptViews: number;
  totalRelatedLinkClicks: number;
  topVideos: VideoEngagementMetrics[];
} {
  const metrics = Array.from(videoMetrics.values());
  
  return {
    totalVideos: metrics.length,
    totalViews: metrics.reduce((sum, m) => sum + m.totalViews, 0),
    averageCompletionRate: metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length 
      : 0,
    totalTranscriptViews: metrics.reduce((sum, m) => sum + m.transcriptViews, 0),
    totalRelatedLinkClicks: metrics.reduce((sum, m) => sum + m.relatedLinkClicks, 0),
    topVideos: getPopularVideos(5)
  };
}

/**
 * Clear video analytics (for testing or privacy)
 */
export function clearVideoAnalytics(): void {
  videoMetrics.clear();
  videoEvents = [];
}

/**
 * Export video analytics data
 */
export function exportVideoAnalytics(): {
  metrics: VideoEngagementMetrics[];
  events: VideoAnalyticsEvent[];
} {
  return {
    metrics: Array.from(videoMetrics.values()),
    events: [...videoEvents]
  };
}

/**
 * Import video analytics data
 */
export function importVideoAnalytics(data: {
  metrics: VideoEngagementMetrics[];
  events: VideoAnalyticsEvent[];
}): void {
  videoMetrics.clear();
  videoEvents = [];
  
  data.metrics.forEach(metric => {
    videoMetrics.set(metric.videoId, metric);
  });
  
  videoEvents = [...data.events];
}

/**
 * Helper function to track video start with proper context
 */
export function trackVideoStart(videoId: string, videoTitle: string, metadata?: Record<string, unknown>): void {
  trackVideoEvent({
    videoId,
    videoTitle,
    eventType: 'start',
    metadata
  });
}

/**
 * Helper function to track video completion with watch time
 */
export function trackVideoComplete(videoId: string, videoTitle: string, watchTime: number, metadata?: Record<string, unknown>): void {
  trackVideoEvent({
    videoId,
    videoTitle,
    eventType: 'complete',
    watchTime,
    metadata
  });
}

/**
 * Helper function to track transcript interaction
 */
export function trackTranscriptInteraction(videoId: string, videoTitle: string, action: 'open' | 'close'): void {
  trackVideoEvent({
    videoId,
    videoTitle,
    eventType: action === 'open' ? 'transcript_open' : 'transcript_close'
  });
}

/**
 * Helper function to track related link clicks
 */
export function trackRelatedLinkClick(videoId: string, videoTitle: string, linkTitle: string, linkUrl: string): void {
  trackVideoEvent({
    videoId,
    videoTitle,
    eventType: 'related_link_click',
    metadata: {
      linkTitle,
      linkUrl
    }
  });
}