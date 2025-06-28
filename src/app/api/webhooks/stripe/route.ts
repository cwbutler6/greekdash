import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { constructEvent, handleCheckoutSessionCompleted, handleSubscriptionUpdated, handleSubscriptionDeleted, handlePaymentIntentSucceeded } from "./handler";

/**
 * Stripe webhook handler for subscription events
 * 
 * This API route handles webhook events from Stripe, validating the signature
 * and dispatching to the appropriate handler functions based on event type.
 */
export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  try {
    // Verify the webhook signature and construct event
    event = await constructEvent(request) as unknown as Stripe.Event;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event as Stripe.Event);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event as Stripe.Event);
        break;
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event as unknown as Stripe.Event);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event);
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
