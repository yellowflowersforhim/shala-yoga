import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

/**
 * API to send completion thank you emails to students whose cohorts have ended
 * This can be called manually by admin or set up as a cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { sendCompletionThankYouEmail } from '@/lib/email';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);

    const yesterday = subDays(new Date(), 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    // Find all cohorts that ended yesterday
    const cohorts = await prisma.cohort.findMany({
      where: withTenant({
        endDate: { gte: yesterdayStart, lte: yesterdayEnd },
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

    // Send completion thank you emails for each cohort
    for (const cohort of cohorts) {
      for (const enrollment of cohort.enrollments) {
        try {
          const email = enrollment.user?.email || enrollment.guestEmail;
          const name = enrollment.user?.name || enrollment.guestName || 'Estudiante';

          if (email) {
            await sendCompletionThankYouEmail(
              email,
              name,
              cohort.program.title,
              cohort.name
            );
            emailsSent++;

            // Update enrollment status to completed
            await prisma.enrollment.update({
              where: { id: enrollment.id },
              data: { status: 'completed' }
            });
          }
        } catch (error) {
          console.error(`Error sending completion email to enrollment ${enrollment.id}:`, error);
          errors++;
        }
      }
    }

    return NextResponse.json({
      message: 'Emails de agradecimiento enviados exitosamente',
      cohortsFound: cohorts.length,
      emailsSent,
      errors
    });
  } catch (error) {
    console.error('Error sending completion emails:', error);
    return NextResponse.json(
      { error: 'Error al enviar emails de agradecimiento' },
      { status: 500 }
    );
  }
}
