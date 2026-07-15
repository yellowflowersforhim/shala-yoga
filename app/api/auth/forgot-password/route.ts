
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import {
  createOpaqueToken,
  enforceRateLimit,
  hashPurposeToken,
  isValidEmail,
  normalizeEmail,
} from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, 'forgot-password', 5, 15 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const email = normalizeEmail(body.email);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json({
        message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña'
      });
    }

    // Generate reset token
    const resetToken = createOpaqueToken();
    const storedToken = hashPurposeToken('password-reset', resetToken);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store the token in the VerificationToken table
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { identifier: email } }),
      prisma.verificationToken.create({
        data: {
          identifier: email,
          token: storedToken,
          expires: resetTokenExpiry,
        },
      }),
    ]);

    // Send email
    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({
      message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
