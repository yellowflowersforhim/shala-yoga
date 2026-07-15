import { prisma } from '@/lib/prisma';
import CohortCard from '@/components/cohort-card';
import { Calendar, ArrowLeft, Users, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function AcharanPage() {
  const cohorts = await prisma.cohort.findMany({
    where: {
      isPublished: true,
      program: {
        slug: 'acharan'
      }
    },
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
          src="/programs/acharan.jpg"
          alt="Programa Acharan"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Programa Acharan</h1>
            <p className="text-xl md:text-2xl text-white/90 italic">
              «Acharan es un programa holístico de 21 días que transforma tu energía, mente y cuerpo desde dentro, combinando estilo de vida yóguico, alimentación consciente y prácticas milenarias.»
            </p>
            <p className="text-lg mt-2 text-[hsl(var(--brand-primary-light))]">— Inspirado en Sadhguru</p>
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

        {/* ¿Qué es Acharan? */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-[hsl(var(--brand-primary-light))]">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">¿Qué es Acharan?</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p className="text-xl leading-relaxed">
                <span className="font-semibold text-[hsl(var(--brand-primary))]">Acharan</span> es un programa holístico de <span className="font-bold">21 días</span> que combina cambios en el estilo de vida, pautas sobre alimentación yóguica y prácticas simples pero poderosas que activan tus articulaciones, músculos y sistema energético, aportando facilidad y ligereza a todo tu cuerpo.
              </p>
              <p className="text-lg leading-relaxed">
                Basado en un entendimiento profundo de la mecánica del cuerpo, este programa ayuda a disipar la inercia física y mental, restaurando claridad, vitalidad y equilibrio interior.
              </p>
              <p className="text-lg leading-relaxed">
                Durante el programa, aprenderás los principios de un estilo de vida yóguico y un plan de alimentación consciente, junto con prácticas como:
              </p>
              <ul className="space-y-2 text-lg">
                <li>🧘‍♂️ <strong>Upa-Yoga</strong> – Secuencia de activación del cuerpo y la energía</li>
                <li>🙏 <strong>Yoga Namaskar</strong> – Práctica para desarrollar equilibrio y reverencia interior</li>
                <li>🌬️ <strong>Pranayama</strong> – Técnicas de respiración para estabilizar la energía vital</li>
                <li>🕉️ <strong>Meditación guiada</strong> – Para aquietar la mente y armonizar cuerpo, mente y energía</li>
              </ul>
              <p className="text-lg leading-relaxed font-semibold">
                Un viaje de 21 días hacia un cuerpo más ágil, una mente más clara y un estilo de vida consciente.
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

        {/* Beneficios */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-[hsl(var(--brand-primary-light))] to-white rounded-2xl p-8 shadow-lg border border-[hsl(var(--brand-primary-light))]">
            <div className="flex items-center mb-6">
              <Target className="h-8 w-8 text-[hsl(var(--brand-primary))] mr-3" />
              <h3 className="text-3xl font-bold text-gray-900">Beneficios</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Activa articulaciones y músculos',
                'Equilibra tu energía vital',
                'Mejora concentración y claridad mental',
                'Reduce estrés y ansiedad',
                'Aprendes un estilo de vida yóguico',
                'Transforma hábitos y alimentación'
              ].map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-[hsl(var(--brand-primary))] mr-3 text-2xl font-bold">✓</span>
                  <span className="text-gray-700 text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg border border-blue-200">
            <div className="flex items-center mb-6">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-3xl font-bold text-gray-900">¿Para Quién Es?</h3>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Todos los niveles</h4>
                <p className="text-gray-700">
                  Apto para principiantes y practicantes con experiencia.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Cuerpo y mente equilibrados</h4>
                <p className="text-gray-700">
                  Ideal para quienes buscan vitalidad, claridad y bienestar interior.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detalles Prácticos */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-200 mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Detalles del Programa</h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Clock className="h-12 w-12 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Duración</h4>
              <p className="text-gray-700">21 días de prácticas y estilo de vida consciente</p>
            </div>
            <div>
              <Target className="h-12 w-12 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Prácticas</h4>
              <p className="text-gray-700">Upa-Yoga, Yoga Namaskar, Pranayama y Meditación guiada</p>
            </div>
            <div>
              <Users className="h-12 w-12 text-[hsl(var(--brand-primary))] mx-auto mb-4" />
              <h4 className="font-bold text-xl text-gray-900 mb-2">Equipamiento</h4>
              <p className="text-gray-700">Ninguno necesario</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
