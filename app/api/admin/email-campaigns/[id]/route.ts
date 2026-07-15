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

    const campaign = await prisma.emailCampaign.findFirst({ where: withTenant({ id }, tenant) });
    if (!campaign) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(campaign);
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);
    const existing = await prisma.emailCampaign.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const body = await request.json();
    const campaign = await prisma.emailCampaign.update({ where: { id }, data: body });
    return NextResponse.json(campaign);
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const tenant = await getTenantFromRequest(request.headers);
    const existing = await prisma.emailCampaign.findFirst({ where: withTenant({ id }, tenant) });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    await prisma.emailCampaign.delete({ where: { id } });
    return NextResponse.json({ message: 'Eliminado' });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
