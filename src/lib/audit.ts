import prisma from '@/lib/prisma';

export type AuditAction = 
  // Auth related
  | 'user.login'
  | 'user.logout'
  | 'user.password_changed'
  | 'user.profile_updated'
  
  // Member related
  | 'member.invited'
  | 'member.invitation_accepted'
  | 'member.role_changed'
  | 'member.removed'
  
  // Chapter related
  | 'chapter.settings_updated'
  | 'chapter.subscription_changed'
  
  // Events related
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'event.rsvp_created'
  | 'event.rsvp_updated';

export type AuditTargetType = 
  | 'user'
  | 'chapter'
  | 'membership'
  | 'event'
  | 'rsvp'
  | 'invite'
  | 'subscription';

/**
 * Create an audit log entry
 */
export async function logAuditEntry({
  userId,
  chapterId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  userId: string;
  chapterId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    // Using JSON.stringify for the metadata to ensure it's compatible with Prisma's JSON field
    await prisma.auditLog.create({
      data: {
        userId,
        chapterId,
        action,
        targetType,
        targetId,
        // Convert to JSON string and then back to ensure Prisma compatibility
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
    // We don't want to throw errors here to prevent disrupting the user flow
    // Just log the error and continue
  }
}

/**
 * Get audit logs with pagination and filtering options
 */
export async function getAuditLogs({
  chapterId,
  userId,
  action,
  targetType,
  page = 1,
  limit = 20,
  fromDate,
  toDate,
}: {
  chapterId: string;
  userId?: string;
  action?: string;
  targetType?: string;
  page?: number;
  limit?: number;
  fromDate?: Date;
  toDate?: Date;
}) {
  const skip = (page - 1) * limit;
  
  // Build the where clause based on provided filters
  const where: {
    chapterId: string;
    userId?: string;
    action?: string;
    targetType?: string;
    createdAt?: {
      gte?: Date;
      lte?: Date;
    };
  } = { chapterId };
  
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  
  // Add date range filtering if provided
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }
  
  // Get the total count for pagination
  const totalCount = await prisma.auditLog.count({ where });
  
  // Fetch the audit logs with relations
  const auditLogs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  });
  
  return {
    data: auditLogs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}
