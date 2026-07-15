import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { normalizeHostname, extractSlugFromHostname } from '@/lib/tenant';
import { getTenantFromRequest } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const tenant = await getTenantFromRequest(request.headers);

    const programs = await prisma.program.findMany({
      where: { isActive: true, ...(tenant ? { tenantId: tenant.tenantId } : {}) },
      include: {
        cohorts: {
          where: { isPublished: true },
          include: {
            enrollments: { where: { userId: userId || '__anonymous__', status: 'active' }, select: { id: true } },
            _count: { select: { enrollments: { where: { status: 'active' } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const programsWithEnrollmentStatus = programs.map((program) => ({
      ...program,
      cohorts: program.cohorts.map(({ enrollments, _count, ...cohort }) => ({
        ...cohort,
        enrolledCount: _count.enrollments,
        isUserEnrolled: userId ? enrollments.length > 0 : false,
      })),
    }));

    return NextResponse.json({ programs: programsWithEnrollmentStatus });
  } catch (error) {
    console.error('Get programs error:', error);
    return NextResponse.json({ error: 'Error al obtener programas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const { title, slug, description, durationWeeks, priceCents, currency, isActive, imageUrl } = body;

    if (!title || !slug || !description || !durationWeeks || !priceCents) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const program = await prisma.program.create({
      data: {
        title, slug, description,
        durationWeeks: parseInt(durationWeeks),
        priceCents: parseInt(priceCents),
        currency: currency || 'EUR',
        imageUrl: imageUrl || null,
        isActive: isActive !== false,
        tenantId: tenant?.tenantId || (await getDefaultTenantId()),
      },
    });

    return NextResponse.json({ message: 'Programa creado exitosamente', program }, { status: 201 });
  } catch (error) {
    console.error('Create program error:', error);
    if (error instanceof Error && error.message === 'TENANT_REQUIRED') {
      return NextResponse.json({ error: 'No se pudo resolver el tenant. Usa un dominio válido.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear el programa' }, { status: 500 });
  }
}

async function getDefaultTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
  return tenant?.id || '';
}
