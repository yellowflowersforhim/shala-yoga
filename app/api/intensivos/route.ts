

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.isAdmin === true;
    const tenant = await getTenantFromRequest(request.headers);
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    const where = {
      ...withTenant({}, tenant),
      ...(programId ? { programId } : {}),
      ...(isAdmin ? {} : { isPublished: true }),
    };

    const cohorts = await prisma.cohort.findMany({
      where,
      include: {
        program: true,
        _count: {
          select: { enrollments: { where: { status: 'active' } } },
        },
      },
      orderBy: { startDate: 'asc' }
    });

    return NextResponse.json({
      cohorts: cohorts.map(({ _count, ...cohort }) => ({
        ...cohort,
        enrolledCount: _count.enrollments,
      })),
    });
  } catch (error) {
    console.error('Get cohorts error:', error);
    return NextResponse.json(
      { error: 'Error al obtener intensivos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const {
      programId,
      name,
      startDate,
      endDate,
      maxSeats,
      scheduleText,
      location,
      isPublished,
      enrollmentOpensAt,
      enrollmentClosesAt
    } = body;

    if (!programId || !name || !startDate || !endDate || !maxSeats || !scheduleText || !location) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser completados' },
        { status: 400 }
      );
    }

    const cohort = await prisma.cohort.create({
      data: {
        programId,
        name,
        tenantId: tenant?.tenantId || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxSeats: parseInt(maxSeats),
        scheduleText,
        location,
        isPublished: isPublished || false,
        enrollmentOpensAt: enrollmentOpensAt ? new Date(enrollmentOpensAt) : null,
        enrollmentClosesAt: enrollmentClosesAt ? new Date(enrollmentClosesAt) : null
      }
    });

    return NextResponse.json(
      { message: 'Intensivo creado exitosamente', cohort },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create cohort error:', error);
    return NextResponse.json(
      { error: 'Error al crear el intensivo' },
      { status: 500 }
    );
  }
}
