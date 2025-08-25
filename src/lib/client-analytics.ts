/**
 * Client-side analytics tracking
 * Safe for use in client components without server dependencies
 */

import { track } from "@vercel/analytics";

// Client-side analytics tracking
export function trackChapterEvent(
  event: string,
  properties: Record<string, string | number | boolean> = {}
): void {
  track(event, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

// Predefined chapter operation events (client-safe subset)
export const ChapterEvents = {
  // Video events
  VIDEO_STARTED: "video_started",
  VIDEO_ENGAGEMENT: "video_engagement",
  VIDEO_ERROR: "video_error",
  VIDEO_TRANSCRIPT_TOGGLED: "video_transcript_toggled",
  VIDEO_RELATED_LINK_CLICKED: "video_related_link_clicked",
} as const;

export type ClientChapterEventType = typeof ChapterEvents[keyof typeof ChapterEvents];