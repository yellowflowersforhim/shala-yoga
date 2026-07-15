import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { cleanText, enforceRateLimit } from '@/lib/security';

const ALLOWED_EVENTS = new Set([
  'landing',
  'view_cohort',
  'start_checkout',
  'complete_payment',
]);

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, 'conversion-tracking', 60, 60 * 1000);
    if (rateLimited) return rateLimited;

    const session = await getServerSession(authOptions);
    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const sessionId = cleanText(body.sessionId, 128);
    const eventType = cleanText(body.eventType, 50);
    const cohortId = cleanText(body.cohortId, 100) || null;
    const eventData = body.eventData;

    if (!sessionId || !ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json(
        { error: 'sessionId y eventType son requeridos' },
        { status: 400 }
      );
    }

    // Get user agent and IP
    const userAgent = cleanText(request.headers.get('user-agent'), 500) || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') || 
                      undefined;

    const serializedEventData = eventData === undefined ? null : JSON.stringify(eventData);
    if (serializedEventData && serializedEventData.length > 4000) {
      return NextResponse.json({ error: 'eventData es demasiado grande' }, { status: 400 });
    }

    await db.conversionEvent.create({
      data: {
        sessionId,
        userId: session?.user?.id || null,
        eventType,
        cohortId,
        tenantId: tenant?.tenantId || '',
        eventData: serializedEventData,
        userAgent,
        ipAddress,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    return NextResponse.json({ error: 'Error al registrar evento' }, { status: 500 });
  }
}
