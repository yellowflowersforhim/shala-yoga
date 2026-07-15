import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);

    const cohort = await prisma.cohort.findFirst({
      where: withTenant({ id }, tenant),
      include: { program: true, _count: { select: { enrollments: { where: { status: 'active' } } } } },
    });
    if (!cohort) return NextResponse.json({ error: 'Intensivo no encontrado' }, { status: 404 });

    const { _count, ...safe } = cohort;
    return NextResponse.json({ cohort: { ...safe, enrolledCount: _count.enrollments } });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el intensivo' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);

    const body = await request.json();
    const { name, startDate, endDate, maxSeats, scheduleText, location, isPublished, enrollmentOpensAt, enrollmentClosesAt } = body;

    // Verify ownership before update
    const existing = await prisma.cohort.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'Intensivo no encontrado' }, { status: 404 });

    const cohort = await prisma.cohort.update({
      where: { id },
      data: { name, startDate: new Date(startDate), endDate: new Date(endDate), maxSeats: parseInt(maxSeats), scheduleText, location, isPublished, enrollmentOpensAt: enrollmentOpensAt ? new Date(enrollmentOpensAt) : null, enrollmentClosesAt: enrollmentClosesAt ? new Date(enrollmentClosesAt) : null },
    });

    return NextResponse.json({ message: 'Intensivo actualizado exitosamente', cohort });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar el intensivo' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);

    const existing = await prisma.cohort.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'Intensivo no encontrado' }, { status: 404 });

    await prisma.cohort.delete({ where: { id } });
    return NextResponse.json({ message: 'Intensivo eliminado exitosamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar el intensivo' }, { status: 500 });
  }
}
