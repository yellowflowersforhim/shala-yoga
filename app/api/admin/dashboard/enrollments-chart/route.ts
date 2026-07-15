import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(req.headers);

    const programs = await prisma.program.findMany({
      where: withTenant({}, tenant),
      include: { cohorts: { include: { _count: { select: { enrollments: true } } } } },
    });

    const programsData = programs.map((program) => ({
      program: program.title,
      enrollments: program.cohorts.reduce((sum, c) => sum + c._count.enrollments, 0),
    })).sort((a, b) => b.enrollments - a.enrollments);

    return NextResponse.json(programsData);
  } catch (error) {
    console.error('Enrollments chart error:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
