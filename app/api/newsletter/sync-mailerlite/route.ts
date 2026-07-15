
/**
 * API to sync newsletter subscriber to Mailerlite
 * This is called when someone subscribes via the newsletter form
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncEnrollmentToMailerlite } from '@/lib/mailerlite';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isValidEmail, normalizeEmail } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const email = normalizeEmail(body.email);
    const { name } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      );
    }

    // Sync to Mailerlite (general newsletter list)
    const result = await syncEnrollmentToMailerlite(
      email,
      name || 'Suscriptor',
      'Newsletter General',
      'Suscripción web'
    );

    if (result.success) {
      return NextResponse.json({
        message: 'Suscriptor sincronizado con Mailerlite',
        result
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Error al sincronizar con Mailerlite',
          details: result.error 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error syncing to Mailerlite:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar con Mailerlite' },
      { status: 500 }
    );
  }
}
