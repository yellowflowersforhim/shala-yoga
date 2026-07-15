
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';
import {
  cleanText,
  createOpaqueToken,
  enforceRateLimit,
  getPasswordValidationError,
  hashPurposeToken,
  isValidEmail,
  normalizeEmail,
} from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, 'signup', 5, 15 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const name = cleanText(body.name, 100);
    const email = normalizeEmail(body.email);
    const password = body.password;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.password && !existingUser.emailVerified) {
        const verificationToken = createOpaqueToken();
        const storedToken = hashPurposeToken('email-verification', verificationToken);

        await prisma.$transaction([
          prisma.verificationToken.deleteMany({ where: { identifier: email } }),
          prisma.verificationToken.create({
            data: {
              identifier: email,
              token: storedToken,
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          }),
        ]);
        await sendVerificationEmail(email, verificationToken);

        return NextResponse.json({
          message: 'Te hemos enviado un nuevo enlace de verificación.',
        });
      }

      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true
      }
    });

    // Generate verification token
    const verificationToken = createOpaqueToken();
    const storedToken = hashPurposeToken('email-verification', verificationToken);
    const tokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours from now

    // Store the token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: storedToken,
        expires: tokenExpiry
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue even if email fails - user is created
    }

    return NextResponse.json(
      { message: 'Usuario creado exitosamente. Por favor, verifica tu correo electrónico.', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    );
  }
}
