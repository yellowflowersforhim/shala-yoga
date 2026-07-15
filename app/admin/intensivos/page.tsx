

import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminCohortsPage() {
  const tenant = await getTenantFromRequest(await headers());
  const cohorts = await prisma.cohort.findMany({
    where: withTenant({}, tenant),
    include: {
      program: true,
      enrollments: {
        where: { status: 'active' }
      }
    },
    orderBy: { startDate: 'desc' }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Intensivos</h1>
          <p className="text-gray-600">Administra los intensivos de tus programas</p>
        </div>
        <Link href="/admin/intensivos/crear">
          <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]">
            <Plus className="mr-2 h-4 w-4" />
            Crear Intensivo
          </Button>
        </Link>
      </div>

      {cohorts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {cohorts.map((cohort: any) => {
            const enrolledCount = cohort.enrollments?.length ?? 0;
            const availableSeats = cohort.maxSeats - enrolledCount;
            
            return (
              <Card key={cohort.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{cohort.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {cohort.program?.title ?? 'Programa'}
                      </CardDescription>
                    </div>
                    {cohort.isPublished ? (
                      <Badge className="bg-green-500">Publicado</Badge>
                    ) : (
                      <Badge variant="secondary">Borrador</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
                      <span>
                        {formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
                      <span>{cohort.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
                      <span>
                        {enrolledCount} / {cohort.maxSeats} plazas ocupadas
                        {availableSeats === 0 && ' (Completo)'}
                      </span>
                    </div>
                    <div className="pt-3">
                      <Link href={`/admin/intensivos/${cohort.id}/editar`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Editar Intensivo
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No hay intensivos creados aún</p>
            <Link href="/admin/intensivos/crear">
              <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Intensivo
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
