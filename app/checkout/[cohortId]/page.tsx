import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { headers } from 'next/headers';

import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import CheckoutClient from './_components/checkout-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ cohortId: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { cohortId } = await params;
  const session = await getServerSession(authOptions);

  const tenant = await getTenantFromRequest(await headers());

  const cohort = await prisma.cohort.findUnique({
    where: withTenant({ id: cohortId }, tenant),
    include: {
      program: true,
      enrollments: {
        where: { status: 'active' }
      }
    }
  });

  if (!cohort || !cohort.isPublished) {
    notFound();
  }

  // Check if user is already enrolled (for authenticated users only)
  if (session?.user) {
    const tenant = await getTenantFromRequest(await headers());

  const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: (session.user as any).id,
        cohortId: cohort.id
      }
    });

    if (existingEnrollment) {
      redirect('/dashboard');
    }
  }

  const availableSeats = cohort.maxSeats - (cohort.enrollments?.length ?? 0);

  if (availableSeats <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))] px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Intensivo Completo</h1>
          <p className="text-gray-600 mb-8">
            Lo sentimos, este intensivo ya no tiene plazas disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CheckoutClient
      cohort={{
        id: cohort.id,
        name: cohort.name,
        startDate: cohort.startDate.toISOString(),
        endDate: cohort.endDate.toISOString(),
        scheduleText: cohort.scheduleText,
        location: cohort.location,
        maxSeats: cohort.maxSeats,
        enrolledCount: cohort.enrollments?.length ?? 0
      }}
      program={{
        title: cohort.program.title,
        durationWeeks: cohort.program.durationWeeks,
        priceCents: cohort.program.priceCents,
        currency: cohort.program.currency
      }}
      userId={session?.user ? (session.user as any).id : null}
    />
  );
}
