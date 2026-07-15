import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { timingSafeEqual } from 'crypto';

// Email templates
const emailTemplates = {
  es: {
    subject: (programName: string) => `Recordatorio: ${programName} comienza pronto`,
    html: (participantName: string, programName: string, cohort: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ea580c; }
            .section-title { color: #ea580c; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .info-item { margin: 10px 0; padding-left: 20px; }
            .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Hola/Namaskaram ${participantName},</h1>
            </div>
            <div class="content">
              <p>Gracias por tu pago y bienvenido/a al <strong>${programName}</strong>. A continuación encontrarás información detallada sobre el programa.</p>
              
              <div class="highlight">
                <strong>⏰ Por favor, llega a tiempo ya que no se permitirá el acceso a personas que lleguen tarde.</strong><br/>
                Te recomendamos que llegues 10 minutos antes de que comience la clase.
              </div>

              <div class="section">
                <div class="section-title">📅 Fechas y Horarios</div>
                <div class="info-item">
                  <strong>Inicio:</strong> ${new Date(cohort.startDate).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}<br/>
                  <strong>Fin:</strong> ${new Date(cohort.endDate).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}<br/>
                  <strong>Horario:</strong> ${cohort.scheduleText}
                </div>
              </div>

              <div class="section">
                <div class="section-title">📍 Lugar</div>
                <div class="info-item">${cohort.location}</div>
              </div>

              <div class="section">
                <div class="section-title">📋 Requisitos de Clase</div>
                <div class="info-item">
                  <strong>Las prácticas deben realizarse con el estómago vacío. Estómago vacío significa:</strong><br/>
                  • 4 horas después de terminar una comida pesada<br/>
                  • 2.5 horas después de un tentempié (debe ser en lugar de una comida completa, no dentro de las 4 horas de una comida completa)<br/>
                  • 1.5 horas después de una bebida (excepto agua)
                </div>
              </div>

              <div class="section">
                <div class="section-title">👕 Vestimenta</div>
                <div class="info-item">
                  Se recomienda usar ropa cómoda (holgada) y traer tu propia esterilla de yoga, y un cojín si lo necesitas ya que estaremos sentados en el suelo.
                </div>
              </div>

              <div class="footer">
                <p><strong>Si tienes alguna pregunta, por favor contacta:</strong><br/>
                Email: ${process.env.SMTP_FROM || 'info@classicalhathayoga.com'}</p>
                <p>¡Esperamos verte allí!</p>
                <p style="margin-top: 20px;">Namaskaram 🙏</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },
  en: {
    subject: (programName: string) => `Reminder: ${programName} starts soon`,
    html: (participantName: string, programName: string, cohort: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ea580c; }
            .section-title { color: #ea580c; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .info-item { margin: 10px 0; padding-left: 20px; }
            .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Hello/Namaskaram ${participantName},</h1>
            </div>
            <div class="content">
              <p>Thank you for your payment and welcome to the <strong>${programName}</strong>. Please find below detailed information regarding the program.</p>
              
              <div class="highlight">
                <strong>⏰ Please arrive on time as latecomers may not be permitted into class.</strong><br/>
                We recommend that you arrive 10 minutes before class begins.
              </div>

              <div class="section">
                <div class="section-title">📅 Dates and Timings</div>
                <div class="info-item">
                  <strong>Start Date:</strong> ${new Date(cohort.startDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}<br/>
                  <strong>End Date:</strong> ${new Date(cohort.endDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}<br/>
                  <strong>Schedule:</strong> ${cohort.scheduleText}
                </div>
              </div>

              <div class="section">
                <div class="section-title">📍 Venue</div>
                <div class="info-item">${cohort.location}</div>
              </div>

              <div class="section">
                <div class="section-title">📋 Class Requirements</div>
                <div class="info-item">
                  <strong>Practices should be done on an empty stomach. Empty stomach means:</strong><br/>
                  • 4 hours after finishing a heavy meal<br/>
                  • 2.5 hours after a snack (should be in place of full meal, not within 4 hours of full meal)<br/>
                  • 1.5 hours after a beverage (except water)
                </div>
              </div>

              <div class="section">
                <div class="section-title">👕 Clothing</div>
                <div class="info-item">
                  It is recommended to wear comfortable (loose) clothing and to bring a yoga mat with you, and a cushion if needed as we will be sitting on the floor.
                </div>
              </div>

              <div class="footer">
                <p><strong>If you have any questions, please contact:</strong><br/>
                Email: ${process.env.SMTP_FROM || 'info@classicalhathayoga.com'}</p>
                <p>We look forward to seeing you there!</p>
                <p style="margin-top: 20px;">Namaskaram 🙏</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }
};

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get('authorization');
    const providedSecret = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';

    const isAuthorized = Boolean(configuredSecret && providedSecret) &&
      Buffer.byteLength(configuredSecret!) === Buffer.byteLength(providedSecret) &&
      timingSafeEqual(Buffer.from(configuredSecret!), Buffer.from(providedSecret));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active tenants and send reminders per-tenant
    const tenants = await prisma.tenant.findMany({ where: { status: 'active' }, select: { id: true, slug: true } });
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in47Hours = new Date(now.getTime() + 47 * 60 * 60 * 1000);

    let emailsSent = 0, errors = 0, cohortsProcessed = 0;

    for (const t of tenants) {
      const cohorts = await prisma.cohort.findMany({
        where: {
          tenantId: t.id,
          startDate: { gte: in47Hours, lte: in48Hours },
          reminderSent: false,
          isPublished: true
        },
        include: {
          program: true,
          enrollments: { where: { status: 'active' }, include: { user: true } }
        }
      });

      for (const cohort of cohorts) {
        const language = cohort.language || 'es';
        const template = emailTemplates[language as keyof typeof emailTemplates];

        for (const enrollment of cohort.enrollments) {
          try {
            const participantName = enrollment.user?.name || enrollment.guestName || 'Participant';
            const participantEmail = enrollment.user?.email || enrollment.guestEmail;
            if (!participantEmail) { errors++; continue; }
            await sendEmail({ to: participantEmail, subject: template.subject(cohort.program.title), html: template.html(participantName, cohort.program.title, cohort) });
            emailsSent++;
          } catch (error) { errors++; }
        }

        await prisma.cohort.update({ where: { id: cohort.id }, data: { reminderSent: true } });
        cohortsProcessed++;
      }
    }

    return NextResponse.json({
      success: true,
      cohortsProcessed,
      emailsSent,
      errors
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
