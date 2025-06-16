import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

// Initialize Stripe - use type assertion to work with different Stripe versions
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  apiVersion: '2025-05-28.basil' as any, // Type assertion to work across environments
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

export async function POST(
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

    const { chapter } = access;

    // Check if the chapter has Stripe configured
    if (!chapter.stripeCustomerId) {
      return NextResponse.json(
        { error: 'This chapter has not set up Stripe payments' },
        { status: 400 }
      );
    }

    // Get the payment record
    const payment = await prisma.duesPayment.findFirst({
      where: {
        id: paymentId,
        chapterId: chapter.id
      },
      include: {
        user: true,
        duesPlan: true
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'PAID') {
      return NextResponse.json({ error: 'Payment has already been paid' }, { status: 400 });
    }

    // Use the chapter's Stripe customer ID for billing
    const stripeCustomerId = chapter.stripeCustomerId;
    
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'Chapter has not configured Stripe payments' },
        { status: 400 }
      );
    }

    // Create a payment link with Stripe
    const paymentDescription = payment.duesPlan
      ? `${payment.duesPlan.name} - ${chapter.name}`
      : `Dues Payment - ${chapter.name}`;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: paymentDescription,
              description: `Due date: ${payment.dueDate.toLocaleDateString()}`,
            },
            unit_amount: Math.round(payment.amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${chapterSlug}/portal?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${chapterSlug}/portal?payment=canceled`,
      metadata: {
        paymentId: payment.id,
        chapterId: chapter.id,
        userId: payment.userId,
      },
    });

    // Update the payment record with Stripe checkout URL
    const updatedPayment = await prisma.duesPayment.update({
      where: { id: payment.id },
      data: {
        stripeCheckoutUrl: checkoutSession.url,
      }
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}
