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
    const days = Math.min(365, Math.max(1, Number(searchParams.get('days') || '30')));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const baseWhere = { timestamp: { gte: startDate }, ...withTenant({}, tenant) };

    const events = await prisma.conversionEvent.groupBy({
      by: ['eventType'],
      where: baseWhere,
      _count: { id: true },
    });

    const funnel: Record<string, number> = { landing: 0, view_cohort: 0, start_checkout: 0, complete_payment: 0 };
    events.forEach((event: any) => { if (event.eventType in funnel) funnel[event.eventType] = event._count.id; });

    const rates = {
      landingToView: funnel.landing > 0 ? (funnel.view_cohort / funnel.landing) * 100 : 0,
      viewToCheckout: funnel.view_cohort > 0 ? (funnel.start_checkout / funnel.view_cohort) * 100 : 0,
      checkoutToPayment: funnel.start_checkout > 0 ? (funnel.complete_payment / funnel.start_checkout) * 100 : 0,
      overallConversion: funnel.landing > 0 ? (funnel.complete_payment / funnel.landing) * 100 : 0,
    };

    const topCohorts = await prisma.conversionEvent.groupBy({
      by: ['cohortId'],
      where: { ...baseWhere, eventType: 'complete_payment', cohortId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const cohortIds = topCohorts.map((c: any) => c.cohortId).filter(Boolean);
    const cohorts = cohortIds.length > 0 ? await prisma.cohort.findMany({
      where: { id: { in: cohortIds }, ...withTenant({}, tenant) },
      include: { program: true },
    }) : [];

    const topCohortsWithDetails = topCohorts.map((tc: any) => {
      const cohort = cohorts.find((c) => c.id === tc.cohortId);
      return { cohortId: tc.cohortId, cohortName: cohort ? `${cohort.program.title} - ${cohort.name}` : 'Desconocido', conversions: tc._count.id };
    });

    return NextResponse.json({ funnel, rates, topCohorts: topCohortsWithDetails });
  } catch (error) {
    console.error('Error conversions:', error);
    return NextResponse.json({ error: 'Error al obtener conversiones' }, { status: 500 });
  }
}
