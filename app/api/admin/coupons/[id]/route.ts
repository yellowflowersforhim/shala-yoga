import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);

    const coupon = await prisma.coupon.findFirst({ where: withTenant({ id }, tenant), include: { _count: { select: { orders: true } } } });
    if (!coupon) return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);
    const existing = await prisma.coupon.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });

    const body = await request.json();
    const coupon = await prisma.coupon.update({ where: { id }, data: body });
    return NextResponse.json({ message: 'Cupón actualizado', coupon });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);
    const existing = await prisma.coupon.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ message: 'Cupón eliminado' });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
