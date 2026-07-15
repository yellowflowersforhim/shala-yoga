import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);
    const existing = await prisma.feedback.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const body = await request.json();
    const updated = await prisma.feedback.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);
    const existing = await prisma.feedback.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    await prisma.feedback.delete({ where: { id } });
    return NextResponse.json({ message: 'Eliminado' });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
