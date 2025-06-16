import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { financeService } from "@/lib/services/finance-service";

/**
 * Verifies and constructs a Stripe event from the incoming webhook
 */
export async function constructEvent(request: NextRequest): Promise<Stripe.Event> {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature") as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook secret is not configured");
  }

  try {
    // Verify the webhook signature
    return stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    throw new Error(`Webhook signature verification failed: ${errorMessage}`);
  }
}

/**
 * Handles Stripe subscription changes (created or updated)
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const { customer, status, items } = subscription;
  const priceId = items.data[0]?.price.id;
  
  // Map Stripe plan to our subscription plan (this mapping should match your Stripe products/prices)
  let plan: "FREE" | "BASIC" | "PRO" = "FREE";
  
  // Example mapping based on Price IDs - adjust according to your Stripe setup
  if (priceId) {
    if (priceId.includes("pro")) {
      plan = "PRO";
    } else if (priceId.includes("basic")) {
      plan = "BASIC";
    }
  }
  
  // Convert Stripe status to SubscriptionStatus enum
  const mapStripeStatusToPrismaStatus = (stripeStatus: string) => {
    switch (stripeStatus.toUpperCase()) {
      case 'ACTIVE':
        return 'ACTIVE';
      case 'PAST_DUE':
        return 'PAST_DUE';
      case 'CANCELED':
        return 'CANCELED';
      case 'TRIALING':
        return 'TRIALING';
      case 'INCOMPLETE':
        return 'INCOMPLETE';
      default:
        // Default to ACTIVE if status doesn't match any enum value
        console.warn(`Unknown subscription status: ${stripeStatus}, defaulting to ACTIVE`);
        return 'ACTIVE';
    }
  };
  
  // Map the Stripe status to our enum value
  const subscriptionStatus = mapStripeStatusToPrismaStatus(status);

  try {
    // Find the chapter by Stripe customer ID
    const chapter = await prisma.chapter.findFirst({
      where: { stripeCustomerId: customer as string },
    });

    if (!chapter) {
      console.error(`No chapter found for Stripe customer: ${customer}`);
      return;
    }

    // Update or create subscription
    await prisma.subscription.upsert({
      where: { chapterId: chapter.id },
      update: {
        plan,
        status: subscriptionStatus,
        stripeSubscriptionId: subscription.id,
      },
      create: {
        plan,
        status: subscriptionStatus,
        stripeSubscriptionId: subscription.id,
        chapter: { connect: { id: chapter.id } },
      },
    });
    
    console.log(`Updated subscription for chapter: ${chapter.slug}`);
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

/**
 * Handles subscription deletion by setting plan to FREE and status to CANCELED
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const { customer } = subscription;
  
  try {
    // Find the chapter by Stripe customer ID
    const chapter = await prisma.chapter.findFirst({
      where: { stripeCustomerId: customer as string },
    });

    if (!chapter) {
      console.error(`No chapter found for Stripe customer: ${customer}`);
      return;
    }

    // Update subscription to FREE plan with INACTIVE status
    await prisma.subscription.update({
      where: { chapterId: chapter.id },
      data: {
        plan: "FREE",
        status: "CANCELED",
        stripeSubscriptionId: subscription.id,
      },
    });
    
    console.log(`Marked subscription as canceled for chapter: ${chapter.slug}`);
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
    throw error;
  }
}

/**
 * Handles completed checkout sessions for dues payments
 */
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  try {
    // Only process checkout sessions with successful payments
    if (session.payment_status !== "paid" || !session.metadata?.duesPaymentId) {
      return;
    }

    console.log(`Processing dues payment for session: ${session.id}`);
    
    // Process the payment using our finance service
    await financeService.processStripePayment(session.id);
    
    console.log(`Successfully processed dues payment for session: ${session.id}`);
  } catch (error) {
    console.error(`Error processing checkout session ${session.id}:`, error);
    throw error;
  }
}

/**
 * Handles successful payment intents (backup handler for webhooks)
 */
export async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    // Check if this payment intent is for a dues payment by looking at the metadata
    if (!paymentIntent.metadata?.duesPaymentId || !paymentIntent.metadata?.chapterId) {
      // Not a dues payment or doesn't have necessary metadata
      return;
    }

    // Get the dues payment and chapter details
    const duesPaymentId = paymentIntent.metadata.duesPaymentId;
    
    // Update the dues payment status to PAID
    await prisma.duesPayment.update({
      where: { id: duesPaymentId },
      data: { 
        status: "PAID",
        stripePaymentId: paymentIntent.id, // Use the correct field name as per schema
        paidAt: new Date()
      }
    });
    
    console.log(`Updated dues payment ${duesPaymentId} to PAID status`);
  } catch (error) {
    console.error(`Error processing payment intent ${paymentIntent.id}:`, error);
    throw error;
  }
}
