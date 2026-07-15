
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma, getDefaultTenantId } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { generateOrderNumber, isEnrollmentOpen } from '@/lib/format';
import { validateCoupon } from '@/lib/coupons';
import { enforceRateLimit } from '@/lib/security';
import { getStripeClient } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  let createdOrderId: string | null = null;
  try {
    const rateLimited = enforceRateLimit(request, 'authenticated-checkout', 10, 10 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const { cohortId, couponCode } = body;
    const userId = session.user.id;

    if (!cohortId || !userId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Get cohort with program
    const cohort = await prisma.cohort.findFirst({
      where: withTenant({ id: cohortId, isPublished: true }, tenant),
      include: {
        program: true,
        enrollments: {
          where: { status: 'active' }
        }
      }
    });

    if (!cohort || !cohort.isPublished) {
      return NextResponse.json(
        { error: 'Cohorte no disponible' },
        { status: 400 }
      );
    }

    // Check enrollment window
    if (!isEnrollmentOpen(cohort.enrollmentOpensAt, cohort.enrollmentClosesAt)) {
      return NextResponse.json(
        { error: 'Las inscripciones están cerradas' },
        { status: 400 }
      );
    }

    // Check seat availability
    const enrolledCount = cohort.enrollments?.length ?? 0;
    if (enrolledCount >= cohort.maxSeats) {
      return NextResponse.json(
        { error: 'No hay plazas disponibles' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        cohortId
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este intensivo' },
        { status: 400 }
      );
    }

    const couponResult = couponCode
      ? await validateCoupon(couponCode, cohort.program.priceCents, tenant?.tenantId)
      : null;

    if (couponResult && !couponResult.valid) {
      return NextResponse.json({ error: couponResult.error }, { status: couponResult.status });
    }

    const appliedCoupon = couponResult?.valid ? couponResult.coupon : null;
    const discountCents = appliedCoupon?.discountCents ?? 0;
    const totalCents = cohort.program.priceCents - discountCents;

    // Create order
    const orderNumber = generateOrderNumber();
    const order = await prisma.order.create({
      data: {
        userId,
        cohortId,
        tenantId: cohort.tenantId || (await getDefaultTenantId()),
        orderNumber,
        status: 'pending',
        subtotalCents: cohort.program.priceCents,
        discountCents,
        totalCents,
        currency: cohort.program.currency,
        couponId: appliedCoupon?.id ?? null,
        couponCode: appliedCoupon?.code ?? null,
      }
    });
    createdOrderId = order.id;

    // Create Stripe checkout session
    const checkoutSession = await getStripeClient().checkout.sessions.create({
      payment_method_types: totalCents > 0 ? ['card'] : undefined,
      line_items: [
        {
          price_data: {
            currency: cohort.program.currency.toLowerCase(),
            product_data: {
              name: cohort.program.title,
              description: `${cohort.name} - ${cohort.program.description.substring(0, 100)}`
            },
            unit_amount: totalCents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout/${cohortId}?payment=cancelled`,
      metadata: {
        orderId: order.id,
        cohortId
      }
    });

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeCheckoutId: checkoutSession.id
      }
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      orderId: order.id
    });
  } catch (error) {
    console.error('Checkout error:', error);
    if (createdOrderId) {
      await prisma.order.update({
        where: { id: createdOrderId },
        data: { status: 'failed' },
      }).catch((updateError) => console.error('Failed to mark order as failed:', updateError));
    }
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}
