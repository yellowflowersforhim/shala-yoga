import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit, isValidEmail, normalizeEmail } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, 'newsletter-unsubscribe', 20, 60 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const email = normalizeEmail(body.email);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      );
    }

    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: { email, ...(tenant ? { tenantId: tenant.tenantId } : {}) }
    });

    if (!subscriber || !subscriber.isActive) {
      return NextResponse.json({
        message: 'Si el email estaba suscrito, se ha procesado la desuscripción',
      });
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        isActive: false,
        unsubscribedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Te has desuscrito del newsletter exitosamente'
    });
  } catch (error) {
    console.error('Error al desuscribir del newsletter:', error);
    return NextResponse.json(
      { error: 'Error al procesar la desuscripción' },
      { status: 500 }
    );
  }
}
