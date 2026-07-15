import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

/**
 * API to send reminder emails to all students enrolled in a specific cohort
 * This allows admin to manually send reminders for any cohort
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { sendReminderEmail } from '@/lib/email';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  try {
    const { cohortId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const cohort = await prisma.cohort.findFirst({
      where: withTenant({ id: cohortId }, tenant),
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

    if (!cohort) {
      return NextResponse.json(
        { error: 'Cohorte no encontrada' },
        { status: 404 }
      );
    }

    const startDate = format(cohort.startDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    const startTime = format(cohort.startDate, 'HH:mm', { locale: es });

    let emailsSent = 0;
    let errors = 0;

    // Send reminder emails to all enrolled students
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

    return NextResponse.json({
      message: 'Recordatorios enviados exitosamente',
      cohortName: cohort.name,
      emailsSent,
      errors
    });
  } catch (error) {
    console.error('Error sending cohort reminders:', error);
    return NextResponse.json(
      { error: 'Error al enviar recordatorios' },
      { status: 500 }
    );
  }
}
