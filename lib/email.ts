
import nodemailer from 'nodemailer';
import {
  enrollmentConfirmationTemplate,
  reminderEmailTemplate,
  completionThankYouTemplate,
  adminEnrollmentNotificationTemplate,
  EmailBrand,
} from './email-templates';
import { escapeHtml, isSafeHttpUrl } from './security';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Verifica tu correo electrónico - Classical Hatha Yoga',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Classical Hatha Yoga</h1>
            </div>
            <div class="content">
              <h2>¡Bienvenido!</h2>
              <p>Gracias por registrarte en Classical Hatha Yoga. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verificar correo electrónico</a>
              </div>
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p>Este enlace expirará en 24 horas.</p>
              <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
            </div>
            <div class="footer">
              <p>© 2025 Classical Hatha Yoga. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Restablecer contraseña - Classical Hatha Yoga',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Classical Hatha Yoga</h1>
            </div>
            <div class="content">
              <h2>Restablecer contraseña</h2>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer contraseña</a>
              </div>
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p>Este enlace expirará en 1 hora.</p>
              <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
            </div>
            <div class="footer">
              <p>© 2025 Classical Hatha Yoga. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPaymentConfirmationEmail(email: string, name: string, programTitle: string, cohortName: string, googleFormUrl: string) {
  const safeName = escapeHtml(name);
  const safeProgramTitle = escapeHtml(programTitle);
  const safeCohortName = escapeHtml(cohortName);
  const safeGoogleFormUrl = escapeHtml(isSafeHttpUrl(googleFormUrl) ? googleFormUrl : '');
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Confirmación de inscripción - ${programTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Pago confirmado!</h1>
            </div>
            <div class="content">
              <h2>Hola ${safeName},</h2>
              <p>¡Gracias por tu inscripción! Tu pago ha sido procesado exitosamente.</p>
              
              <div class="info-box">
                <strong>Detalles de tu inscripción:</strong><br>
                <strong>Programa:</strong> ${safeProgramTitle}<br>
                <strong>Intensivo:</strong> ${safeCohortName}
              </div>

              <h3>📋 Paso importante: Completa tu información</h3>
              <p>Para finalizar tu inscripción, necesitamos que completes el siguiente formulario con tu información personal:</p>
              
              <div style="text-align: center;">
                <a href="${safeGoogleFormUrl}" class="button">Completar formulario de inscripción</a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                O copia y pega este enlace en tu navegador:<br>
                <span style="word-break: break-all;">${safeGoogleFormUrl}</span>
              </p>

              <p><strong>Importante:</strong> Es necesario completar este formulario para poder asistir al intensivo.</p>

              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              
              <p>¡Nos vemos pronto en la práctica!</p>
            </div>
            <div class="footer">
              <p>© 2025 Classical Hatha Yoga. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const recipientEmail = data.email;
  data = {
    name: escapeHtml(data.name),
    email: escapeHtml(data.email),
    phone: data.phone ? escapeHtml(data.phone) : undefined,
    subject: escapeHtml(data.subject),
    message: escapeHtml(data.message),
  };
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  
  // Email to admin (you)
  const adminMailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: adminEmail,
    subject: `🔔 Nuevo mensaje de contacto: ${data.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .field { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #ea580c; display: block; margin-bottom: 5px; }
            .value { color: #333; }
            .message-box { background: #f9fafb; padding: 15px; border-left: 4px solid #ea580c; margin: 20px 0; white-space: pre-wrap; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Nuevo Mensaje de Contacto</h1>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">👤 Nombre:</span>
                <span class="value">${data.name}</span>
              </div>
              
              <div class="field">
                <span class="label">📧 Email:</span>
                <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
              </div>
              
              ${data.phone ? `
              <div class="field">
                <span class="label">📱 Teléfono:</span>
                <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
              </div>
              ` : ''}
              
              <div class="field">
                <span class="label">📋 Asunto:</span>
                <span class="value">${data.subject}</span>
              </div>
              
              <div class="field">
                <span class="label">💬 Mensaje:</span>
                <div class="message-box">${data.message}</div>
              </div>
              
              <p style="font-size: 12px; color: #666; margin-top: 20px;">
                📅 Recibido: ${new Date().toLocaleString('es-ES', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Classical Hatha Yoga. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  // Email confirmation to user
  const userMailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: recipientEmail,
    subject: 'Confirmación: Hemos recibido tu mensaje - Classical Hatha Yoga',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Mensaje Recibido!</h1>
            </div>
            <div class="content">
              <h2>Hola ${data.name},</h2>
              <p>Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
              
              <div class="info-box">
                <strong>📋 Resumen de tu mensaje:</strong><br><br>
                <strong>Asunto:</strong> ${data.subject}<br>
                <strong>Mensaje:</strong><br>
                <div style="margin-top: 10px; white-space: pre-wrap;">${data.message}</div>
              </div>

              <p>Normalmente respondemos en un plazo de 24-48 horas durante días laborables.</p>
              
              <p>Si tu consulta es urgente, también puedes contactarnos por WhatsApp.</p>
              
              <p><strong>Namaste</strong> 🙏</p>
              <p>Classical Hatha Yoga</p>
            </div>
            <div class="footer">
              <p>© 2025 Classical Hatha Yoga. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  // Send both emails
  await Promise.all([
    transporter.sendMail(adminMailOptions),
    transporter.sendMail(userMailOptions)
  ]);
}

/**
 * Send enrollment confirmation email (improved version with templates)
 */
export async function sendEnrollmentConfirmationEmail(
  email: string,
  name: string,
  programTitle: string,
  cohortName: string,
  startDate: string,
  location: string,
  scheduleText: string,
  googleFormUrl: string,
  brand?: EmailBrand,
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `✅ Inscripción confirmada - ${programTitle}`,
    html: enrollmentConfirmationTemplate(
      escapeHtml(name),
      escapeHtml(programTitle),
      escapeHtml(cohortName),
      escapeHtml(startDate),
      escapeHtml(location),
      escapeHtml(scheduleText),
      escapeHtml(isSafeHttpUrl(googleFormUrl) ? googleFormUrl : ''),
      brand,
    ),
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send reminder email 24h before cohort starts
 */
export async function sendReminderEmail(
  email: string,
  name: string,
  programTitle: string,
  cohortName: string,
  startDate: string,
  startTime: string,
  location: string,
  scheduleText: string,
  brand?: EmailBrand,
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `🔔 Recordatorio: ${programTitle} comienza mañana`,
    html: reminderEmailTemplate(
      escapeHtml(name),
      escapeHtml(programTitle),
      escapeHtml(cohortName),
      escapeHtml(startDate),
      escapeHtml(startTime),
      escapeHtml(location),
      escapeHtml(scheduleText),
      brand,
    ),
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send thank you email after cohort completion
 */
export async function sendCompletionThankYouEmail(
  email: string,
  name: string,
  programTitle: string,
  cohortName: string,
  brand?: EmailBrand,
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `🎉 ¡Felicitaciones por completar ${programTitle}!`,
    html: completionThankYouTemplate(
      escapeHtml(name),
      escapeHtml(programTitle),
      escapeHtml(cohortName),
      brand,
    ),
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send notification to admin about new enrollment
 */
export async function sendAdminEnrollmentNotification(
  studentName: string,
  studentEmail: string,
  programTitle: string,
  cohortName: string,
  orderNumber: string,
  amountPaid: string,
  isGuest: boolean = false,
  brand?: EmailBrand,
) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: adminEmail,
    subject: `🎉 Nueva inscripción: ${studentName} - ${programTitle}`,
    html: adminEnrollmentNotificationTemplate(
      escapeHtml(studentName),
      escapeHtml(studentEmail),
      escapeHtml(programTitle),
      escapeHtml(cohortName),
      escapeHtml(orderNumber),
      escapeHtml(amountPaid),
      isGuest,
      brand,
    ),
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Generic email sender for custom emails
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const mailOptions = {
    from: options.from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
}
