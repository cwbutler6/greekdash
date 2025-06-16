import Stripe from 'stripe';

/**
 * Stripe client for server-side operations
 * IMPORTANT: Only use this in server components or API routes
 */
// Use type assertion to make this work across environments with different Stripe versions
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  apiVersion: '2025-05-28.basil' as any, // Type assertion to work with both local and Vercel environments
  typescript: true,
});

export default stripe;
