import { logAuditEntry } from '@/lib/audit';

/**
 * Example of how to integrate audit logging in API routes or server actions
 * These are example implementations that can be used throughout the application
 */

/**
 * Log user login
 */
export async function logUserLogin(userId: string, chapterId: string) {
  await logAuditEntry({
    userId,
    chapterId,
    action: 'user.login',
    targetType: 'user',
    targetId: userId,
    metadata: {
      timestamp: new Date().toISOString(),
      method: 'credentials',
    },
  });
}

/**
 * Log user profile update
 */
export async function logProfileUpdate(userId: string, chapterId: string, changedFields: string[]) {
  await logAuditEntry({
    userId,
    chapterId,
    action: 'user.profile_updated',
    targetType: 'user',
    targetId: userId,
    metadata: {
      changedFields,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log member invitation
 */
export async function logMemberInvited(
  userId: string, 
  chapterId: string, 
  inviteId: string, 
  invitedEmail: string,
  role: string
) {
  await logAuditEntry({
    userId,
    chapterId,
    action: 'member.invited',
    targetType: 'invite',
    targetId: inviteId,
    metadata: {
      invitedEmail,
      role,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log event creation
 */
export async function logEventCreated(
  userId: string,
  chapterId: string,
  eventId: string,
  eventTitle: string
) {
  await logAuditEntry({
    userId,
    chapterId,
    action: 'event.created',
    targetType: 'event',
    targetId: eventId,
    metadata: {
      eventTitle,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log event RSVP
 */
export async function logEventRsvp(
  userId: string,
  chapterId: string,
  eventId: string,
  rsvpId: string,
  status: string
) {
  await logAuditEntry({
    userId,
    chapterId,
    action: 'event.rsvp_created',
    targetType: 'rsvp',
    targetId: rsvpId,
    metadata: {
      eventId,
      status,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log chapter settings update
 */
export async function logChapterSettingsUpdate(
  userId: string,
  chapterId: string,
  changedSettings: Record<string, unknown>
) {
  await logAuditEntry({
    userId,
    chapterId,
    action: 'chapter.settings_updated',
    targetType: 'chapter',
    targetId: chapterId,
    metadata: {
      changedSettings,
      timestamp: new Date().toISOString(),
    },
  });
}
