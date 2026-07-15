/**
 * Phase 3: Brand and website services.
 * Tenant-scoped operations for profile, theme, settings, pages, media.
 */

import { prisma } from '@/lib/prisma';
import { TenantContext } from '@/lib/tenant';
import type { TeacherProfile, BrandTheme, SiteSettings, Page, PageRevision, MediaAsset } from '@prisma/client';

// ── Teacher Profile ───────────────────────────────────────────────────────

export async function getProfile(tenant: TenantContext): Promise<TeacherProfile | null> {
  return prisma.teacherProfile.findUnique({
    where: { tenantId: tenant.tenantId },
  });
}

export async function upsertProfile(
  tenant: TenantContext,
  data: {
    displayName: string;
    title?: string;
    bio?: string;
    qualifications?: string;
    languages?: string[];
    portraitUrl?: string;
    location?: string;
    contactEmail?: string;
    contactPhone?: string;
    whatsappNumber?: string;
    socialLinks?: Record<string, string>;
  }
): Promise<TeacherProfile> {
  return prisma.teacherProfile.upsert({
    where: { tenantId: tenant.tenantId },
    create: { ...data, tenantId: tenant.tenantId },
    update: data,
  });
}

// ── Brand Theme ───────────────────────────────────────────────────────────

const NEUTRAL_THEME = {
  primaryColor: '#0f766e',
  secondaryColor: '#14b8a6',
  accentColor: '#f59e0b',
  headingFont: 'inter',
  bodyFont: 'inter',
  borderRadius: 'md',
  buttonStyle: 'rounded',
};

export async function getTheme(tenant: TenantContext): Promise<BrandTheme> {
  const existing = await prisma.brandTheme.findUnique({
    where: { tenantId: tenant.tenantId },
  });
  if (existing) return existing;

  // Return neutral defaults for new tenants
  return prisma.brandTheme.create({
    data: { tenantId: tenant.tenantId, ...NEUTRAL_THEME },
  });
}

export async function updateTheme(
  tenant: TenantContext,
  data: Partial<Pick<BrandTheme, 'primaryColor' | 'secondaryColor' | 'accentColor' | 'headingFont' | 'bodyFont' | 'logoUrl' | 'faviconUrl'>>
): Promise<BrandTheme> {
  return prisma.brandTheme.update({
    where: { tenantId: tenant.tenantId },
    data,
  });
}

// ── Site Settings ─────────────────────────────────────────────────────────

export async function getSettings(tenant: TenantContext): Promise<SiteSettings | null> {
  return prisma.siteSettings.findUnique({
    where: { tenantId: tenant.tenantId },
  });
}

export async function upsertSettings(
  tenant: TenantContext,
  data: {
    siteTitle: string;
    siteDescription?: string;
    heroHeadline?: string;
    heroSubheadline?: string;
    primaryCtaText?: string;
    primaryCtaUrl?: string;
    analyticsId?: string;
  }
): Promise<SiteSettings> {
  return prisma.siteSettings.upsert({
    where: { tenantId: tenant.tenantId },
    create: { ...data, tenantId: tenant.tenantId },
    update: data,
  });
}

export async function publishSite(tenant: TenantContext): Promise<SiteSettings> {
  return prisma.siteSettings.update({
    where: { tenantId: tenant.tenantId },
    data: { isPublished: true },
  });
}

export async function unpublishSite(tenant: TenantContext): Promise<SiteSettings> {
  return prisma.siteSettings.update({
    where: { tenantId: tenant.tenantId },
    data: { isPublished: false },
  });
}

// ── Pages ─────────────────────────────────────────────────────────────────

export async function getPages(tenant: TenantContext): Promise<Page[]> {
  return prisma.page.findMany({
    where: { tenantId: tenant.tenantId },
    include: { revisions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getPageByRoute(
  tenant: TenantContext,
  routeKey: string
): Promise<(Page & { revisions: PageRevision[] }) | null> {
  return prisma.page.findUnique({
    where: { tenantId_routeKey: { tenantId: tenant.tenantId, routeKey } },
    include: { revisions: { orderBy: { createdAt: 'desc' } } },
  });
}

export async function createPageRevision(
  tenant: TenantContext,
  pageId: string,
  sections: unknown[],
  createdBy?: string
): Promise<PageRevision> {
  const page = await prisma.page.findFirst({
    where: { id: pageId, tenantId: tenant.tenantId },
  });
  if (!page) throw new Error('Page not found');

  return prisma.pageRevision.create({
    data: {
      pageId,
      sections: sections as object,
      status: 'draft',
      createdBy,
    },
  });
}

export async function publishPageRevision(
  tenant: TenantContext,
  revisionId: string
): Promise<PageRevision> {
  const revision = await prisma.pageRevision.findUnique({
    where: { id: revisionId },
    include: { page: true },
  });

  if (!revision || revision.page.tenantId !== tenant.tenantId) {
    throw new Error('Revision not found');
  }

  // Mark all revisions as draft
  await prisma.pageRevision.updateMany({
    where: { pageId: revision.pageId },
    data: { status: 'draft' },
  });

  // Publish this revision
  return prisma.pageRevision.update({
    where: { id: revisionId },
    data: { status: 'published', publishedAt: new Date() },
  });
}

export async function getPublishedPage(
  tenant: TenantContext,
  routeKey: string
): Promise<(Page & { revisions: PageRevision[] }) | null> {
  const page = await prisma.page.findFirst({
    where: {
      tenantId: tenant.tenantId,
      routeKey,
      isPublished: true,
      revisions: { some: { status: 'published' } },
    },
    include: {
      revisions: {
        where: { status: 'published' },
        orderBy: { publishedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!page) return null;
  return page;
}

// ── Media ─────────────────────────────────────────────────────────────────

export async function getMedia(tenant: TenantContext): Promise<MediaAsset[]> {
  return prisma.mediaAsset.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createMediaAsset(
  tenant: TenantContext,
  data: {
    objectKey: string;
    originalName: string;
    contentType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
    altText?: string;
    uploadedBy?: string;
  }
): Promise<MediaAsset> {
  // Enforce tenant prefix on object keys
  const prefix = `${tenant.tenantId}/uploads/`;
  const key = data.objectKey.startsWith(prefix)
    ? data.objectKey
    : `${prefix}${data.objectKey}`;

  return prisma.mediaAsset.create({
    data: { ...data, objectKey: key, tenantId: tenant.tenantId },
  });
}

export async function deleteMediaAsset(
  tenant: TenantContext,
  id: string
): Promise<boolean> {
  const asset = await prisma.mediaAsset.findFirst({
    where: { id, tenantId: tenant.tenantId },
  });
  if (!asset) return false;

  await prisma.mediaAsset.delete({ where: { id } });
  return true;
}
