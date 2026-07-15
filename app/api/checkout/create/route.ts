import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
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
    const rateLimited = enforceRateLimit(request, 'checkout-create', 10, 10 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const session = await getServerSession(authOptions);
    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();

    const { cohortId, couponCode, guestName, guestEmail, guestPhone } = body;
    const isAuthenticated = !!session?.user;

    // Validate required fields
    if (!cohortId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    if (!isAuthenticated && (!guestName || !guestEmail)) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (nombre y email del invitado)' },
        { status: 400 }
      );
    }

    // Sanitize guest fields
    const sanitizedGuestName = cleanText(guestName || '', 100);
    const sanitizedGuestEmail = normalizeEmail(guestEmail || '');
    const sanitizedGuestPhone = cleanText(guestPhone || '', 40) || null;

    // Validate guest email
    if (!isAuthenticated) {
      if (!isValidEmail(sanitizedGuestEmail)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        );
      }
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

    // Check duplicate enrollment
    if (isAuthenticated) {
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          userId: session.user.id,
          cohortId
        }
      });

      if (existingEnrollment) {
        return NextResponse.json(
          { error: 'Ya estás inscrito en este intensivo' },
          { status: 400 }
        );
      }
    } else {
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          cohortId,
          guestEmail: sanitizedGuestEmail
        }
      });

      if (existingEnrollment) {
        return NextResponse.json(
          { error: 'Este email ya está inscrito en este intensivo' },
          { status: 400 }
        );
      }
    }

    // Validate coupon
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
        userId: isAuthenticated ? session.user.id : null,
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
        guestName: isAuthenticated ? null : sanitizedGuestName,
        guestEmail: isAuthenticated ? null : sanitizedGuestEmail,
        guestPhone: isAuthenticated ? null : sanitizedGuestPhone,
      }
    });
    createdOrderId = order.id;

    // Create Stripe checkout session
    const checkoutSession = await getStripeClient().checkout.sessions.create({
      payment_method_types: totalCents > 0 ? ['card'] : undefined,
      customer_email: isAuthenticated ? undefined : sanitizedGuestEmail,
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
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout/cancel`,
      metadata: {
        orderId: order.id,
        cohortId,
        ...(isAuthenticated ? {} : { isGuest: 'true' })
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
    console.error('Checkout create error:', error);
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
