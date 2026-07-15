
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { deleteFile } from '@/lib/s3';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const program = await prisma.program.findUnique({
      where: { id },
      select: { imageUrl: true }
    });

    if (!program || !program.imageUrl) {
      return NextResponse.json({ error: 'Programa o imagen no encontrada' }, { status: 404 });
    }

    // Delete from S3
    await deleteFile(program.imageUrl);

    // Update database
    await prisma.program.update({
      where: { id },
      data: { imageUrl: null }
    });

    return NextResponse.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la imagen' },
      { status: 500 }
    );
  }
}
