

import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Euro } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminProgramsPage() {
  const tenant = await getTenantFromRequest(await headers());
  const programs = await prisma.program.findMany({
    where: withTenant({}, tenant),
    include: {
      cohorts: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Programas</h1>
          <p className="text-gray-600">Administra los programas de yoga</p>
        </div>
        <Link href="/admin/programas/crear">
          <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]">
            <Plus className="mr-2 h-4 w-4" />
            Crear Programa
          </Button>
        </Link>
      </div>

      {programs.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {programs.map((program: any) => (
            <Card key={program.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{program.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {program.description}
                    </CardDescription>
                  </div>
                  {program.isActive ? (
                    <Badge className="bg-green-500">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
                    <span>{program.durationWeeks} semanas</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Euro className="h-4 w-4 mr-2 text-[hsl(var(--brand-primary))]" />
                    <span className="font-semibold">
                      {formatPrice(program.priceCents, program.currency)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {program.cohorts?.length ?? 0} intensivos
                  </div>
                  <div className="pt-3">
                    <Link href={`/admin/programas/${program.id}/editar`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Editar Programa
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No hay programas creados aún</p>
            <Link href="/admin/programas/crear">
              <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Programa
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
