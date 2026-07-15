import { NextRequest, NextResponse } from 'next/server';
import { saveStripeAccountId } from '@/lib/stripe-connect';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // tenantId

  if (!code || !state) {
    return NextResponse.redirect(new URL('/workspace/stripe?error=missing_params', request.url));
  }

  try {
    // Exchange authorization code for connected account ID via Stripe API
    const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-06-30.acacia' as any }));
    const response = await stripe.oauth.token({ grant_type: 'authorization_code', code });

    if (response.stripe_user_id) {
      await saveStripeAccountId(state, response.stripe_user_id);
    }

    return NextResponse.redirect(new URL('/workspace/stripe?success=1', request.url));
  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(new URL('/workspace/stripe?error=auth_failed', request.url));
  }
}
