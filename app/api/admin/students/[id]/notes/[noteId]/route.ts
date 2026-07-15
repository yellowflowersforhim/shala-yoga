
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(req.headers);
    const result = await prisma.adminNote.deleteMany({ where: withTenant({ id: noteId, userId: id }, tenant) });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la nota' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(req.headers);

    const body = await req.json();
    const { category, content } = body;

    const existingNote = await prisma.adminNote.findFirst({
      where: { id: noteId, userId: id },
      select: { id: true },
    });
    if (!existingNote) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
    }

    const note = await prisma.adminNote.update({
      where: withTenant({ id: noteId }, tenant),
      data: {
        ...(category && { category }),
        ...(content && { content: content.trim() }),
      },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la nota' },
      { status: 500 }
    );
  }
}
