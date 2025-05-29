import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Schema for assigning dues
const assignDuesSchema = z.object({
  duesPlanId: z.string().min(1, 'Dues plan is required'),
  memberIds: z.array(z.string()).min(1, 'At least one member must be selected'),
  dueDate: z.string().or(z.date()),
  notes: z.string().optional(),
  customAmount: z.number().optional(),
  useCustomAmount: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check admin status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get chapter
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug }
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = assignDuesSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { 
      duesPlanId, 
      memberIds, 
      dueDate, 
      notes, 
      customAmount,
      useCustomAmount 
    } = validationResult.data;

    // Check if dues plan exists and belongs to this chapter
    const duesPlan = await prisma.duesPlan.findFirst({
      where: {
        id: duesPlanId,
        chapterId: chapter.id
      }
    });

    if (!duesPlan) {
      return NextResponse.json({ error: 'Dues plan not found' }, { status: 404 });
    }

    // Verify all members belong to this chapter
    const memberships = await prisma.membership.findMany({
      where: {
        chapterId: chapter.id,
        userId: { in: memberIds },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (memberships.length !== memberIds.length) {
      return NextResponse.json({ error: 'Some members do not belong to this chapter' }, { status: 400 });
    }

    // Create dues payments for each member
    const duesPayments = await Promise.all(
      memberships.map(async (membership) => {
        return prisma.duesPayment.create({
          data: {
            amount: useCustomAmount && customAmount !== undefined ? customAmount : duesPlan.amount,
            dueDate: new Date(dueDate),
            notes: notes || null,
            chapterId: chapter.id,
            userId: membership.userId,
            duesPlanId: duesPlan.id,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      count: duesPayments.length,
      duesPayments,
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning dues:', error);
    return NextResponse.json(
      { error: 'Failed to assign dues' },
      { status: 500 }
    );
  }
}
