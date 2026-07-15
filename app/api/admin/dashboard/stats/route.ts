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

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const baseOrderWhere = withTenant({ status: 'paid' as const }, tenant);

    const currentMonthOrders = await prisma.order.findMany({
      where: { ...baseOrderWhere, paidAt: { gte: firstDayOfMonth } },
    });
    const currentMonthRevenue = currentMonthOrders.reduce((sum, o) => sum + o.totalCents, 0);

    const lastMonthOrders = await prisma.order.findMany({
      where: { ...baseOrderWhere, paidAt: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth } },
    });
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.totalCents, 0);

    const activeEnrollments = await prisma.enrollment.count({
      where: withTenant({ status: 'active' as const }, tenant),
    });

    const upcomingCohorts = await prisma.cohort.findMany({
      where: withTenant({ isPublished: true, startDate: { gte: now } }, tenant),
      include: { program: true, _count: { select: { enrollments: true } } },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    const totalStudents = tenant
      ? await prisma.enrollment.groupBy({ by: ['userId'], where: { tenantId: tenant.tenantId, userId: { not: null }, status: 'active' } })
        .then(r => r.length)
      : await prisma.user.count({ where: { isAdmin: false } });

    const totalOrders = await prisma.order.count({ where: baseOrderWhere });
    const paidOrders = currentMonthOrders.length;
    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

    return NextResponse.json({
      currentMonthRevenue: currentMonthRevenue / 100,
      lastMonthRevenue: lastMonthRevenue / 100,
      revenueChange: lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 100,
      activeEnrollments,
      totalStudents,
      conversionRate,
      upcomingCohorts: upcomingCohorts.map((cohort: any) => ({
        id: cohort.id, name: cohort.name, programTitle: cohort.program.title,
        startDate: cohort.startDate, endDate: cohort.endDate,
        enrolled: cohort._count.enrollments, maxSeats: cohort.maxSeats,
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
