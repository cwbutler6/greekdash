import { track } from "@vercel/analytics";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

interface BaseAnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
}

interface ServerAnalyticsEvent extends BaseAnalyticsEvent {
  chapterSlug?: string;
  userId?: string;
}

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

// Server-side analytics tracking with chapter context
export async function trackServerChapterEvent({
  event,
  chapterSlug,
  userId,
  properties = {},
}: ServerAnalyticsEvent): Promise<void> {
  try {
    const session = await getServerSession(authOptions);
    
    // Extract chapter context from user's memberships with proper null checks
    const userMembership = session?.user?.memberships?.[0]; // Get primary membership
    const contextChapterSlug = chapterSlug || userMembership?.chapterSlug;
    const contextUserId = userId || session?.user?.id;
    const userRole = userMembership?.role;
    
    // Only track if we have required context
    if (!contextChapterSlug || !contextUserId) {
      console.warn('Analytics tracking skipped: missing required context', {
        chapterSlug: contextChapterSlug,
        userId: contextUserId,
      });
      return;
    }
    
    track(event, {
      chapterSlug: contextChapterSlug,
      userId: contextUserId,
      ...(userRole && { userRole }),
      ...properties,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to track server analytics event:", error);
  }
}

// Predefined chapter operation events
export const ChapterEvents = {
  // Authentication
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  USER_REGISTER: "user_register",
  
  // Membership
  MEMBER_INVITED: "member_invited",
  MEMBER_JOINED: "member_joined",
  MEMBER_ACTIVATED: "member_activated",
  MEMBER_DEACTIVATED: "member_deactivated",
  
  // Events
  EVENT_CREATED: "event_created",
  EVENT_UPDATED: "event_updated",
  EVENT_DELETED: "event_deleted",
  EVENT_RSVP: "event_rsvp",
  
  // Finance
  EXPENSE_CREATED: "expense_created",
  EXPENSE_APPROVED: "expense_approved",
  EXPENSE_REJECTED: "expense_rejected",
  DUES_PAYMENT: "dues_payment",
  DONATION_RECEIVED: "donation_received",
  
  // Gallery
  PHOTO_UPLOADED: "photo_uploaded",
  PHOTO_DELETED: "photo_deleted",
  
  // Subscription
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  SUBSCRIPTION_DOWNGRADED: "subscription_downgraded",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
} as const;

export type ChapterEventType = typeof ChapterEvents[keyof typeof ChapterEvents];

// Helper functions for common tracking patterns
export function trackAuthEvent(
  event: ChapterEventType,
  userId: string,
  chapterSlug: string,
  properties: Record<string, string | number | boolean> = {}
): void {
  // Ensure required values are defined before tracking
  if (!userId || !chapterSlug) {
    console.warn('Auth event tracking skipped: missing required parameters');
    return;
  }
  
  trackChapterEvent(event, {
    userId,
    chapterSlug,
    category: "authentication",
    ...properties,
  });
}

export function trackMembershipEvent(
  event: ChapterEventType,
  userId: string,
  chapterSlug: string,
  properties: Record<string, string | number | boolean> = {}
): void {
  // Ensure required values are defined before tracking
  if (!userId || !chapterSlug) {
    console.warn('Membership event tracking skipped: missing required parameters');
    return;
  }
  
  trackChapterEvent(event, {
    userId,
    chapterSlug,
    category: "membership",
    ...properties,
  });
}

export function trackFinanceEvent(
  event: ChapterEventType,
  userId: string,
  chapterSlug: string,
  amount?: number,
  properties: Record<string, string | number | boolean> = {}
): void {
  // Ensure required values are defined before tracking
  if (!userId || !chapterSlug) {
    console.warn('Finance event tracking skipped: missing required parameters');
    return;
  }
  
  trackChapterEvent(event, {
    userId,
    chapterSlug,
    category: "finance",
    ...(amount !== undefined && { amount }),
    ...properties,
  });
}

export function trackSubscriptionEvent(
  event: ChapterEventType,
  chapterSlug: string,
  tier: string,
  properties: Record<string, string | number | boolean> = {}
): void {
  trackChapterEvent(event, {
    chapterSlug,
    category: "subscription",
    tier,
    ...properties,
  });
}