import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

// Define request schema for type safety
const portalRequestSchema = z.object({
  chapterSlug: z.string().min(1),
  returnUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authSession = await getServerSession(authOptions);
    
    if (!authSession?.user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = portalRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { chapterSlug, returnUrl } = validationResult.data;
    
    // Get user and verify membership/permission
    const user = await prisma.user.findUnique({
      where: { email: authSession.user.email as string },
      include: {
        memberships: {
          where: { 
            chapter: { slug: chapterSlug },
            role: { in: ['ADMIN', 'OWNER'] } // Only admin/owner can manage billing
          },
          include: { chapter: true }
        }
      }
    });
    
    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { error: 'You do not have permission to manage billing for this chapter' },
        { status: 403 }
      );
    }
    
    // Get the chapter details
    const chapter = user.memberships[0].chapter;
    
    // Ensure chapter has a Stripe customer ID
    if (!chapter.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found for this chapter' },
        { status: 400 }
      );
    }
    
    // Create Stripe customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: chapter.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/${chapterSlug}/admin`,
    });
    
    // Return the portal URL
    return NextResponse.json({ url: portalSession.url });
    
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
