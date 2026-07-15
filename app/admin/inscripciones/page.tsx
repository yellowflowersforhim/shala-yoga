import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { headers } from 'next/headers';

import { prisma } from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/status-badge';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminEnrollmentsPage() {
  const tenant = await getTenantFromRequest(await headers());

  const enrollments = await prisma.enrollment.findMany({ where: withTenant({}, tenant),
    include: {
      user: true,
      cohort: {
        include: {
          program: true
        }
      },
      order: true
    },
    orderBy: { enrolledAt: 'desc' }
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inscripciones</h1>
        <p className="text-gray-600">Gestiona todas las inscripciones de estudiantes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Inscripciones</CardTitle>
          <CardDescription>
            {enrollments.length} inscripciones en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Cohorte</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Estado Pago</TableHead>
                    <TableHead>Fecha Inscripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment: any) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{enrollment.user?.name ?? 'N/A'}</p>
                          <p className="text-sm text-gray-500">{enrollment.user?.email ?? 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.cohort?.program?.title ?? 'N/A'}</TableCell>
                      <TableCell>{enrollment.cohort?.name ?? 'N/A'}</TableCell>
                      <TableCell>
                        <StatusBadge status={enrollment.status} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={enrollment.order?.status ?? 'pending'} />
                      </TableCell>
                      <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay inscripciones aún</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
