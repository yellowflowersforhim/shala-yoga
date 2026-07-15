/**
 * Stripe Connect integration for Shala.
 *
 * Per D-003: Each teacher owns their Stripe Standard account.
 * Shala uses Stripe Connect (destination charges) to process payments
 * on the teacher's behalf and deducts a platform application fee.
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { TenantContext } from '@/lib/tenant';

const platformStripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.acacia' as any,
});

const PLATFORM_FEE_PERCENT = 10;

/** Create a Stripe Connect checkout session on the teacher's connected account. */
export async function createConnectCheckout(params: {
  tenant: TenantContext;
  stripeAccountId: string;
  programTitle: string;
  cohortName: string;
  description: string;
  totalCents: number;
  currency: string;
  orderId: string;
  cohortId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const { stripeAccountId, programTitle, cohortName, description, totalCents, currency, orderId, cohortId, successUrl, cancelUrl } = params;
  const applicationFeeCents = Math.round((totalCents * PLATFORM_FEE_PERCENT) / 100);

  return platformStripe.checkout.sessions.create(
    {
      payment_method_types: totalCents > 0 ? ['card'] : undefined,
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: programTitle, description: `${cohortName} - ${description.substring(0, 100)}` },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orderId, cohortId, tenantId: params.tenant.tenantId },
      payment_intent_data: {
        application_fee_amount: applicationFeeCents > 0 ? applicationFeeCents : undefined,
        metadata: { orderId, tenantId: params.tenant.tenantId },
      },
    },
    { stripeAccount: stripeAccountId }
  );
}

/** Generate a Stripe Connect OAuth onboarding link for a teacher. */
export function generateConnectOnboardingLink(tenantId: string): string {
  const clientId = process.env.STRIPE_CLIENT_ID || '';
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    client_id: clientId,
    state: tenantId,
    'stripe_user[country]': 'ES',
    'stripe_user[product]': 'standard',
    'stripe_user[business_type]': 'individual',
    redirect_uri: `${baseUrl}/api/stripe/connect/callback`,
  });
  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}

/** Store the connected Stripe account ID for a tenant. */
export async function saveStripeAccountId(tenantId: string, stripeAccountId: string): Promise<void> {
  await prisma.tenant.update({ where: { id: tenantId }, data: { stripeAccountId } });
}

/** Get the connected Stripe account ID for a tenant. */
export async function getStripeAccountId(tenantId: string): Promise<string | null> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { stripeAccountId: true } });
  return tenant?.stripeAccountId ?? null;
}

/** Calculate platform fee for a transaction. */
export function calculatePlatformFee(totalCents: number): { platformFeeCents: number; teacherReceivesCents: number } {
  const platformFeeCents = Math.round((totalCents * PLATFORM_FEE_PERCENT) / 100);
  return { platformFeeCents, teacherReceivesCents: totalCents - platformFeeCents };
}
