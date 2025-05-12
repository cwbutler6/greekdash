import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";

// Stripe webhook handler for subscription events
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature") as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
    console.error(`Error handling webhook: ${errorMessage}`);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 }
    );
  }
}

// Helper function to update subscription status in the database
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
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

// Helper function to handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
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
