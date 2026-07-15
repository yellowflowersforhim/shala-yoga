
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/status-badge';
import { formatPrice, formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const tenant = await getTenantFromRequest(await headers());
  const orders = await prisma.order.findMany({
    where: withTenant({}, tenant),
    include: {
      user: true,
      cohort: {
        include: {
          program: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalRevenue = orders
    .filter((order: any) => order.status === 'paid')
    .reduce((sum: any, order: any) => sum + order.totalCents, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pedidos</h1>
        <p className="text-gray-600">Gestiona todos los pedidos y pagos</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatPrice(totalRevenue, 'EUR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Pedidos</CardTitle>
          <CardDescription>
            {orders.length} pedidos en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de Orden</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.user?.name ?? 'N/A'}</p>
                          <p className="text-sm text-gray-500">{order.user?.email ?? 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{order.cohort?.program?.title ?? 'N/A'}</p>
                          <p className="text-sm text-gray-500">{order.cohort?.name ?? 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(order.totalCents, order.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.paidAt ? formatDateTime(order.paidAt) : formatDateTime(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay pedidos aún</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
