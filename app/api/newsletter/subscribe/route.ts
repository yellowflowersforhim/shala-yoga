import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncEnrollmentToMailerlite } from '@/lib/mailerlite';
import {
  cleanText,
  enforceRateLimit,
  isValidEmail,
  normalizeEmail,
} from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, 'newsletter-subscribe', 10, 60 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const tenant = await getTenantFromRequest(request.headers);

    const email = normalizeEmail(body.email);
    const name = cleanText(body.name, 100) || null;

    if (!email) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await prisma.newsletterSubscriber.findFirst({
      where: { email, ...(tenant ? { tenantId: tenant.tenantId } : {}) }
    });

    if (existing) {
      // Si existe pero está inactivo, reactivarlo
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            name: name || existing.name,
            subscribedAt: new Date(),
            unsubscribedAt: null
          }
        });

        await syncEnrollmentToMailerlite(
          email,
          name || existing.name || 'Suscriptor',
          'Newsletter General',
          'Suscripción web'
        );

        return NextResponse.json({
          message: '¡Te has suscrito nuevamente al newsletter!',
          subscriber: { email, name }
        });
      }

      return NextResponse.json(
        { error: 'Este email ya está suscrito' },
        { status: 400 }
      );
    }

    // Crear nuevo suscriptor
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        name: name || null,
        tenantId: tenant?.tenantId || '',
      }
    });

    // Sync to Mailerlite (asynchronous, don't block response)
    try {
      const syncResult = await syncEnrollmentToMailerlite(
        email,
        name || 'Suscriptor',
        'Newsletter General',
        'Suscripción web'
      );

      if (!syncResult.success) {
        console.error('Failed to sync to Mailerlite, but subscriber was saved locally');
      }
    } catch (syncError) {
      console.error('Error syncing to Mailerlite:', syncError);
      // Don't fail the subscription if Mailerlite sync fails
    }

    return NextResponse.json({
      message: '¡Gracias por suscribirte al newsletter!',
      subscriber: {
        email: subscriber.email,
        name: subscriber.name
      }
    });
  } catch (error) {
    console.error('Error al suscribir al newsletter:', error);
    return NextResponse.json(
      { error: 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
}
