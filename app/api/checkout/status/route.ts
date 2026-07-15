import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanText, enforceRateLimit } from '@/lib/security';
import { getStripeClient } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'checkout-status', 30, 60 * 1000);
  if (rateLimited) return rateLimited;

  const sessionId = cleanText(request.nextUrl.searchParams.get('sessionId'), 255);
  if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 400 });
  }

  try {
    const checkoutSession = await getStripeClient().checkout.sessions.retrieve(sessionId);
    const orderId = checkoutSession.metadata?.orderId;
    if (!orderId) return NextResponse.json({ error: 'Sesión inválida' }, { status: 404 });

    const order = await prisma.order.findFirst({
      where: { id: orderId, stripeCheckoutId: checkoutSession.id },
      select: { totalCents: true, currency: true },
    });
    if (!order) return NextResponse.json({ error: 'Sesión inválida' }, { status: 404 });

    const amountMatches = checkoutSession.amount_total === order.totalCents;
    const currencyMatches = checkoutSession.currency?.toUpperCase() === order.currency.toUpperCase();
    const isPaid = checkoutSession.payment_status === 'paid' ||
      (checkoutSession.payment_status === 'no_payment_required' && order.totalCents === 0);

    return NextResponse.json({ paid: Boolean(amountMatches && currencyMatches && isPaid) });
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return NextResponse.json({ error: 'No se pudo verificar el pago' }, { status: 400 });
  }
}
