import { NextRequest, NextResponse } from "next/server";
import { constructEvent, handleCheckoutSessionCompleted, handleSubscriptionUpdated, handleSubscriptionDeleted, handlePaymentIntentSucceeded, WebhookResponse } from "./handler";
import { ensureWebhookIdempotency, markWebhookProcessed, markWebhookFailed } from "@/lib/webhook-idempotency";

/**
 * Stripe webhook handler for subscription events
 * 
 * This API route handles webhook events from Stripe, validating the signature
 * and dispatching to the appropriate handler functions based on event type.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const { success, error, event } = await constructEvent(req);
    
    if (!success || !event) {
      console.error("Webhook signature verification failed:", error);
      return NextResponse.json({ error }, { status: 400 });
    }

    // Ensure idempotency
    const { shouldProcess, isRetry, webhookEventId } = await ensureWebhookIdempotency(event);
    
    if (!shouldProcess) {
      console.log(`Webhook event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, message: "Already processed" });
    }
    
    if (isRetry) {
      console.log(`Retrying webhook event ${event.id}`);
    }

    let result: WebhookResponse;

    // Process the event based on type
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        result = await handleSubscriptionUpdated(event);
        break;
      case "customer.subscription.deleted":
        result = await handleSubscriptionDeleted(event);
        break;
      case "checkout.session.completed":
        result = await handleCheckoutSessionCompleted(event);
        break;
      case "payment_intent.succeeded":
        result = await handlePaymentIntentSucceeded(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
        result = { success: true, message: `Unhandled event type: ${event.type}` };
    }

    if (result.success) {
      // Mark as processed
      await markWebhookProcessed(webhookEventId, {
        eventType: event.type,
        processedResult: result.message,
      });
      
      return NextResponse.json({ received: true, message: result.message });
    } else {
      // Mark as failed
      await markWebhookFailed(webhookEventId, result.error || "Unknown error");
      
      console.error(`Webhook processing failed for ${event.id}:`, result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook processing error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
