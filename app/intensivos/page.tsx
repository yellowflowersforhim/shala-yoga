
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgramImage } from '@/components/program-image';

interface Program {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationWeeks: number;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  cohorts: Cohort[];
}

interface Cohort {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxSeats: number;
  scheduleText: string;
  location: string;
  enrolledCount: number;
  isUserEnrolled: boolean;
}

export default function IntensivosPage() {
  const { data: session, status } = useSession() || {};
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('/api/programs');
        const data = await response.json();
        setPrograms(data.programs || []);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrograms();
  }, [session]);

  const getAvailableSeats = (cohort: Cohort) => {
    const enrolled = cohort.enrolledCount || 0;
    return cohort.maxSeats - enrolled;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatPrice = (priceCents: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(priceCents / 100);
  };

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  // Group cohorts by program and filter only upcoming ones
  const upcomingCohorts = programs.flatMap(program => 
    program.cohorts
      .filter(cohort => isUpcoming(cohort.startDate))
      .map(cohort => ({ program, cohort }))
  ).sort((a, b) => new Date(a.cohort.startDate).getTime() - new Date(b.cohort.startDate).getTime());

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--brand-primary))] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando intensivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--brand-primary-light))] via-white to-[hsl(var(--brand-primary-light))] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Intensivos Disponibles
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explora nuestros próximos intensivos de Classical Hatha Yoga. Cada intensivo es una oportunidad única para profundizar en tu práctica.
          </p>
        </div>

        {/* Intensivos List */}
        {upcomingCohorts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600 text-lg">
                No hay intensivos programados en este momento. Por favor, revisa más tarde.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {upcomingCohorts.map(({ program, cohort }) => {
              const availableSeats = getAvailableSeats(cohort);
              const isFull = availableSeats <= 0;
              const isAlmostFull = availableSeats <= 3 && availableSeats > 0;

              return (
                <Card key={cohort.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden">
                    <ProgramImage
                      imageUrl={program.imageUrl}
                      programTitle={program.title}
                      className="w-full h-full"
                    />
                    {isFull && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg px-4 py-2">
                          Cupos agotados
                        </Badge>
                      </div>
                    )}
                    {cohort.isUserEnrolled && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-600 text-white flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Ya inscrito
                        </Badge>
                      </div>
                    )}
                    {isAlmostFull && !isFull && !cohort.isUserEnrolled && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-[hsl(var(--brand-primary))] text-white">
                          ¡Últimos {availableSeats} cupos!
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6">
                    {/* Program Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {program.title}
                    </h3>
                    
                    {/* Cohort Name */}
                    <p className="text-[hsl(var(--brand-primary))] font-semibold mb-4">
                      {cohort.name}
                    </p>

                    {/* Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start text-gray-600">
                        <Calendar className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatDate(cohort.startDate)}
                          </div>
                          <div className="text-gray-500">
                            al {formatDate(cohort.endDate)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Clock className="h-5 w-5 mr-2 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                        <span className="text-sm">{cohort.scheduleText}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-5 w-5 mr-2 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                        <span className="text-sm">{cohort.location}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Users className="h-5 w-5 mr-2 flex-shrink-0 text-[hsl(var(--brand-primary))]" />
                        <span className="text-sm">
                          {availableSeats} {availableSeats === 1 ? 'cupo disponible' : 'cupos disponibles'}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-bold text-[hsl(var(--brand-primary))]">
                        {formatPrice(program.priceCents, program.currency)}
                      </span>
                      <Badge variant="secondary">
                        {program.durationWeeks} semanas
                      </Badge>
                    </div>

                    {/* CTA Button */}
                    {cohort.isUserEnrolled ? (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 cursor-default"
                        disabled
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Ya inscrito en este intensivo
                      </Button>
                    ) : (
                      <Link href={`/programas/${program.slug}?cohort=${cohort.id}`}>
                        <Button 
                          className="w-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] hover:from-[hsl(var(--brand-primary-dark))] hover:to-[hsl(var(--brand-primary-dark))]"
                          disabled={isFull}
                        >
                          {isFull ? 'Cupos agotados' : 'Ver detalles e inscribirse'}
                          {!isFull && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Qué son los Intensivos?
          </h2>
          <p className="text-gray-600 mb-4">
            Los intensivos son programas estructurados de Classical Hatha Yoga diseñados para ofrecerte una experiencia profunda y transformadora. Cada intensivo tiene una duración específica y se enfoca en un aspecto particular de la práctica.
          </p>
          <p className="text-gray-600">
            Los cupos son limitados para garantizar una atención personalizada y un ambiente de aprendizaje óptimo. Te recomendamos inscribirte con anticipación para asegurar tu lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
