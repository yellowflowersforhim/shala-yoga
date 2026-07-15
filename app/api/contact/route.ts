
import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormEmail } from '@/lib/email';
import {
  cleanText,
  enforceRateLimit,
  isValidEmail,
  normalizeEmail,
} from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(req, 'contact-form', 5, 60 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const name = cleanText(body.name, 100);
    const email = normalizeEmail(body.email);
    const phone = cleanText(body.phone, 40) || undefined;
    const subject = cleanText(body.subject, 160).replace(/[\r\n]+/g, ' ');
    const message = cleanText(body.message, 5000);

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser completados' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Por favor, introduce un email válido' },
        { status: 400 }
      );
    }

    // Send emails (to admin and confirmation to user)
    try {
      await sendContactFormEmail({
        name,
        email,
        phone,
        subject,
        message
      });

      console.log('Contact form submission successful:', {
        name,
        email,
        subject,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Mensaje enviado correctamente. Te responderemos pronto.'
      });
    } catch (emailError) {
      console.error('Error sending contact form email:', emailError);
      
      // Log the error but provide a user-friendly message
      return NextResponse.json(
        { error: 'Hubo un problema al enviar el mensaje. Por favor, inténtalo de nuevo o contáctanos por WhatsApp.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Error al procesar el formulario de contacto' },
      { status: 500 }
    );
  }
}
