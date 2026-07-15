
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import {
  clearIdentifierFailures,
  isIdentifierRateLimited,
  normalizeEmail,
  recordIdentifierFailure,
} from './security';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-only-password', 10);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || '',
      clientSecret: process.env.APPLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        const email = normalizeEmail(credentials.email);
        if (isIdentifierRateLimited('login', email, 10, 15 * 60 * 1000)) {
          throw new Error('Credenciales inválidas');
        }

        const user = await prisma.user.findUnique({
          where: { email }
        });

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user?.password || DUMMY_PASSWORD_HASH
        );

        if (!user || !user.password || !isValidPassword) {
          recordIdentifierFailure('login', email, 15 * 60 * 1000);
          throw new Error('Credenciales inválidas');
        }

        // Check if email is verified - skip for OAuth users
        if (!user.emailVerified && user.password) {
          throw new Error('Por favor, verifica tu correo electrónico antes de iniciar sesión');
        }

        clearIdentifierFailures('login', email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, automatically verify email
      if (account?.provider !== 'credentials') {
        if (user.email) {
          await prisma.user.update({
            where: { email: user.email },
            data: { emailVerified: new Date() }
          });
        }
      }

      // Link any guest enrollments and orders to the new user account
      if (user.email && user.id) {
        const email = normalizeEmail(user.email);
        try {
          // Find all guest orders with this email
          const guestOrders = await prisma.order.findMany({
            where: {
              guestEmail: email,
              userId: null
            }
          });

          // Link guest orders to the user
          if (guestOrders.length > 0) {
            await prisma.order.updateMany({
              where: {
                guestEmail: email,
                userId: null
              },
              data: {
                userId: user.id
              }
            });
          }

          // Find all guest enrollments with this email
          const guestEnrollments = await prisma.enrollment.findMany({
            where: {
              guestEmail: email,
              userId: null
            }
          });

          // Link guest enrollments to the user
          if (guestEnrollments.length > 0) {
            await prisma.enrollment.updateMany({
              where: {
                guestEmail: email,
                userId: null
              },
              data: {
                userId: user.id
              }
            });
          }

          // Log the linking for debugging
          if (guestOrders.length > 0 || guestEnrollments.length > 0) {
            console.log(`✅ Vinculadas ${guestOrders.length} órdenes y ${guestEnrollments.length} inscripciones de invitado al usuario ${user.id} (${user.email})`);
          }
        } catch (error) {
          console.error('Error al vincular inscripciones de invitado:', error);
          // Continue with login even if linking fails
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      const userId = user?.id || token.id || token.sub;

      // Refresh authorization state whenever the JWT is evaluated so revoking
      // an administrator takes effect without waiting for the token to expire.
      if (userId) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, isAdmin: true },
        });

        token.id = currentUser?.id;
        token.isAdmin = currentUser?.isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || '';
        session.user.isAdmin = token.isAdmin === true;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET
};
