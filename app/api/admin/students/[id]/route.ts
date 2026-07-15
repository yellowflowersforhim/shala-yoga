
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(req.headers);

    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        enrollments: {
          where: withTenant({}, tenant),
          include: {
            cohort: {
              include: {
                program: true,
              },
            },
            order: true,
          },
          orderBy: {
            enrolledAt: 'desc',
          },
        },
        orders: {
          where: withTenant({}, tenant),
          include: {
            cohort: {
              include: {
                program: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        notesAboutMe: {
          where: withTenant({}, tenant),
          include: {
            admin: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    // Calcular estadísticas
    const activeEnrollments = student.enrollments.filter(
      (e: any) => e.status === 'active'
    );
    const completedEnrollments = student.enrollments.filter(
      (e: any) => e.status === 'completed'
    );
    const totalSpent = student.orders
      .filter((o: any) => o.status === 'paid')
      .reduce((sum: number, order: any) => sum + order.totalCents, 0);

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      createdAt: student.createdAt,
      enrollments: student.enrollments.map((e: any) => ({
        id: e.id,
        status: e.status,
        enrolledAt: e.enrolledAt,
        cohort: {
          id: e.cohort.id,
          name: e.cohort.name,
          startDate: e.cohort.startDate,
          endDate: e.cohort.endDate,
          program: {
            title: e.cohort.program.title,
          },
        },
        order: {
          orderNumber: e.order.orderNumber,
          totalCents: e.order.totalCents,
        },
      })),
      orders: student.orders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalCents: o.totalCents,
        paidAt: o.paidAt,
        cohort: {
          name: o.cohort.name,
          program: {
            title: o.cohort.program.title,
          },
        },
      })),
      notes: student.notesAboutMe,
      stats: {
        activeEnrollments: activeEnrollments.length,
        completedEnrollments: completedEnrollments.length,
        totalEnrollments: student.enrollments.length,
        totalSpent: totalSpent / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalles del estudiante' },
      { status: 500 }
    );
  }
}
