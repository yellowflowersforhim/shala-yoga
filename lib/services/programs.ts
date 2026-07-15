/**
 * Tenant-scoped service for Programs and Cohorts.
 *
 * Every read/write enforces tenant scope — never queries by global ID alone.
 */

import { prisma } from '@/lib/prisma';
import { TenantContext } from '@/lib/tenant';
import type { Program, Cohort, Prisma } from '@prisma/client';

// ── Programs ──────────────────────────────────────────────────────────────

export type ProgramWithCohorts = Program & {
  cohorts: Cohort[];
};

export async function getPrograms(
  tenant: TenantContext,
  { isActive }: { isActive?: boolean } = {}
): Promise<ProgramWithCohorts[]> {
  return prisma.program.findMany({
    where: {
      tenantId: tenant.tenantId,
      ...(isActive !== undefined ? { isActive } : {}),
    },
    include: { cohorts: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProgramBySlug(
  tenant: TenantContext,
  slug: string
): Promise<ProgramWithCohorts | null> {
  return prisma.program.findFirst({
    where: {
      tenantId: tenant.tenantId,
      slug,
    },
    include: { cohorts: true },
  });
}

export async function getProgramById(
  tenant: TenantContext,
  id: string
): Promise<Program | null> {
  return prisma.program.findFirst({
    where: {
      id,
      tenantId: tenant.tenantId,
    },
  });
}

export async function createProgram(
  tenant: TenantContext,
  data: {
    slug: string;
    title: string;
    description: string;
    durationWeeks: number;
    priceCents: number;
    currency?: string;
    imageUrl?: string;
  }
): Promise<Program> {
  return prisma.program.create({
    data: {
      ...data,
      tenantId: tenant.tenantId,
      currency: data.currency || tenant.currency,
    },
  });
}

export async function updateProgram(
  tenant: TenantContext,
  id: string,
  data: Partial<Pick<Program, 'title' | 'description' | 'durationWeeks' | 'priceCents' | 'imageUrl' | 'isActive'>>
): Promise<Program | null> {
  const program = await prisma.program.findFirst({
    where: { id, tenantId: tenant.tenantId },
  });
  if (!program) return null;

  return prisma.program.update({
    where: { id },
    data,
  });
}

export async function deleteProgram(
  tenant: TenantContext,
  id: string
): Promise<boolean> {
  const program = await prisma.program.findFirst({
    where: { id, tenantId: tenant.tenantId },
  });
  if (!program) return false;

  await prisma.program.delete({ where: { id } });
  return true;
}

// ── Cohorts ───────────────────────────────────────────────────────────────

export type CohortWithProgram = Cohort & {
  program: Program;
  _count?: { enrollments: number };
};

export async function getCohorts(
  tenant: TenantContext,
  { isPublished }: { isPublished?: boolean } = {}
): Promise<CohortWithProgram[]> {
  return prisma.cohort.findMany({
    where: {
      tenantId: tenant.tenantId,
      ...(isPublished !== undefined ? { isPublished } : {}),
    },
    include: {
      program: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function getPublishedCohorts(
  tenant: TenantContext
): Promise<CohortWithProgram[]> {
  return prisma.cohort.findMany({
    where: {
      tenantId: tenant.tenantId,
      isPublished: true,
    },
    include: {
      program: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function getCohortById(
  tenant: TenantContext,
  id: string
): Promise<CohortWithProgram | null> {
  return prisma.cohort.findFirst({
    where: {
      id,
      tenantId: tenant.tenantId,
    },
    include: {
      program: true,
      _count: { select: { enrollments: true } },
    },
  });
}

export async function createCohort(
  tenant: TenantContext,
  data: {
    programId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    maxSeats: number;
    scheduleText: string;
    location: string;
    language?: string;
    isPublished?: boolean;
    enrollmentOpensAt?: Date;
    enrollmentClosesAt?: Date;
  }
): Promise<Cohort> {
  // Verify program belongs to this tenant
  const program = await prisma.program.findFirst({
    where: { id: data.programId, tenantId: tenant.tenantId },
  });
  if (!program) throw new Error('Program not found in this tenant');

  return prisma.cohort.create({
    data: {
      ...data,
      tenantId: tenant.tenantId,
    },
  });
}

export async function updateCohort(
  tenant: TenantContext,
  id: string,
  data: Partial<Pick<Cohort, 'name' | 'startDate' | 'endDate' | 'maxSeats' | 'scheduleText' | 'location' | 'isPublished' | 'enrollmentOpensAt' | 'enrollmentClosesAt'>>
): Promise<Cohort | null> {
  const cohort = await prisma.cohort.findFirst({
    where: { id, tenantId: tenant.tenantId },
  });
  if (!cohort) return null;

  return prisma.cohort.update({
    where: { id },
    data,
  });
}

export async function deleteCohort(
  tenant: TenantContext,
  id: string
): Promise<boolean> {
  const cohort = await prisma.cohort.findFirst({
    where: { id, tenantId: tenant.tenantId },
  });
  if (!cohort) return false;

  await prisma.cohort.delete({ where: { id } });
  return true;
}
