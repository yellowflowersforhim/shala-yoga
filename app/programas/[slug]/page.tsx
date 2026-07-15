
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import CohortCard from '@/components/cohort-card';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tenant = await getTenantFromRequest(await headers());
  const program = await prisma.program.findFirst({
    where: withTenant({ slug, isActive: true }, tenant),
    include: {
      cohorts: {
        where: { isPublished: true },
        include: {
          enrollments: {
            where: { status: 'active' }
          }
        },
        orderBy: { startDate: 'asc' }
      }
    }
  });

  if (!program) {
    notFound();
  }

  const cohorts = program.cohorts || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link href="/programas">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Programas
          </Button>
        </Link>

        {/* Program Header */}
        <div className="mb-12">
          <div className="bg-white rounded-xl p-8 md:p-12 shadow-md mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{program.title}</h1>
            <p className="text-xl text-gray-700 leading-relaxed">{program.description}</p>
          </div>
        </div>

        {/* Cohorts Section */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <Calendar className="h-6 w-6 text-[hsl(var(--brand-primary))] mr-2" />
            <h2 className="text-3xl font-bold text-gray-900">
              Intensivos Disponibles
            </h2>
          </div>

          {cohorts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.map((cohort: any) => (
                <CohortCard
                  key={cohort.id}
                  id={cohort.id}
                  name={cohort.name}
                  startDate={cohort.startDate.toISOString()}
                  endDate={cohort.endDate.toISOString()}
                  maxSeats={cohort.maxSeats}
                  enrolledCount={cohort.enrollments?.length ?? 0}
                  scheduleText={cohort.scheduleText}
                  location={cohort.location}
                  enrollmentOpensAt={cohort.enrollmentOpensAt?.toISOString() ?? null}
                  enrollmentClosesAt={cohort.enrollmentClosesAt?.toISOString() ?? null}
                  isPublished={cohort.isPublished}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-[hsl(var(--brand-primary-light))] shadow-md">
              <Calendar className="h-16 w-16 text-[hsl(var(--brand-primary-light))] mx-auto mb-4" />
              <p className="text-gray-700 text-lg font-semibold mb-2">
                Próximamente nuevos intensivos
              </p>
              <p className="text-gray-500">
                Estamos preparando las próximas fechas para este programa. Por favor, vuelve pronto o contáctame para más información.
              </p>
              <Link href="/contacto">
                <Button className="mt-6 bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]">
                  Contactar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
