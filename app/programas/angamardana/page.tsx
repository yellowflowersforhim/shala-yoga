
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import CohortCard from '@/components/cohort-card';
import { Calendar, ArrowLeft, Users, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Angamardana - Classical Hatha Yoga',
  description: 'Aprende Angamardana',
};

export default async function AngamardanaPage() {
  const tenant = await getTenantFromRequest(await headers());
  const cohorts = await prisma.cohort.findMany({
    where: withTenant({
      isPublished: true,
      program: {
        slug: 'angamardana'
      }
    }, tenant),
    include: {
      enrollments: {
        where: { status: 'active' }
      }
    },
    orderBy: { startDate: 'asc' }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[hsl(var(--brand-primary-light))]/30 to-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px]">
        <Image
          src="/programs/angamardana.jpg"
          alt="Angamardana"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Angamardana</h1>
            <p className="text-xl md:text-2xl text-white/90 italic">
              «Angamardana significa obtener un dominio completo sobre las extremidades, órganos y otras partes del cuerpo. Revitaliza el cuerpo, desarrolla salud vibrante y bienestar.»
            </p>
            <p className="text-lg mt-2 text-[hsl(var(--brand-primary-light))]">— Sadhguru</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link href="/programas">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Programas
          </Button>
        </Link>

        {/* ¿Qué es Angamardana? */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-[hsl(var(--brand-primary-light))]">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">¿Qué es Angamardana?</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p className="text-xl leading-relaxed">
                Angamardana es un sistema de <span className="font-semibold text-[hsl(var(--brand-primary))]">fitness con raíces antiguas</span>. Significa obtener un dominio completo sobre las extremidades, órganos y otras partes del cuerpo. Es una forma no aeróbica de ejercicio que revitaliza el cuerpo en muchos niveles.
              </p>
              <p className="text-lg leading-relaxed">
                Este sistema de <span className="font-semibold">31 procesos dinámicos</span> fortalece la columna vertebral, el sistema esquelético y el sistema muscular. No solo construye músculo, sino que también rejuvenece el cuerpo, desarrollando salud vibrante, agudeza mental y bienestar.
              </p>
              <p className="text-lg leading-relaxed">
                Lo más destacable de Angamardana es que <span className="font-semibold text-[hsl(var(--brand-primary))]">no necesitas ningún equipamiento de gimnasio</span>. Usas tu propio peso corporal para construir fuerza y fitness. Puede practicarse en cualquier lugar, en cualquier momento.
              </p>
              <p className="text-lg leading-relaxed">
                Angamardana desarrolla el cuerpo hacia un nivel de competencia y fortaleza. Fortalece la columna, las extremidades y aumenta la resistencia del cuerpo, creando una sensación de flexibilidad, ligereza y libertad en el sistema físico.
              </p>
            </div>
          </div>
        </div>

        {/* Intensivos Disponibles */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-8">
            <Calendar className="h-8 w-8 text-[hsl(var(--brand-primary))] mr-3" />
            <h2 className="text-4xl font-bold text-gray-900">
              Próximos Intensivos
            </h2>
          </div>

          {cohorts && cohorts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.map((cohort) => (
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
            <div className="text-center py-12 bg-gradient-to-br from-[hsl(var(--brand-primary-light))] to-white rounded-2xl border-2 border-[hsl(var(--brand-primary-light))] shadow-lg">
              <Calendar className="h-20 w-20 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <p className="text-gray-700 text-xl font-semibold mb-2">
                Próximamente nuevos intensivos
              </p>
              <p className="text-gray-600 mb-6">
                Estamos preparando las próximas fechas para este programa.<br />
                Por favor, vuelve pronto o contáctame para más información.
              </p>
              <Link href="/contacto">
                <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))] text-lg px-8 py-6">
                  Contactar
                </Button>
              </Link>
            </div>
          )}
        </div>
        {/* Grid de Beneficios y Características */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Beneficios */}
          <div className="bg-gradient-to-br from-[hsl(var(--brand-primary-light))] to-white rounded-2xl p-8 shadow-lg border border-[hsl(var(--brand-primary-light))]">
            <div className="flex items-center mb-6">
              <Target className="h-8 w-8 text-[hsl(var(--brand-primary))] mr-3" />
              <h3 className="text-3xl font-bold text-gray-900">Beneficios</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Fortalece la columna vertebral, esqueleto y músculos',
                'Revitaliza y rejuvenece todo el cuerpo',
                'Desarrolla salud vibrante y bienestar',
                'Aumenta la resistencia física',
                'Mejora la flexibilidad y agilidad',
                'Fortalece el sistema cardiovascular',
                'Aumenta la agudeza mental',
                'No requiere equipamiento de gimnasio',
                'Puede practicarse en cualquier lugar'
              ].map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-[hsl(var(--brand-primary))] mr-3 text-2xl font-bold">✓</span>
                  <span className="text-gray-700 text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Para Quién Es */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg border border-blue-200">
            <div className="flex items-center mb-6">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-3xl font-bold text-gray-900">¿Para Quién Es?</h3>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Sin Equipamiento</h4>
                <p className="text-gray-700">
                  Perfecto para quienes buscan fitness sin necesidad de ir al gimnasio o comprar equipamiento.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Fitness Completo</h4>
                <p className="text-gray-700">
                  Ideal para desarrollar un cuerpo fuerte, flexible y vibrante a través del peso corporal.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Viajeros y Ocupados</h4>
                <p className="text-gray-700">
                  Excelente para personas con horarios ocupados o que viajan frecuentemente.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Mayores de 14 Años</h4>
                <p className="text-gray-700">
                  Apropiado para jóvenes y adultos con capacidad física normal. Todos los niveles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detalles Prácticos */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-200 mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Detalles del Programa</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Duración del Curso</h4>
              <p className="text-gray-700">4 sesiones de 2-3 horas</p>
            </div>
            <div className="text-center">
              <Target className="h-12 w-12 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Procesos</h4>
              <p className="text-gray-700">31 ejercicios dinámicos</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Equipamiento</h4>
              <p className="text-gray-700">Ninguno necesario</p>
            </div>
          </div>
        </div>

        {/* Video Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Sadhguru Habla Sobre Angamardana</h3>
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/B5RHr90IBFI?si=JthtxANBzaV15bQR"
              title="Angamardana por Sadhguru"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
