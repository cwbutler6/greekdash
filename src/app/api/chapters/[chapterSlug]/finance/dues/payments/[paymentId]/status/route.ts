import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Schema for updating payment status
const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'WAIVED', 'OVERDUE']),
  notes: z.string().optional(),
});

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string; paymentId: string }> }
) {
  try {
    const { chapterSlug, paymentId } = await params;
    
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkAdminAccess(chapterSlug, session.user.email);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateStatusSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { status, notes } = validationResult.data;

    // Check if the payment exists and belongs to this chapter
    const payment = await prisma.duesPayment.findFirst({
      where: {
        id: paymentId,
        chapterId: access.chapter.id
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    const updatedPayment = await prisma.duesPayment.update({
      where: { id: paymentId },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : (status === 'WAIVED' ? new Date() : payment.paidAt),
        notes: notes !== undefined ? (payment.notes ? `${payment.notes}\n\n${notes}` : notes) : payment.notes
      }
    });

    // If payment is now marked as paid, create a transaction record
    if (status === 'PAID' && !payment.paidAt) {
      await prisma.transaction.create({
        data: {
          amount: payment.amount,
          type: 'DUES_PAYMENT',
          description: `Dues payment: ${payment.duesPlanId ? 'Plan payment' : 'Manual payment'}${notes ? ` - ${notes}` : ''}`,
          processedAt: new Date(),
          chapterId: access.chapter.id,
          duesPaymentId: payment.id,
        }
      });
    }

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
