
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPurposeToken } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 400 }
      );
    }

    // Find the token
    const storedToken = hashPurposeToken('email-verification', token);
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: storedToken }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token inválido o ya utilizado. Si ya verificaste tu email, puedes iniciar sesión.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({
        where: { token: storedToken }
      });
      return NextResponse.json(
        { error: 'El token ha expirado. Solicita un nuevo email de verificación.' },
        { status: 400 }
      );
    }

    // Check if user is already verified
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
      select: { emailVerified: true }
    });

    if (user?.emailVerified) {
      // Delete the token since it's no longer needed
      await prisma.verificationToken.delete({
        where: { token: storedToken }
      });
      
      return NextResponse.json({
        message: 'Tu email ya ha sido verificado. Puedes iniciar sesión.',
        alreadyVerified: true
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.verificationToken.delete({ where: { token: storedToken } });
      await tx.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      });
    });

    return NextResponse.json({
      message: 'Email verificado exitosamente'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Error al verificar el email' },
      { status: 500 }
    );
  }
}
