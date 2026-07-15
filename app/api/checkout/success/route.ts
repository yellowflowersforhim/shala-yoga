import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/security';
import { getStripeClient } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'checkout-success', 30, 60 * 1000);
  if (rateLimited) return rateLimited;

  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 400 });
  }

  try {
    // Retrieve Stripe session
    const checkoutSession = await getStripeClient().checkout.sessions.retrieve(sessionId);

    if (!checkoutSession || !checkoutSession.metadata?.orderId) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    // Look up Order by stripeCheckoutId
    const order = await prisma.order.findFirst({
      where: {
        stripeCheckoutId: checkoutSession.id,
        id: checkoutSession.metadata.orderId,
      },
      include: {
        enrollments: {
          select: {
            id: true,
            status: true,
            enrolledAt: true,
          },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const isPaid = order.status === 'paid';

    return NextResponse.json({
      paid: isPaid,
      order: {
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
      },
      enrollment: order.enrollments.length > 0
        ? {
            id: order.enrollments[0].id,
            status: order.enrollments[0].status,
            enrolledAt: order.enrollments[0].enrolledAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error retrieving checkout success details:', error);
    return NextResponse.json(
      { error: 'Error al recuperar detalles del pedido' },
      { status: 500 }
    );
  }
}
