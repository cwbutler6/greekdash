import { prisma } from "@/lib/db";
import Stripe from "stripe";
import { Prisma } from "@/generated/prisma";

type IdempotencyResult = {
  shouldProcess: boolean;
  isRetry: boolean;
  webhookEventId: string;
};

/**
 * Ensures webhook event idempotency by tracking processed events
 */
export async function ensureWebhookIdempotency(
  event: Stripe.Event
): Promise<IdempotencyResult> {
  const stripeEventId = event.id;
  const eventType = event.type;
  
  try {
    // Try to create a new webhook event record
    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        stripeEventId,
        eventType,
        processed: false,
        attempts: 1,
        metadata: {
          stripeCreated: event.created,
          livemode: event.livemode,
        },
      },
    });
    
    return {
      shouldProcess: true,
      isRetry: false,
      webhookEventId: webhookEvent.id,
    };
  } catch (error) {
    // If unique constraint fails, event already exists
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      // Find the existing event
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { stripeEventId },
      });
      
      if (!existingEvent) {
        throw new Error('Webhook event not found after constraint error');
      }
      
      // If already processed, skip
      if (existingEvent.processed) {
        return {
          shouldProcess: false,
          isRetry: false,
          webhookEventId: existingEvent.id,
        };
      }
      
      // If not processed, increment attempts and retry
      await prisma.webhookEvent.update({
        where: { id: existingEvent.id },
        data: {
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
      
      return {
        shouldProcess: true,
        isRetry: true,
        webhookEventId: existingEvent.id,
      };
    }
    
    throw error;
  }
}

/**
 * Marks a webhook event as successfully processed
 */
export async function markWebhookProcessed(
  webhookEventId: string,
  metadata?: Prisma.InputJsonValue
): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: {
      processed: true,
      processedAt: new Date(),
      errorMessage: null,
      metadata,
    },
  });
}

/**
 * Marks a webhook event as failed
 */
export async function markWebhookFailed(
  webhookEventId: string,
  errorMessage: string
): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: {
      errorMessage,
      lastAttemptAt: new Date(),
    },
  });
}