
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EnrollmentCardProps {
  enrollment: any;
  showProgress?: boolean;
}

export function EnrollmentCard({ enrollment, showProgress = true }: EnrollmentCardProps) {
  const cohort = enrollment.cohort;
  const program = cohort?.program;
  const today = new Date();
  const startDate = new Date(cohort?.startDate);
  const endDate = new Date(cohort?.endDate);
  
  // Calculate progress percentage
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercentage = Math.max(0, Math.min(100, Math.round((daysPassed / totalDays) * 100)));
  
  // Determine if program is active, upcoming, or completed
  const isUpcoming = startDate > today;
  const isActive = startDate <= today && endDate >= today;
  const isCompleted = endDate < today || enrollment.status === 'completed';

  const getStatusBadge = () => {
    if (isCompleted) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>;
    }
    if (isUpcoming) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Próximo</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-[hsl(var(--brand-primary-light))] text-[hsl(var(--brand-primary-dark))] hover:bg-[hsl(var(--brand-primary-light))]">En curso</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{enrollment.status}</Badge>;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[hsl(var(--brand-primary))]">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl text-[hsl(var(--brand-primary-dark))] mb-1">
              {program?.title ?? 'Programa'}
            </CardTitle>
            <CardDescription className="text-base">{cohort?.name ?? 'Cohorte'}</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start text-sm text-gray-700">
            <Calendar className="h-4 w-4 mr-3 mt-0.5 text-[hsl(var(--brand-primary))] flex-shrink-0" />
            <div>
              <div className="font-medium">Fechas del programa</div>
              <div className="text-gray-600">
                {formatDate(startDate)} - {formatDate(endDate)}
              </div>
            </div>
          </div>
          
          <div className="flex items-start text-sm text-gray-700">
            <Clock className="h-4 w-4 mr-3 mt-0.5 text-[hsl(var(--brand-primary))] flex-shrink-0" />
            <div>
              <div className="font-medium">Horario</div>
              <div className="text-gray-600">{cohort?.scheduleText ?? 'Por confirmar'}</div>
            </div>
          </div>
          
          <div className="flex items-start text-sm text-gray-700">
            <MapPin className="h-4 w-4 mr-3 mt-0.5 text-[hsl(var(--brand-primary))] flex-shrink-0" />
            <div>
              <div className="font-medium">Ubicación</div>
              <div className="text-gray-600">{cohort?.location ?? 'Por confirmar'}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar - Only show for active programs */}
        {showProgress && isActive && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso del programa</span>
              <span className="text-sm font-semibold text-[hsl(var(--brand-primary))]">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary))] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {daysPassed} de {totalDays} días completados
            </p>
          </div>
        )}

        {/* Upcoming program info */}
        {isUpcoming && (
          <div className="pt-4 border-t">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                Comienza en {Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} días
              </p>
            </div>
          </div>
        )}

        {/* Completed program info */}
        {isCompleted && (
          <div className="pt-4 border-t">
            <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-medium">
                  ¡Programa completado!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Finalizado el {formatDate(endDate)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
