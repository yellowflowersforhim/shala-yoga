
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
  title: 'Bhuta Shuddhi - Classical Hatha Yoga',
  description: 'Aprende Bhuta Shuddhi',
};

export default async function BhutaShuddhiPage() {
  const tenant = await getTenantFromRequest(await headers());
  const cohorts = await prisma.cohort.findMany({
    where: withTenant({
      isPublished: true,
      program: {
        slug: 'bhuta-shuddhi'
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
          src="/programs/bhuta-shuddhi.jpg"
          alt="Bhuta Shuddhi"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Bhuta Shuddhi</h1>
            <p className="text-xl md:text-2xl text-white/90 italic">
              «Si los cinco elementos están bajo tu control, todo el proceso de la vida —nacimiento, existencia y muerte— estará completamente bajo tu control.»
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

        {/* ¿Qué es Bhuta Shuddhi? */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-[hsl(var(--brand-primary-light))]">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">¿Qué es Bhuta Shuddhi?</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p className="text-xl leading-relaxed">
                Bhuta Shuddhi significa <span className="font-semibold text-[hsl(var(--brand-primary))]">"purificación de los elementos"</span>. Es un proceso fundamental de purificación en el sistema yóguico que trabaja con los cinco elementos que componen el cuerpo humano: tierra, agua, fuego, aire y éter (espacio).
              </p>
              <p className="text-lg leading-relaxed">
                El sistema del Bhuta Shuddhi mantiene el sistema en armonía y equilibrio. Los <span className="font-semibold">cinco elementos</span> (pancha bhutas) son los componentes básicos de toda la creación, incluido el cuerpo físico humano. El bienestar del cuerpo y la mente puede establecerse trayendo armonía entre estos cinco elementos.
              </p>
              <p className="text-lg leading-relaxed">
                Este proceso no solo purifica el cuerpo a nivel elemental, sino que también <span className="font-semibold text-[hsl(var(--brand-primary))]">equilibra las energías</span> del sistema, preparando la base para experiencias yóguicas más profundas. Es una práctica fundamental para mantener la salud y el bienestar.
              </p>
              <p className="text-lg leading-relaxed">
                Bhuta Shuddhi es una práctica simple pero profunda que puede ser realizada por cualquier persona. A través de la práctica regular, uno puede experimentar una purificación completa del sistema físico, mental y energético.
              </p>
            </div>
          </div>
        </div>

        {/* Los 5 Elementos */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-8 md:p-12 shadow-lg border border-amber-200">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Los Cinco Elementos (Pancha Bhutas)</h3>
            <div className="grid md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-amber-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white">🌍</span>
                </div>
                <h4 className="font-bold text-lg text-gray-900 mb-2">Tierra</h4>
                <p className="text-gray-600 text-sm">Prithvi</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white">💧</span>
                </div>
                <h4 className="font-bold text-lg text-gray-900 mb-2">Agua</h4>
                <p className="text-gray-600 text-sm">Jala</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white">🔥</span>
                </div>
                <h4 className="font-bold text-lg text-gray-900 mb-2">Fuego</h4>
                <p className="text-gray-600 text-sm">Agni</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-sky-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white">💨</span>
                </div>
                <h4 className="font-bold text-lg text-gray-900 mb-2">Aire</h4>
                <p className="text-gray-600 text-sm">Vayu</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white">✨</span>
                </div>
                <h4 className="font-bold text-lg text-gray-900 mb-2">Éter</h4>
                <p className="text-gray-600 text-sm">Akasha</p>
              </div>
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
                'Purifica el sistema de los cinco elementos',
                'Equilibra las energías del cuerpo',
                'Mejora la salud física y mental',
                'Fortalece el sistema inmunológico',
                'Prepara para prácticas yóguicas más profundas',
                'Aumenta la claridad mental',
                'Establece armonía interior',
                'Limpia el cuerpo a nivel elemental',
                'Promueve el bienestar general'
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
                <h4 className="font-bold text-lg text-gray-900 mb-2">Purificación Fundamental</h4>
                <p className="text-gray-700">
                  Para quienes buscan una limpieza profunda del sistema físico, mental y energético.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Preparación Yóguica</h4>
                <p className="text-gray-700">
                  Ideal como preparación para prácticas yóguicas más avanzadas e intensas.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Salud y Equilibrio</h4>
                <p className="text-gray-700">
                  Perfecto para mantener el equilibrio y la armonía de los elementos en el cuerpo.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Todos los Niveles</h4>
                <p className="text-gray-700">
                  Apropiado para principiantes y practicantes avanzados. Mayores de 14 años.
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
              <p className="text-gray-700">90 min (1 sesión)</p>
            </div>
            <div className="text-center">
              <Target className="h-12 w-12 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Elementos</h4>
              <p className="text-gray-700">5 elementos fundamentales</p>
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
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Sadhguru Habla Sobre Bhuta Shuddhi</h3>
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/gfTCYNCpS9E?si=9aZonLTjJA-X5833"
              title="Bhuta Shuddhi por Sadhguru"
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
