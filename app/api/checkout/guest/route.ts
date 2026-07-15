
import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDefaultTenantId } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { generateOrderNumber, isEnrollmentOpen } from '@/lib/format';
import { validateCoupon } from '@/lib/coupons';
import {
  cleanText,
  enforceRateLimit,
  isValidEmail,
  normalizeEmail,
} from '@/lib/security';
import { getStripeClient } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  let createdOrderId: string | null = null;
  try {
    const rateLimited = enforceRateLimit(request, 'guest-checkout', 10, 10 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const cohortId = cleanText(body.cohortId, 100);
    const guestName = cleanText(body.guestName, 100);
    const guestEmail = normalizeEmail(body.guestEmail);
    const guestPhone = cleanText(body.guestPhone, 40) || null;
    const couponCode = body.couponCode;

    // Validation
    if (!cohortId || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Email validation
    if (!isValidEmail(guestEmail)) {
      return NextResponse.json(
        { error: 'Email inválido' },
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
        { error: 'Intensivo no disponible' },
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

    // Check if guest email is already enrolled in this cohort
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        cohortId,
        guestEmail: guestEmail
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Este email ya está inscrito en este intensivo' },
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

    // Create order with guest information
    const orderNumber = generateOrderNumber();
    const order = await prisma.order.create({
      data: {
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
        guestName,
        guestEmail,
        guestPhone
      }
    });
    createdOrderId = order.id;

    // Create Stripe checkout session
    const checkoutSession = await getStripeClient().checkout.sessions.create({
      payment_method_types: totalCents > 0 ? ['card'] : undefined,
      customer_email: guestEmail,
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
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout/${cohortId}?payment=cancelled`,
      metadata: {
        orderId: order.id,
        cohortId,
        isGuest: 'true'
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
    console.error('Guest checkout error:', error);
    if (createdOrderId) {
      await prisma.order.update({
        where: { id: createdOrderId },
        data: { status: 'failed' },
      }).catch((updateError) => console.error('Failed to mark guest order as failed:', updateError));
    }
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}
