import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

/**
 * API to send reminder emails to students whose cohorts start in 24 hours
 * This can be called manually by admin or set up as a cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { sendReminderEmail } from '@/lib/email';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);

    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    // Find all cohorts starting tomorrow
    const cohorts = await prisma.cohort.findMany({
      where: withTenant({
        startDate: { gte: tomorrowStart, lte: tomorrowEnd },
        isPublished: true
      }, tenant),
      include: {
        program: true,
        enrollments: {
          where: {
            status: 'active'
          },
          include: {
            user: true
          }
        }
      }
    });

    let emailsSent = 0;
    let errors = 0;

    // Send reminder emails for each cohort
    for (const cohort of cohorts) {
      const startDate = format(cohort.startDate, "d 'de' MMMM 'de' yyyy", { locale: es });
      const startTime = format(cohort.startDate, 'HH:mm', { locale: es });

      for (const enrollment of cohort.enrollments) {
        try {
          const email = enrollment.user?.email || enrollment.guestEmail;
          const name = enrollment.user?.name || enrollment.guestName || 'Estudiante';

          if (email) {
            await sendReminderEmail(
              email,
              name,
              cohort.program.title,
              cohort.name,
              startDate,
              startTime,
              cohort.location,
              cohort.scheduleText
            );
            emailsSent++;
          }
        } catch (error) {
          console.error(`Error sending reminder to enrollment ${enrollment.id}:`, error);
          errors++;
        }
      }
    }

    return NextResponse.json({
      message: 'Recordatorios enviados exitosamente',
      cohortsFound: cohorts.length,
      emailsSent,
      errors
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: 'Error al enviar recordatorios' },
      { status: 500 }
    );
  }
}
