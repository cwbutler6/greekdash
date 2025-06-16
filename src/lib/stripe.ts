import Stripe from 'stripe';

/**
 * Stripe client for server-side operations
 * IMPORTANT: Only use this in server components or API routes
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-04-30.basil', // Use the latest stable API version
  typescript: true,
});

export default stripe;
