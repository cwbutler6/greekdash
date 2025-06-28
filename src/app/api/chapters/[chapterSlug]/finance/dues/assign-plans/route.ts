import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireChapterAdmin } from '@/lib/auth';

const assignPlansSchema = z.object({
  duesPlanId: z.string(),
  assignmentType: z.enum(['individual', 'role', 'all']),
  memberIds: z.array(z.string()).optional(),
  roles: z.array(z.enum(['MEMBER', 'ADMIN', 'OWNER'])).optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    const body = await request.json();
    
    // Auth check
    const { membership } = await requireChapterAdmin(chapterSlug);
    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validatedData = assignPlansSchema.parse(body);
    const { duesPlanId, assignmentType, memberIds, roles, notes } = validatedData;

    // Get target members based on assignment type
    let targetMembers;
    
    if (assignmentType === 'all') {
      targetMembers = await prisma.membership.findMany({
        where: { chapterId: membership.chapterId },
        include: { user: true },
      });
    } else if (assignmentType === 'role') {
      targetMembers = await prisma.membership.findMany({
        where: {
          chapterId: membership.chapterId,
          role: { in: roles },
        },
        include: { user: true },
      });
    } else {
      targetMembers = await prisma.membership.findMany({
        where: {
          chapterId: membership.chapterId,
          userId: { in: memberIds },
        },
        include: { user: true },
      });
    }

    // Create plan assignments
    const assignments = await Promise.all(
      targetMembers.map(member =>
        prisma.duesPlanAssignment.upsert({
          where: {
            duesPlanId_userId_chapterId: {
              duesPlanId,
              userId: member.userId,
              chapterId: membership.chapterId,
            },
          },
          update: {
            isActive: true,
            assignedBy: membership.userId,
            notes,
          },
          create: {
            duesPlanId,
            userId: member.userId,
            chapterId: membership.chapterId,
            assignedBy: membership.userId,
            notes,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      assignedCount: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error('Error assigning plans:', error);
    return NextResponse.json(
      { error: 'Failed to assign plans' },
      { status: 500 }
    );
  }
}