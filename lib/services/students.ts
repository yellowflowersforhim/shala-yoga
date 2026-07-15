/**
 * Student management service for teacher workspace.
 *
 * Teachers can view, filter, and manage students who have enrolled
 * in their programs. All queries are tenant-scoped.
 */

import { prisma } from "@/lib/prisma";
import { TenantContext } from "@/lib/tenant";

export interface StudentListFilters {
  search?: string;
  programId?: string;
  cohortId?: string;
  page?: number;
  pageSize?: number;
}

export interface StudentListResult {
  students: Array<{
    id: string;
    name: string | null;
    email: string | null;
    enrollments: Array<{
      id: string;
      status: string;
      enrolledAt: Date;
      cohort: { id: string; name: string; program: { id: string; title: string } };
    }>;
    totalOrders: number;
    totalSpentCents: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get paginated list of students with enrollments in this tenant.
 */
export async function getStudents(
  tenant: TenantContext,
  filters: StudentListFilters,
): Promise<StudentListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  // Build the where clause for enrollments to find relevant users
  const enrollmentWhere: any = {
    tenantId: tenant.tenantId,
    userId: { not: null },
  };

  if (filters.cohortId) {
    enrollmentWhere.cohortId = filters.cohortId;
  }

  if (filters.programId) {
    enrollmentWhere.cohort = { programId: filters.programId };
  }

  // Find distinct users who have matching enrollments
  const userIds = await prisma.enrollment.groupBy({
    by: ["userId"],
    where: enrollmentWhere,
  });

  // Extract non-null userIds
  const ids = userIds.map((e) => e.userId).filter(Boolean) as string[];

  if (ids.length === 0) {
    return { students: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Apply search filter on user names/emails
  const userWhere: any = {
    id: { in: ids },
  };

  if (filters.search) {
    const search = filters.search;
    userWhere.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Fetch enrollments and order summaries for the current page's users
  const pageUserIds = users.map((u) => u.id);

  const [enrollments, orderAggs] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        tenantId: tenant.tenantId,
        userId: { in: pageUserIds },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        enrolledAt: true,
        cohort: {
          select: {
            id: true,
            name: true,
            program: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    // Aggregate paid orders per user
    prisma.order.groupBy({
      by: ["userId"],
      where: {
        tenantId: tenant.tenantId,
        userId: { in: pageUserIds },
        status: "paid",
      },
      _count: { id: true },
      _sum: { totalCents: true },
    }),
  ]);

  // Build lookup maps
  const enrollmentsByUser = new Map<string, typeof enrollments>();
  for (const e of enrollments) {
    if (!e.userId) continue;
    const arr = enrollmentsByUser.get(e.userId) || [];
    arr.push(e);
    enrollmentsByUser.set(e.userId, arr);
  }

  const orderAggsByUser = new Map<
    string,
    { totalOrders: number; totalSpentCents: number }
  >();
  for (const a of orderAggs) {
    if (!a.userId) continue;
    orderAggsByUser.set(a.userId, {
      totalOrders: a._count.id,
      totalSpentCents: a._sum.totalCents ?? 0,
    });
  }

  const students = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    enrollments: enrollmentsByUser.get(u.id) || [],
    totalOrders: orderAggsByUser.get(u.id)?.totalOrders ?? 0,
    totalSpentCents: orderAggsByUser.get(u.id)?.totalSpentCents ?? 0,
  }));

  return {
    students,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get detailed view of a single student.
 * Only returns data if the student has at least one enrollment in this tenant.
 */
export async function getStudentDetail(
  tenant: TenantContext,
  studentId: string,
) {
  // Verify user has an enrollment in this tenant
  const enrollmentExists = await prisma.enrollment.findFirst({
    where: { tenantId: tenant.tenantId, userId: studentId },
    select: { id: true },
  });

  if (!enrollmentExists) return null;

  const user = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      enrollments: {
        where: { tenantId: tenant.tenantId },
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          cohort: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              program: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      },
      orders: {
        where: { tenantId: tenant.tenantId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          currency: true,
          paidAt: true,
          createdAt: true,
          cohort: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return user;
}

/**
 * Get admin notes for a specific student in this tenant.
 */
export async function getStudentNotes(
  tenant: TenantContext,
  studentId: string,
) {
  return prisma.adminNote.findMany({
    where: {
      tenantId: tenant.tenantId,
      userId: studentId,
    },
    include: {
      admin: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Create an admin note for a student.
 */
export async function createStudentNote(
  tenant: TenantContext,
  studentId: string,
  adminId: string,
  content: string,
  category: string = "general",
) {
  return prisma.adminNote.create({
    data: {
      tenantId: tenant.tenantId,
      userId: studentId,
      adminId,
      content,
      category,
    },
    include: {
      admin: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Get active programs and cohorts for filter dropdowns.
 */
export async function getProgramsAndCohorts(tenant: TenantContext) {
  const [programs, cohorts] = await Promise.all([
    prisma.program.findMany({
      where: { tenantId: tenant.tenantId, isActive: true },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
    prisma.cohort.findMany({
      where: { tenantId: tenant.tenantId },
      select: {
        id: true,
        name: true,
        programId: true,
        startDate: true,
        endDate: true,
        program: { select: { id: true, title: true } },
      },
      orderBy: { startDate: "desc" },
      take: 200,
    }),
  ]);

  return { programs, cohorts };
}
