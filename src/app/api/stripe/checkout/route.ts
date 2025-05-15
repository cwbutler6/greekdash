import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

// Define request schema for type safety
const checkoutRequestSchema = z.object({
  chapterSlug: z.string().min(1),
  planId: z.string().min(1),
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
    const validationResult = checkoutRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { chapterSlug, planId, returnUrl } = validationResult.data;
    
    // Get user and verify membership/permission
    const user = await prisma.user.findUnique({
      where: { email: authSession.user.email as string },
      include: {
        memberships: {
          where: { 
            chapter: { slug: chapterSlug },
            role: { in: ['ADMIN', 'OWNER'] } // Only admin/owner can upgrade
          },
          include: { chapter: true }
        }
      }
    });
    
    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { error: 'You do not have permission to upgrade this chapter' },
        { status: 403 }
      );
    }
    
    // Get the chapter details
    const chapter = user.memberships[0].chapter;
    
    // Check if we need to get current subscription for future use
    // Uncomment if needed for checking current plan or other logic
    // const subscription = await prisma.subscription.findUnique({
    //   where: { chapterId: chapter.id }
    // });
    
    // Set up the Stripe price ID based on selected plan
    let priceId: string = '';
    
    // Define fallback price data when environment variables are not set
    const usePriceData = !process.env.STRIPE_BASIC_PRICE_ID || !process.env.STRIPE_PRO_PRICE_ID;
    
    // Type definition for Stripe price data that matches Stripe API requirements
    type Interval = 'day' | 'week' | 'month' | 'year';
    
    interface StripePriceData {
      currency: string;
      product_data: {
        name: string;
        description: string;
      };
      unit_amount: number;
      recurring: {
        interval: Interval;
      };
    }
    
    let priceData: StripePriceData | null = null;
    
    switch (planId) {
      case 'basic':
        if (usePriceData) {
          priceData = {
            currency: 'usd',
            product_data: {
              name: 'GreekDash Basic Plan',
              description: 'Monthly subscription to GreekDash Basic features'
            },
            unit_amount: 2900, // $29.00 USD
            recurring: {
              interval: 'month' as Interval
            }
          };
        } else {
          priceId = process.env.STRIPE_BASIC_PRICE_ID as string;
        }
        break;
      case 'pro':
        if (usePriceData) {
          priceData = {
            currency: 'usd',
            product_data: {
              name: 'GreekDash Pro Plan',
              description: 'Monthly subscription to GreekDash Pro features'
            },
            unit_amount: 5900, // $59.00 USD
            recurring: {
              interval: 'month' as Interval
            }
          };
        } else {
          priceId = process.env.STRIPE_PRO_PRICE_ID as string;
        }
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid plan selected' },
          { status: 400 }
        );
    }
    
    // Ensure Stripe customer exists for the chapter
    let customerId = chapter.stripeCustomerId;
    
    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email as string,
        name: chapter.name,
        metadata: {
          chapterId: chapter.id,
          chapterSlug: chapter.slug
        }
      });
      
      customerId = customer.id;
      
      // Update chapter with Stripe customer ID
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { stripeCustomerId: customerId }
      });
    }
    
    // Create the checkout session with explicit handling for missing price IDs
    let checkoutSession;
    
    try {
      if (usePriceData && priceData) {
        // If we're using dynamically generated price data
        checkoutSession = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [{
            price_data: priceData,
            quantity: 1,
          }],
          mode: 'subscription',
          success_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${chapterSlug}/settings?checkout=success`,
          cancel_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${chapterSlug}/settings?checkout=canceled`,
          subscription_data: {
            metadata: {
              chapterId: chapter.id,
              chapterSlug: chapter.slug
            },
          },
          metadata: {
            chapterId: chapter.id,
            chapterSlug: chapter.slug
          }
        });
      } else if (priceId) {
        // If we're using predefined price IDs
        checkoutSession = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [{
            price: priceId,
            quantity: 1,
          }],
          mode: 'subscription',
          success_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${chapterSlug}/settings?checkout=success`,
          cancel_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${chapterSlug}/settings?checkout=canceled`,
          subscription_data: {
            metadata: {
              chapterId: chapter.id,
              chapterSlug: chapter.slug
            },
          },
          metadata: {
            chapterId: chapter.id,
            chapterSlug: chapter.slug
          }
        });
      } else {
        throw new Error('Unable to create checkout session: missing price configuration');
      }    
    } catch (checkoutError) {
      console.error('Error in Stripe checkout session creation:', checkoutError);
      throw checkoutError;
    }
    
    // Return the session URL
    return NextResponse.json({ url: checkoutSession.url });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
