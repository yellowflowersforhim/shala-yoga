import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import {
  cleanText,
  enforceRateLimit,
  isValidEmail,
  normalizeEmail,
} from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenant = await getTenantFromRequest(request.headers);

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';

    if (isPublic) {
      const feedback = await db.feedback.findMany({
        where: withTenant({
          isPublic: true,
          rating: { gte: 4 },
        }, tenant),
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        select: {
          id: true,
          name: true,
          rating: true,
          message: true,
          createdAt: true,
        },
      });

      return NextResponse.json(feedback);
    }

    // Admin endpoint to get all feedback
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const feedback = await db.feedback.findMany({
      where: withTenant({}, tenant),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        cohort: {
          select: {
            name: true,
            program: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Error al obtener feedback' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, 'feedback', 5, 60 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const session = await getServerSession(authOptions);
    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const name = cleanText(body.name, 100);
    const email = normalizeEmail(body.email);
    const rating = Number(body.rating);
    const message = cleanText(body.message, 5000);
    const cohortId = cleanText(body.cohortId, 100) || null;
    const requestedEnrollmentId = cleanText(body.enrollmentId, 100) || null;
    const allowedCategories = new Set(['general', 'instructor', 'content', 'platform']);
    const category = allowedCategories.has(body.category) ? body.category : 'general';

    if (!name || !email || !rating || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email) || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Datos de feedback inválidos' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'La calificación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    let enrollmentId: string | null = null;
    let resolvedCohortId = cohortId;
    if (requestedEnrollmentId) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Debes iniciar sesión para asociar una inscripción' }, { status: 401 });
      }

      const enrollment = await db.enrollment.findFirst({
        where: { id: requestedEnrollmentId, userId: session.user.id },
        select: { id: true, cohortId: true },
      });

      if (!enrollment || (cohortId && cohortId !== enrollment.cohortId)) {
        return NextResponse.json({ error: 'Inscripción no válida' }, { status: 400 });
      }
      enrollmentId = enrollment.id;
      resolvedCohortId = enrollment.cohortId;
    } else if (cohortId) {
      const cohort = await db.cohort.findFirst({
        where: { id: cohortId, isPublished: true },
        select: { id: true },
      });
      if (!cohort) {
        return NextResponse.json({ error: 'Intensivo no válido' }, { status: 400 });
      }
    }

    const feedback = await db.feedback.create({
      data: {
        tenantId: tenant?.tenantId || '',
        userId: session?.user?.id || null,
        name,
        email,
        rating,
        category,
        message,
        cohortId: resolvedCohortId,
        enrollmentId,
      },
    });

    // Create notification for admin
    const admins = await db.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await db.notification.create({
        data: {
          tenantId: tenant?.tenantId || 'ahora-hatha-yoga',
          userId: admin.id,
          type: 'new_feedback',
          title: 'Nuevo feedback recibido',
          message: `${name} ha dejado un feedback con ${rating} estrellas`,
          link: '/admin/feedback',
        },
      });
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json({ error: 'Error al crear feedback' }, { status: 500 });
  }
}
