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

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: withTenant({}, tenant),
      orderBy: { subscribedAt: 'desc' },
    });

    const stats = {
      total: subscribers.length,
      active: subscribers.filter((s) => s.isActive).length,
      inactive: subscribers.filter((s) => !s.isActive).length,
    };

    return NextResponse.json({ subscribers, stats });
  } catch (error) {
    console.error('Error newsletter:', error);
    return NextResponse.json({ error: 'Error al cargar los suscriptores' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    // Find and delete — scoped by tenant + email
    const sub = await prisma.newsletterSubscriber.findFirst({
      where: { email, ...(tenant ? { tenantId: tenant.tenantId } : {}) },
    });
    if (sub) {
      await prisma.newsletterSubscriber.delete({ where: { id: sub.id } });
    }

    return NextResponse.json({ message: 'Suscriptor eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminar suscriptor:', error);
    return NextResponse.json({ error: 'Error al eliminar el suscriptor' }, { status: 500 });
  }
}
