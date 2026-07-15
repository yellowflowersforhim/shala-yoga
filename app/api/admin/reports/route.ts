import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const format = searchParams.get('format') || 'json';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    let reportData: Record<string, unknown> = {};

    if (type === 'summary') {
      const [totalStudents, activeEnrollments, totalRevenue, activePrograms] = await Promise.all([
        prisma.user.count({ where: { isAdmin: false } }),
        prisma.enrollment.count({ where: withTenant({ status: 'active' as const }, tenant) }),
        prisma.order.aggregate({ where: withTenant({ status: 'paid' as const, ...(Object.keys(dateFilter).length ? { paidAt: dateFilter } : {}) }, tenant), _sum: { totalCents: true } }),
        prisma.program.count({ where: withTenant({ isActive: true }, tenant) }),
      ]);

      reportData = {
        totalStudents, activeEnrollments,
        totalRevenue: (totalRevenue._sum.totalCents || 0) / 100,
        activePrograms,
        tenantId: tenant?.tenantId || 'global',
        tenantName: tenant?.name || 'Todos',
      };
    } else if (type === 'enrollments') {
      const enrollments = await prisma.enrollment.findMany({
        where: withTenant({}, tenant),
        include: { user: { select: { name: true, email: true } }, cohort: { include: { program: true } } },
        orderBy: { enrolledAt: 'desc' },
        take: 100,
      });
      reportData = { enrollments: enrollments.map(e => ({ ...e, totalSpent: 0 })), count: enrollments.length };
    } else if (type === 'revenue') {
      const orders = await prisma.order.findMany({
        where: withTenant({ status: 'paid' as const, ...(Object.keys(dateFilter).length ? { paidAt: dateFilter } : {}) }, tenant),
        include: { user: { select: { name: true, email: true } }, cohort: { include: { program: true } } },
        orderBy: { paidAt: 'desc' },
      });
      reportData = { orders, totalRevenue: orders.reduce((s, o) => s + o.totalCents, 0) / 100, count: orders.length };
    }

    if (format === 'csv') {
      const csv = Object.entries(reportData).map(([k, v]) => `${k},${JSON.stringify(v)}`).join('\n');
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv' } });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 });
  }
}
