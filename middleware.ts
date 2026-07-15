import { withAuth } from 'next-auth/middleware';

/**
 * Auth middleware — gates protected routes.
 * Tenant resolution happens server-side in API routes and layouts
 * (Prisma client is not available in Edge runtime).
 */

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/dashboard')) {
        return !!token;
      }
      return true;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
