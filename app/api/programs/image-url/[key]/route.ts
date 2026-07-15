
import { NextRequest, NextResponse } from 'next/server';
import { downloadFile } from '@/lib/s3';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key: encodedKey } = await params;
    const key = decodeURIComponent(encodedKey);
    const session = await getServerSession(authOptions);
    const program = await prisma.program.findFirst({
      where: {
        imageUrl: key,
        ...(session?.user?.isAdmin ? {} : { isActive: true }),
      },
      select: { id: true },
    });

    if (!program) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    const signedUrl = await downloadFile(key);
    
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Get image URL error:', error);
    return NextResponse.json(
      { error: 'Error al obtener la URL de la imagen' },
      { status: 500 }
    );
  }
}
