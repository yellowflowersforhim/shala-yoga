import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  sendEnrollmentConfirmationEmail,
  sendAdminEnrollmentNotification
} from '@/lib/email';
import { EmailBrand } from '@/lib/email-templates';
import { syncEnrollmentToMailerlite } from '@/lib/mailerlite';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { getStripeClient } from '@/lib/stripe';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Webhook idempotency: check if this Stripe event was already processed
    const alreadyProcessed = await prisma.paymentWebhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (alreadyProcessed) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { orderId } = session.metadata || {};

      if (!orderId) {
        console.error('Missing metadata in session');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { cohort: true },
        });

        if (!order || order.stripeCheckoutId !== session.id) {
          throw new Error('Stripe session does not match the order');
        }

        const amountMatches = session.amount_total === order.totalCents;
        const currencyMatches = session.currency?.toUpperCase() === order.currency.toUpperCase();
        const isPaid = session.payment_status === 'paid' ||
          (session.payment_status === 'no_payment_required' && order.totalCents === 0);

        if (!amountMatches || !currencyMatches || !isPaid) {
          throw new Error('Stripe payment details do not match the order');
        }

        if (order.status === 'paid') return { order, enrollment: null };

        // Atomic capacity check — re-verify capacity inside transaction
        const cohortForCapacity = await tx.cohort.findUnique({
          where: { id: order.cohortId },
          include: { enrollments: { where: { status: 'active' } } },
        });
        if (cohortForCapacity && cohortForCapacity.enrollments.length >= cohortForCapacity.maxSeats) {
          throw new Error('Capacity exceeded — cohort is full');
        }

        const enrollment = await tx.enrollment.create({
          data: {
            userId: order.userId,
            cohortId: order.cohortId,
            orderId: order.id,
            tenantId: order.tenantId,
            status: 'active',
            guestName: order.userId ? null : order.guestName,
            guestEmail: order.userId ? null : order.guestEmail,
          },
          include: {
            user: true,
            cohort: { include: { program: true } },
          },
        });

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'paid',
            stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            paidAt: new Date(),
          },
          include: { cohort: { include: { program: true } } },
        });

        // Atomic conditional coupon increment to prevent over-claiming
        if (order.couponId) {
          const coupon = await tx.coupon.findUnique({ where: { id: order.couponId } });
          if (coupon && (coupon.maxUses === null || coupon.usedCount < coupon.maxUses)) {
            await tx.coupon.update({
              where: { id: order.couponId },
              data: { usedCount: { increment: 1 } },
            });
          }
        }

        return { order: updatedOrder, enrollment };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      if (!result.enrollment) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      const { order, enrollment } = result;

      // Fetch tenant brand for branded email templates
      let brand: EmailBrand | undefined;
      try {
        const theme = await prisma.brandTheme.findUnique({ where: { tenantId: order.tenantId! } });
        if (theme) {
          brand = {
            primaryColor: theme.primaryColor ?? undefined,
            primaryColorDark: theme.primaryColor ?? undefined,
          };
        }
      } catch {
        // Fall through to default brand
      }

      const isGuestPurchase = order.userId === null;

      if (isGuestPurchase) {
        // Send confirmation email to guest
        if (enrollment.guestEmail && enrollment.cohort) {
          try {
            const googleFormUrl = process.env.GOOGLE_FORM_URL || 'https://docs.google.com/forms/d/e/your-form-id/viewform';
            const startDate = format(new Date(enrollment.cohort.startDate), "d 'de' MMMM 'de' yyyy", { locale: es });

            await sendEnrollmentConfirmationEmail(
              enrollment.guestEmail,
              enrollment.guestName || 'Estudiante',
              enrollment.cohort.program?.title || 'Programa de Yoga',
              enrollment.cohort.name || 'Intensivo',
              startDate,
              enrollment.cohort.location || 'Por confirmar',
              enrollment.cohort.scheduleText || 'Por confirmar',
              googleFormUrl,
              brand,
            );

            // Send notification to admin
            const amountPaid = `€${(order.totalCents / 100).toFixed(2)}`;
            await sendAdminEnrollmentNotification(
              enrollment.guestName || 'Estudiante',
              enrollment.guestEmail,
              enrollment.cohort.program?.title || 'Programa de Yoga',
              enrollment.cohort.name || 'Intensivo',
              order.orderNumber,
              amountPaid,
              true, // isGuest
              brand,
            );

            // Sync to Mailerlite
            await syncEnrollmentToMailerlite(
              enrollment.guestEmail,
              enrollment.guestName || 'Estudiante',
              enrollment.cohort.program?.title || 'Programa de Yoga',
              enrollment.cohort.name || 'Intensivo'
            );
          } catch (emailError) {
            console.error('Error sending confirmation email to guest:', emailError);
          }
        }
      } else {
        // Send confirmation email to authenticated user
        if (enrollment.user?.email && enrollment.cohort) {
          try {
            const googleFormUrl = process.env.GOOGLE_FORM_URL || 'https://docs.google.com/forms/d/e/your-form-id/viewform';
            const startDate = format(new Date(enrollment.cohort.startDate), "d 'de' MMMM 'de' yyyy", { locale: es });

            await sendEnrollmentConfirmationEmail(
              enrollment.user.email,
              enrollment.user.name || 'Estudiante',
              enrollment.cohort.program?.title || 'Programa de Yoga',
              enrollment.cohort.name || 'Intensivo',
              startDate,
              enrollment.cohort.location || 'Por confirmar',
              enrollment.cohort.scheduleText || 'Por confirmar',
              googleFormUrl,
              brand,
            );

            // Send notification to admin
            const amountPaid = `€${(order.totalCents / 100).toFixed(2)}`;
            await sendAdminEnrollmentNotification(
              enrollment.user.name || 'Estudiante',
              enrollment.user.email,
              enrollment.cohort.program?.title || 'Programa de Yoga',
              enrollment.cohort.name || 'Intensivo',
              order.orderNumber,
              amountPaid,
              false, // not guest
              brand,
            );

            // Sync to Mailerlite
            await syncEnrollmentToMailerlite(
              enrollment.user.email,
              enrollment.user.name || 'Estudiante',
              enrollment.cohort.program?.title || 'Programa de Yoga',
              enrollment.cohort.name || 'Intensivo'
            );
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
          }
        }
      }

      console.log('Enrollment created successfully:', enrollment.id);
    }

    // Store processed Stripe event ID for idempotency
    await prisma.paymentWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        orderId: (event.data.object as Stripe.Checkout.Session)?.metadata?.orderId ?? null,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
