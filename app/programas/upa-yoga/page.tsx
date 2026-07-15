
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
  title: 'Upa Yoga - Classical Hatha Yoga',
  description: 'Aprende Upa Yoga',
};

export default async function UpaYogaPage() {
  const tenant = await getTenantFromRequest(await headers());
  const cohorts = await prisma.cohort.findMany({
    where: withTenant({
      isPublished: true,
      program: {
        slug: 'upa-yoga'
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
          src="https://cdn.abacus.ai/images/c164b742-83b2-464d-a4b2-f699abfa1a5e.png"
          alt="Upa-Yoga"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Upa-Yoga</h1>
            <p className="text-xl md:text-2xl text-white/90 italic">
              «Upa-yoga es un buen comienzo hacia una vida física más completa. Aquellos que deseen explorar una dimensión más profunda pueden adentrarse en el yoga.»
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

        {/* ¿Qué es Upa-Yoga? */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-[hsl(var(--brand-primary-light))]">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">¿Qué es Upa-Yoga?</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p className="text-xl leading-relaxed">
                Vamos a aprender un proceso muy efectivo llamado Upa-yoga. Es un sistema de prácticas simple pero poderoso que activa las articulaciones, los músculos y el sistema energético.
              </p>
              <p className="text-lg leading-relaxed">
                Basado en una comprensión sofisticada de la mecánica del cuerpo, Upa-yoga aporta una gran sensación de bienestar a todo el sistema. También alivia el estrés físico y el cansancio.
              </p>
              <p className="text-lg leading-relaxed">
                Dentro del sistema humano, la energía fluye a lo largo de 72.000 vías llamadas <span className="font-semibold text-[hsl(var(--brand-primary))]">nadis</span>. En las articulaciones, los nadis forman nodos de energía, convirtiendo las articulaciones en almacenes de energía. Upa-yoga activa esta energía y también lubrica las articulaciones, creando una sensación instantánea de alerta y vivacidad.
              </p>
              <p className="text-lg leading-relaxed">
                Rejuvenece el cuerpo después de un período de inactividad y neutraliza los efectos del jetlag y los viajes largos.
              </p>
            </div>
          </div>
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
                'Activa las articulaciones, músculos y sistema energético',
                'Lubrica las articulaciones y alivia el dolor',
                'Alivia el estrés físico y mental',
                'Aumenta la alerta y vivacidad',
                'Rejuvenece después de períodos de inactividad',
                'Neutraliza efectos de jetlag y viajes largos',
                'Mejora la circulación sanguínea',
                'No requiere equipamiento especial',
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
                <h4 className="font-bold text-lg text-gray-900 mb-2">Principiantes</h4>
                <p className="text-gray-700">
                  Ideal para quienes se inician en el yoga. Las prácticas son simples y accesibles para cualquier persona.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Todas las Edades</h4>
                <p className="text-gray-700">
                  Apropiado para personas de todas las edades y niveles de condición física.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Vida Ocupada</h4>
                <p className="text-gray-700">
                  Perfecto para personas con horarios ocupados que buscan un proceso simple y efectivo.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Viajeros Frecuentes</h4>
                <p className="text-gray-700">
                  Excelente para neutralizar los efectos del jetlag y mantener vitalidad durante los viajes.
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
              <p className="text-gray-700">4-5 horas (1 sesión)</p>
            </div>
            <div className="text-center">
              <Target className="h-12 w-12 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Prácticas</h4>
              <p className="text-gray-700">10 prácticas simples y poderosas</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Nivel</h4>
              <p className="text-gray-700">Todos los niveles</p>
            </div>
          </div>
        </div>

        {/* Video Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Sadhguru Habla Sobre Upa-Yoga</h3>
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/0HF4EYFaN1I"
              title="Upa-Yoga por Sadhguru"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
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
      </div>
    </div>
  );
}
