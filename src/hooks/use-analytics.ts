"use client";

import { useSession } from "next-auth/react";
import { 
  trackChapterEvent, 
  trackAuthEvent,
  trackMembershipEvent,
  trackFinanceEvent,
  ChapterEventType 
} from "@/lib/analytics";
import { useCallback, useMemo } from "react";

interface UseAnalyticsReturn {
  track: (event: ChapterEventType | string, properties?: Record<string, string | number | boolean>) => void;
  trackAuth: (event: ChapterEventType, properties?: Record<string, string | number | boolean>) => void;
  trackMembership: (event: ChapterEventType, properties?: Record<string, string | number | boolean>) => void;
  trackFinance: (event: ChapterEventType, amount?: number, properties?: Record<string, string | number | boolean>) => void;
}

interface UserContext {
  userId: string;
  chapterSlug: string;
  userRole: string;
}

export function useAnalytics(): UseAnalyticsReturn {
  const { data: session } = useSession();

  // Extract user context from session with proper type safety
  const userContext = useMemo((): UserContext | null => {
    if (!session?.user?.id || !session.user.memberships?.length) {
      return null;
    }

    // Get the primary membership (first one) or handle multiple memberships
    const primaryMembership = session.user.memberships[0];
    
    return {
      userId: session.user.id,
      chapterSlug: primaryMembership.chapterSlug,
      userRole: primaryMembership.role,
    };
  }, [session]);

  const track = useCallback(
    (event: ChapterEventType | string, properties: Record<string, string | number | boolean> = {}) => {
      if (!userContext) return;
      
      trackChapterEvent(event, {
        chapterSlug: userContext.chapterSlug,
        userId: userContext.userId,
        userRole: userContext.userRole,
        ...properties,
      });
    },
    [userContext]
  );

  const trackAuth = useCallback(
    (event: ChapterEventType, properties: Record<string, string | number | boolean> = {}) => {
      if (!userContext) return;
      
      trackAuthEvent(event, userContext.userId, userContext.chapterSlug, properties);
    },
    [userContext]
  );

  const trackMembership = useCallback(
    (event: ChapterEventType, properties: Record<string, string | number | boolean> = {}) => {
      if (!userContext) return;
      
      trackMembershipEvent(event, userContext.userId, userContext.chapterSlug, properties);
    },
    [userContext]
  );

  const trackFinance = useCallback(
    (event: ChapterEventType, amount?: number, properties: Record<string, string | number | boolean> = {}) => {
      if (!userContext) return;
      
      trackFinanceEvent(event, userContext.userId, userContext.chapterSlug, amount, properties);
    },
    [userContext]
  );

  return { track, trackAuth, trackMembership, trackFinance };
}