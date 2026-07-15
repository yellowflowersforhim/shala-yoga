import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notifications = await db.notification.findMany({
      where: withTenant({
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      }, tenant),
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await db.notification.updateMany({
        where: withTenant({ userId: session.user.id, isRead: false }, tenant),
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ message: 'Todas las notificaciones marcadas como leídas' });
    }

    if (notificationId) {
      const result = await db.notification.updateMany({
        where: withTenant({ id: notificationId, userId: session.user.id }, tenant),
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      if (result.count === 0) {
        return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Error al actualizar notificaciones' }, { status: 500 });
  }
}
