/**
 * Tenant-scoped service for Orders, Enrollments, and Coupons.
 */

import { prisma } from '@/lib/prisma';
import { TenantContext } from '@/lib/tenant';
import type { Order, Enrollment, Coupon } from '@prisma/client';

// ── Orders ────────────────────────────────────────────────────────────────

export type OrderWithDetails = Order & {
  user: { name: string | null; email: string | null } | null;
  cohort: { name: string; startDate: Date; program: { title: string } } | null;
};

export async function getOrders(
  tenant: TenantContext,
  { status }: { status?: string } = {}
): Promise<OrderWithDetails[]> {
  return prisma.order.findMany({
    where: {
      tenantId: tenant.tenantId,
      ...(status ? { status } : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      cohort: {
        select: { name: true, startDate: true, program: { select: { title: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrderById(
  tenant: TenantContext,
  id: string
): Promise<OrderWithDetails | null> {
  return prisma.order.findFirst({
    where: { id, tenantId: tenant.tenantId },
    include: {
      user: { select: { name: true, email: true } },
      cohort: {
        select: { name: true, startDate: true, program: { select: { title: true } } },
      },
    },
  });
}

export async function getOrderByOrderNumber(
  tenant: TenantContext,
  orderNumber: string
): Promise<Order | null> {
  return prisma.order.findFirst({
    where: {
      tenantId: tenant.tenantId,
      orderNumber,
    },
  });
}

// ── Enrollments ───────────────────────────────────────────────────────────

export type EnrollmentWithDetails = Enrollment & {
  user: { name: string | null; email: string | null } | null;
  cohort: { name: string; startDate: Date; endDate: Date; program: { title: string } } | null;
};

export async function getEnrollments(
  tenant: TenantContext,
  { status }: { status?: string } = {}
): Promise<EnrollmentWithDetails[]> {
  return prisma.enrollment.findMany({
    where: {
      tenantId: tenant.tenantId,
      ...(status ? { status } : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      cohort: {
        select: { name: true, startDate: true, endDate: true, program: { select: { title: true } } },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });
}

export type EnrollmentWithStudent = Enrollment & {
  cohort: { name: string; startDate: Date; endDate: Date; program: { title: string } } | null;
};

export async function getEnrollmentsByStudent(
  tenant: TenantContext,
  userId: string
): Promise<EnrollmentWithStudent[]> {
  return prisma.enrollment.findMany({
    where: {
      tenantId: tenant.tenantId,
      userId,
    },
    include: {
      cohort: {
        select: { name: true, startDate: true, endDate: true, program: { select: { title: true } } },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });
}

// ── Coupons ───────────────────────────────────────────────────────────────

export async function getCoupons(
  tenant: TenantContext,
  { isActive }: { isActive?: boolean } = {}
): Promise<Coupon[]> {
  return prisma.coupon.findMany({
    where: {
      tenantId: tenant.tenantId,
      ...(isActive !== undefined ? { isActive } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCouponByCode(
  tenant: TenantContext,
  code: string
): Promise<Coupon | null> {
  return prisma.coupon.findFirst({
    where: {
      tenantId: tenant.tenantId,
      code: code.trim().toUpperCase(),
    },
  });
}

export async function createCoupon(
  tenant: TenantContext,
  data: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    maxUses?: number;
    validFrom?: Date;
    validUntil?: Date;
    minPurchaseCents?: number;
  }
): Promise<Coupon> {
  return prisma.coupon.create({
    data: {
      ...data,
      code: data.code.trim().toUpperCase(),
      tenantId: tenant.tenantId,
    },
  });
}

// ── Tenant-scoped revenue stats ───────────────────────────────────────────

export async function getRevenueStats(tenant: TenantContext): Promise<{
  totalRevenueCents: number;
  orderCount: number;
  enrollmentCount: number;
}> {
  const paidOrders = await prisma.order.aggregate({
    where: {
      tenantId: tenant.tenantId,
      status: 'paid',
    },
    _sum: { totalCents: true },
    _count: true,
  });

  const activeEnrollments = await prisma.enrollment.count({
    where: {
      tenantId: tenant.tenantId,
      status: 'active',
    },
  });

  return {
    totalRevenueCents: paidOrders._sum.totalCents ?? 0,
    orderCount: paidOrders._count,
    enrollmentCount: activeEnrollments,
  };
}

// ── Student CRM ───────────────────────────────────────────────────────────

export type StudentWithEnrollments = {
  userId: string;
  name: string | null;
  email: string | null;
  enrollmentCount: number;
  lastEnrollment: Date | null;
};

export async function getStudents(
  tenant: TenantContext,
  { search }: { search?: string } = {}
): Promise<StudentWithEnrollments[]> {
  const enrollments = await prisma.enrollment.groupBy({
    by: ['userId'],
    where: {
      tenantId: tenant.tenantId,
      userId: { not: null },
    },
    _count: { id: true },
    _max: { enrolledAt: true },
  });

  if (enrollments.length === 0) return [];

  const userIds = enrollments.map((e) => e.userId).filter(Boolean) as string[];

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return enrollments
    .filter((e) => userMap.has(e.userId!))
    .map((e) => {
      const user = userMap.get(e.userId!)!;
      return {
        userId: e.userId!,
        name: user.name,
        email: user.email,
        enrollmentCount: e._count.id,
        lastEnrollment: e._max.enrolledAt,
      };
    });
}
