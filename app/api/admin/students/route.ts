import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { cleanText } from '@/lib/security';
import { getTenantFromRequest } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenant = await getTenantFromRequest(req.headers);

    const { searchParams } = new URL(req.url);
    const search = cleanText(searchParams.get('search'), 100);
    const requestedStatus = searchParams.get('status') || 'all';
    const status = ['all', 'active', 'completed'].includes(requestedStatus) ? requestedStatus : 'all';

    const students = await prisma.user.findMany({
      where: {
        isAdmin: false,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        enrollments: {
          where: tenant ? { tenantId: tenant.tenantId } : {},
          include: {
            cohort: { include: { program: true } },
          },
        },
        orders: {
          where: { status: 'paid', ...(tenant ? { tenantId: tenant.tenantId } : {}) },
        },
        notesAboutMe: {
          where: tenant ? { tenantId: tenant.tenantId } : {},
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const studentsData = students.map((student: any) => {
      const activeEnrollments = student.enrollments.filter((e: any) => e.status === 'active').length;
      const completedEnrollments = student.enrollments.filter((e: any) => e.status === 'completed').length;
      const totalSpent = student.orders.reduce((sum: number, order: any) => sum + order.totalCents, 0);

      return {
        id: student.id,
        name: student.name || 'Sin nombre',
        email: student.email,
        createdAt: student.createdAt,
        activeEnrollments,
        completedEnrollments,
        totalEnrollments: student.enrollments.length,
        totalSpent: totalSpent / 100,
        hasNotes: student.notesAboutMe.length > 0,
      };
    });

    let filteredStudents = studentsData;
    if (status === 'active') {
      filteredStudents = studentsData.filter((s: any) => s.activeEnrollments > 0);
    } else if (status === 'completed') {
      filteredStudents = studentsData.filter((s: any) => s.completedEnrollments > 0 && s.activeEnrollments === 0);
    }

    return NextResponse.json(filteredStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Error al obtener estudiantes' }, { status: 500 });
  }
}
