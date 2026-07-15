
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  enforceRateLimit,
  getPasswordValidationError,
  hashPurposeToken,
} from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, 'reset-password', 10, 15 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

    // Find the token
    const storedToken = hashPurposeToken('password-reset', token);
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: storedToken }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({
        where: { token: storedToken }
      });
      return NextResponse.json(
        { error: 'El token ha expirado' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Consume the token and update the password atomically.
    await prisma.$transaction(async (tx) => {
      await tx.verificationToken.delete({ where: { token: storedToken } });
      await tx.user.update({
        where: { email: verificationToken.identifier },
        data: { password: hashedPassword },
      });
    });

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Error al restablecer la contraseña' },
      { status: 500 }
    );
  }
}
