# Stripe Integration Setup

## Environment Variables

Add the following variables to your `.env` file:

```
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # Your Stripe Secret Key (keep this private!)
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe Publishable Key
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe Webhook Secret (for webhook validation)

# Use test keys for development, and live keys for production
# Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys
```

## Getting Your Stripe API Keys

1. Create a [Stripe account](https://dashboard.stripe.com/register) if you don't have one
2. Navigate to the [API keys section](https://dashboard.stripe.com/apikeys) in your Stripe Dashboard
3. Copy your **Publishable key** and **Secret key**
4. For webhook secret:
   - Go to [Webhooks](https://dashboard.stripe.com/webhooks) in your Stripe Dashboard
   - Click "Add endpoint"
   - Enter your webhook URL (e.g., `https://yourdomain.com/api/webhooks/stripe`)
   - Select events to listen for (common ones: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`)
   - After creation, reveal and copy the webhook signing secret

## Security Best Practices

- Never expose your Stripe Secret Key or Webhook Secret on the client side
- Always use server-side API routes for Stripe operations
- Validate all webhook events using the webhook secret
- Use Stripe's test mode during development
