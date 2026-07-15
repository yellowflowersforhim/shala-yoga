

import Link from 'next/link';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatDate, isEnrollmentOpen } from '@/lib/format';

interface CohortCardProps {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxSeats: number;
  enrolledCount: number;
  scheduleText: string;
  location: string;
  enrollmentOpensAt?: string | null;
  enrollmentClosesAt?: string | null;
  isPublished: boolean;
}

export default function CohortCard({
  id,
  name,
  startDate,
  endDate,
  maxSeats,
  enrolledCount,
  scheduleText,
  location,
  enrollmentOpensAt,
  enrollmentClosesAt,
  isPublished
}: CohortCardProps) {
  const availableSeats = maxSeats - enrolledCount;
  const isOpen = isPublished && isEnrollmentOpen(enrollmentOpensAt ?? null, enrollmentClosesAt ?? null);
  const isFull = availableSeats <= 0;

  return (
    <Card className="h-full hover:shadow-md transition-all duration-300 border-[hsl(var(--brand-primary-light))]">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg text-[hsl(var(--brand-primary-dark))]">{name}</CardTitle>
          {!isPublished ? (
            <Badge variant="secondary">No publicado</Badge>
          ) : !isOpen ? (
            <Badge variant="secondary">Cerrado</Badge>
          ) : isFull ? (
            <Badge variant="destructive">Completo</Badge>
          ) : (
            <Badge className="bg-green-500">Abierto</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
          <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
          <span>{scheduleText}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
          <span>{location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
          <span>
            {availableSeats} {availableSeats === 1 ? 'plaza disponible' : 'plazas disponibles'} de {maxSeats}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        {isOpen && !isFull ? (
          <Link href={`/checkout/${id}`} className="w-full">
            <Button className="w-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] hover:from-[hsl(var(--brand-primary-dark))] hover:to-[hsl(var(--brand-primary-dark))]">
              Inscribirse
            </Button>
          </Link>
        ) : (
          <Button disabled className="w-full">
            {isFull ? 'Completo' : 'No disponible'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
