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
    const campaigns = await prisma.emailCampaign.findMany({
      where: withTenant({}, tenant),
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true, email: true } } },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error campaigns:', error);
    return NextResponse.json({ error: 'Error al obtener campañas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const { name, subject, content, recipientType, recipientIds } = body;
    if (!name || !subject || !content || !recipientType) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        adminId: (session.user as any).id,
        name, subject, content, recipientType,
        recipientIds: recipientIds ? JSON.stringify(recipientIds) : null,
        status: 'draft',
        tenantId: tenant?.tenantId || '',
      },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error create campaign:', error);
    return NextResponse.json({ error: 'Error al crear campaña' }, { status: 500 });
  }
}
