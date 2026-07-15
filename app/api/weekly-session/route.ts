import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request.headers);
    const session = await prisma.weeklySession.findFirst({ where: withTenant({}, tenant), orderBy: { createdAt: 'desc' } });
    return NextResponse.json(session || null);
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const data = { ...body, tenantId: tenant?.tenantId || '' };

    // Upsert: update existing or create new
    const existing = tenant ? await prisma.weeklySession.findFirst({ where: { tenantId: tenant.tenantId } }) : null;
    const result = existing
      ? await prisma.weeklySession.update({ where: { id: existing.id }, data })
      : await prisma.weeklySession.create({ data });

    return NextResponse.json(result);
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const existing = tenant ? await prisma.weeklySession.findFirst({ where: { tenantId: tenant.tenantId } }) : null;
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const updated = await prisma.weeklySession.update({ where: { id: existing.id }, data: body });
    return NextResponse.json(updated);
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
