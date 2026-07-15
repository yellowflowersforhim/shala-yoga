import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(req.headers);
    const body = await req.json();
    const { category, content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'El contenido de la nota es requerido' }, { status: 400 });
    }

    const note = await prisma.adminNote.create({
      data: {
        userId: id,
        adminId: (session.user as any).id as string,
        category: category || 'general',
        content: content.trim(),
        tenantId: tenant?.tenantId || '',
      },
      include: { admin: { select: { name: true, email: true } } },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Error al crear la nota' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(req.headers);
    const notes = await prisma.adminNote.findMany({
      where: withTenant({ userId: id }, tenant),
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Error al obtener notas' }, { status: 500 });
  }
}
