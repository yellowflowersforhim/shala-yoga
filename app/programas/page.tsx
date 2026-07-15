import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Programas de Hatha Yoga',
  description: 'Descubre nuestros programas de Hatha Yoga. Desde fundamentos hasta prácticas avanzadas.',
};

export default async function ProgramsPage() {
  const tenant = await getTenantFromRequest(await headers());

  const programsFromDb = await prisma.program.findMany({
    where: withTenant({ isActive: true }, tenant),
    orderBy: { createdAt: 'asc' },
  });

  const staticPrograms = [
    {
      slug: 'fundamentos-hatha',
      title: 'Fundamentos',
      duration: '4 semanas',
      levels: 'Principiante',
      image: null,
      isActive: true,
    },
    {
      slug: 'hatha-avanzado',
      title: 'Hatha Avanzado',
      duration: '8 semanas',
      levels: 'Intermedio/Avanzado',
      image: null,
      isActive: true,
    },
  ];

  const programs = programsFromDb.length > 0 ? programsFromDb : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))]">
      {/* Header */}
      <section className="relative py-20 bg-gradient-to-br from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-to))] text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Programas de Hatha Yoga
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Explora nuestros programas y encuentra el que mejor se adapta a tu nivel y objetivos.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {programs.length === 0 ? (
          /* Fallback static programs when no DB programs exist */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {staticPrograms
              .filter((p) => p.isActive)
              .map((program, index) => (
                <Link
                  key={program.slug}
                  href={`/programas/${program.slug}`}
                  className="bg-white border border-[hsl(var(--brand-primary-light))] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="aspect-[16/10] bg-gradient-to-br from-[hsl(var(--brand-primary-light))] to-white flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-[hsl(var(--brand-primary-light))]" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[hsl(var(--brand-primary))] transition-colors">
                      {program.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>⏱ {program.duration}</span>
                      <span>📊 {program.levels}</span>
                    </div>
                    <span className="inline-flex items-center text-[hsl(var(--brand-primary))] font-semibold group-hover:gap-2 transition-all">
                      Ver programa <ArrowRight className="h-4 w-4 ml-1" />
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <Link
                key={program.id}
                href={`/programas/${program.slug}`}
                className="bg-white border border-[hsl(var(--brand-primary-light))] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-[hsl(var(--brand-primary-light))] to-white flex items-center justify-center">
                  {program.imageUrl ? (
                    <Image
                      src={program.imageUrl}
                      alt={program.title}
                      width={400}
                      height={250}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-[hsl(var(--brand-primary-light))]" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[hsl(var(--brand-primary))] transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {program.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>⏱ {program.durationWeeks} semanas</span>
                  </div>
                  <span className="inline-flex items-center text-[hsl(var(--brand-primary))] font-semibold group-hover:gap-2 transition-all">
                    Ver programa <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {programs.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-500 mb-6">Pronto añadiremos más programas. ¡Vuelve a visitarnos!</p>
            <Link href="/contacto">
              <Button variant="outline">Contactar para más información</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
