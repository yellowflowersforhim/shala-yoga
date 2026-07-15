import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(req.headers);
    const { searchParams } = new URL(req.url);
    const months = Math.min(12, Math.max(1, Number(searchParams.get('months') || 6)));

    const now = new Date();
    const result: { month: string; revenue: number; orders: number }[] = [];
    const baseWhere = withTenant({ status: 'paid' as const }, tenant);

    for (let i = months - 1; i >= 0; i--) {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const orders = await prisma.order.findMany({ where: { ...baseWhere, paidAt: { gte: firstDay, lte: lastDay } } });
      result.push({
        month: firstDay.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        revenue: orders.reduce((sum, o) => sum + o.totalCents, 0) / 100,
        orders: orders.length,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Revenue chart error:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
