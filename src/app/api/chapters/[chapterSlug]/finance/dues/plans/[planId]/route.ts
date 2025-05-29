import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Validation schema for updating a dues plan
const duesPlanUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive').optional(),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL']).optional(),
  isActive: z.boolean().optional(),
  applyToNewMembers: z.boolean().optional(),
});

// Helper function to check admin access
async function checkAdminAccess(chapterSlug: string, userEmail: string) {
  // Get user and check admin status
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      memberships: {
        where: { 
          chapter: { slug: chapterSlug },
          role: { in: ['ADMIN', 'OWNER'] }
        }
      }
    }
  });

  if (!user || user.memberships.length === 0) {
    return null;
  }

  // Get chapter
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug }
  });

  if (!chapter) {
    return null;
  }

  return { user, chapter };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string; planId: string }> }
) {
  try {
    const { chapterSlug, planId } = await params;
    
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkAdminAccess(chapterSlug, session.user.email);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get the dues plan
    const duesPlan = await prisma.duesPlan.findFirst({
      where: {
        id: planId,
        chapterId: access.chapter.id
      }
    });

    if (!duesPlan) {
      return NextResponse.json({ error: 'Dues plan not found' }, { status: 404 });
    }

    return NextResponse.json(duesPlan);
  } catch (error) {
    console.error('Error fetching dues plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dues plan' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string; planId: string }> }
) {
  try {
    const { chapterSlug, planId } = await params;
    
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkAdminAccess(chapterSlug, session.user.email);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if the dues plan exists and belongs to this chapter
    const existingPlan = await prisma.duesPlan.findFirst({
      where: {
        id: planId,
        chapterId: access.chapter.id
      }
    });

    if (!existingPlan) {
      return NextResponse.json({ error: 'Dues plan not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = duesPlanUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Update the dues plan
    const updatedPlan = await prisma.duesPlan.update({
      where: { id: planId },
      data: validationResult.data
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating dues plan:', error);
    return NextResponse.json(
      { error: 'Failed to update dues plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string; planId: string }> }
) {
  try {
    const { chapterSlug, planId } = await params;
    
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkAdminAccess(chapterSlug, session.user.email);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if the dues plan exists and belongs to this chapter
    const existingPlan = await prisma.duesPlan.findFirst({
      where: {
        id: planId,
        chapterId: access.chapter.id
      }
    });

    if (!existingPlan) {
      return NextResponse.json({ error: 'Dues plan not found' }, { status: 404 });
    }

    // Delete the dues plan
    await prisma.duesPlan.delete({
      where: { id: planId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dues plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete dues plan' },
      { status: 500 }
    );
  }
}
