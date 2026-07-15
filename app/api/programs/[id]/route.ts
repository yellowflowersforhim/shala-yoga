import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);

    const program = await prisma.program.findFirst({
      where: withTenant({ id }, tenant),
      include: { cohorts: true },
    });
    if (!program) return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });
    return NextResponse.json({ program });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el programa' }, { status: 500 });
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
    const { title, description, durationWeeks, priceCents, currency, isActive, imageUrl } = body;

    const existing = await prisma.program.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });

    const program = await prisma.program.update({
      where: { id },
      data: { title, description, durationWeeks: parseInt(durationWeeks), priceCents: parseInt(priceCents), currency, isActive, imageUrl },
    });
    return NextResponse.json({ message: 'Programa actualizado', program });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
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

    const existing = await prisma.program.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });

    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ message: 'Programa eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
