/**
 * Phase 5: Teacher workspace and student app services.
 */

import { prisma } from '@/lib/prisma';
import { TenantContext } from '@/lib/tenant';
import type { Notification } from '@prisma/client';

// ── Workspace onboarding ──────────────────────────────────────────────────

export type OnboardingStep =
  | 'create_profile'
  | 'add_program'
  | 'create_cohort'
  | 'configure_brand'
  | 'publish_site'
  | 'connect_stripe'
  | 'invite_team';

export async function getOnboardingProgress(
  tenant: TenantContext
): Promise<{ completed: OnboardingStep[]; pending: OnboardingStep[] }> {
  const [profile, programs, theme, settings, cohortsCount, tenantRecord, teamCount] = await Promise.all([
    prisma.teacherProfile.findUnique({ where: { tenantId: tenant.tenantId } }),
    prisma.program.count({ where: { tenantId: tenant.tenantId } }),
    prisma.brandTheme.findUnique({ where: { tenantId: tenant.tenantId } }),
    prisma.siteSettings.findUnique({ where: { tenantId: tenant.tenantId } }),
    prisma.cohort.count({ where: { tenantId: tenant.tenantId } }),
    prisma.tenant.findUnique({ where: { id: tenant.tenantId }, select: { stripeAccountId: true } }),
    prisma.tenantMembership.count({ where: { tenantId: tenant.tenantId, status: 'active' } }),
  ]);

  const completed: OnboardingStep[] = [];
  if (profile) completed.push('create_profile');
  if (programs > 0) completed.push('add_program');
  if (cohortsCount > 0) completed.push('create_cohort');
  if (theme) completed.push('configure_brand');
  if (settings?.isPublished) completed.push('publish_site');
  if (tenantRecord?.stripeAccountId) completed.push('connect_stripe');
  if (teamCount > 1) completed.push('invite_team');

  const all: OnboardingStep[] = [
    'create_profile', 'add_program', 'create_cohort',
    'configure_brand', 'publish_site', 'connect_stripe', 'invite_team',
  ];
  const pending = all.filter((s) => !completed.includes(s));

  return { completed, pending };
}

// ── Teacher dashboard stats ───────────────────────────────────────────────

export async function getTeacherDashboard(
  tenant: TenantContext
): Promise<{
  activePrograms: number;
  upcomingCohorts: number;
  totalStudents: number;
  totalEnrollments: number;
  revenueThisMonthCents: number;
}> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activePrograms, upcomingCohorts, totalEnrollments, revenue] =
    await Promise.all([
      prisma.program.count({
        where: { tenantId: tenant.tenantId, isActive: true },
      }),
      prisma.cohort.count({
        where: {
          tenantId: tenant.tenantId,
          startDate: { gte: now },
          isPublished: true,
        },
      }),
      prisma.enrollment.count({
        where: { tenantId: tenant.tenantId, status: 'active' },
      }),
      prisma.order.aggregate({
        where: {
          tenantId: tenant.tenantId,
          status: 'paid',
          paidAt: { gte: monthStart },
        },
        _sum: { totalCents: true },
      }),
    ]);

  // Count unique students
  const studentCount = await prisma.enrollment.groupBy({
    by: ['userId'],
    where: {
      tenantId: tenant.tenantId,
      userId: { not: null },
      status: 'active',
    },
  });

  return {
    activePrograms,
    upcomingCohorts,
    totalStudents: studentCount.length,
    totalEnrollments,
    revenueThisMonthCents: revenue._sum.totalCents ?? 0,
  };
}

// ── Team management ───────────────────────────────────────────────────────

export async function getTeamMembers(tenant: TenantContext) {
  return prisma.tenantMembership.findMany({
    where: { tenantId: tenant.tenantId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function inviteTeamMember(
  tenant: TenantContext,
  email: string,
  role: string,
  invitedBy: string
): Promise<void> {
  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found. They must register first.');

  // Check existing membership
  const existing = await prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId: tenant.tenantId, userId: user.id } },
  });
  if (existing) throw new Error('User is already a member');

  await prisma.tenantMembership.create({
    data: {
      tenantId: tenant.tenantId,
      userId: user.id,
      role: role as any,
      status: 'active',
      invitedBy,
      invitedAt: new Date(),
      acceptedAt: new Date(),
    },
  });
}

export async function removeTeamMember(
  tenant: TenantContext,
  userId: string
): Promise<void> {
  const membership = await prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId: tenant.tenantId, userId } },
  });
  if (!membership) throw new Error('Membership not found');

  // Last-owner invariant
  if (membership.role === 'OWNER') {
    const ownersCount = await prisma.tenantMembership.count({
      where: { tenantId: tenant.tenantId, role: 'OWNER', status: 'active' },
    });
    if (ownersCount <= 1) {
      throw new Error('Cannot remove the last owner');
    }
  }

  await prisma.tenantMembership.delete({
    where: { id: membership.id },
  });
}

// ── Notifications ─────────────────────────────────────────────────────────

export async function createNotification(
  tenant: TenantContext,
  userId: string,
  data: { type: string; title: string; message: string; link?: string }
): Promise<Notification> {
  return prisma.notification.create({
    data: {
      tenantId: tenant.tenantId,
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    },
  });
}

export async function getNotifications(
  tenant: TenantContext,
  userId: string,
  { unreadOnly = false }: { unreadOnly?: boolean } = {}
): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: {
      tenantId: tenant.tenantId,
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markNotificationRead(
  tenant: TenantContext,
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      tenantId: tenant.tenantId,
      userId,
    },
    data: { isRead: true, readAt: new Date() },
  });
}

// ── Attendance tracking ───────────────────────────────────────────────────

export async function getAttendanceForCohort(
  tenant: TenantContext,
  cohortId: string
) {
  // Verify cohort belongs to tenant
  const cohort = await prisma.cohort.findFirst({
    where: { id: cohortId, tenantId: tenant.tenantId },
  });
  if (!cohort) throw new Error('Cohort not found');

  return prisma.enrollment.findMany({
    where: {
      cohortId,
      tenantId: tenant.tenantId,
      status: { in: ['active', 'completed'] },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function completeEnrollment(
  tenant: TenantContext,
  enrollmentId: string
): Promise<void> {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tenantId: tenant.tenantId },
  });
  if (!enrollment) throw new Error('Enrollment not found');

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: 'completed' },
  });
}

// ── Refunds ───────────────────────────────────────────────────────────────

export async function createRefund(
  tenant: TenantContext,
  orderId: string,
  reason: string,
  amountCents?: number
): Promise<void> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId: tenant.tenantId },
  });
  if (!order) throw new Error('Order not found');
  if (order.status !== 'paid') throw new Error('Only paid orders can be refunded');

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'refunded' },
  });

  // Cancel associated enrollment
  await prisma.enrollment.updateMany({
    where: { orderId, tenantId: tenant.tenantId },
    data: { status: 'cancelled' },
  });

  // In production: create Stripe refund via platformStripe.refunds.create()
  console.log(`Refund: order ${orderId}, amount ${amountCents ?? order.totalCents}, reason: ${reason}`);
}
