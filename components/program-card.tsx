

import Link from 'next/link';
import { Calendar, Clock, Euro } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { formatPrice } from '@/lib/format';

interface ProgramCardProps {
  slug: string;
  title: string;
  description: string;
  durationWeeks: number;
  priceCents: number;
  currency: string;
  cohortCount?: number;
}

export default function ProgramCard({
  slug,
  title,
  description,
  durationWeeks,
  priceCents,
  currency,
  cohortCount = 0
}: ProgramCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 group border-[hsl(var(--brand-primary-light))]">
      <CardHeader>
        <CardTitle className="text-xl text-[hsl(var(--brand-primary-dark))] group-hover:text-[hsl(var(--brand-primary))] transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
            <span>{durationWeeks} semanas</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Euro className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
            <span className="text-lg font-semibold text-[hsl(var(--brand-primary-dark))]">
              {formatPrice(priceCents, currency)}
            </span>
          </div>
          {cohortCount > 0 && (
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
              <span>{cohortCount} {cohortCount === 1 ? 'intensivo disponible' : 'intensivos disponibles'}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/programas/${slug}`} className="w-full">
          <Button className="w-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] hover:from-[hsl(var(--brand-primary-dark))] hover:to-[hsl(var(--brand-primary-dark))]">
            Ver Detalles
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
