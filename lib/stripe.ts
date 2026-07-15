import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error('STRIPE_SECRET_KEY is not configured');

  stripeClient = new Stripe(apiKey, {
    apiVersion: '2025-10-29.clover',
  });
  return stripeClient;
}

