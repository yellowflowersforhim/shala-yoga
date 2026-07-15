/**
 * Tenant resolution service.
 *
 * Resolves a tenant from the request hostname for production (subdomains)
 * or from a path parameter for local development (/t/[slug]).
 *
 * Resolution rules:
 * - Normalize hostname casing and remove port before lookup.
 * - Reject unknown, inactive, or unverified custom domains.
 * - Redirect aliases to canonical domain where applicable.
 * - Never allow a path slug to override an already resolved production host.
 */

import { prisma } from '@/lib/prisma';

export type TenantContext = {
  tenantId: string;
  slug: string;
  name: string;
  canonicalHost: string | null;
  locale: string;
  timezone: string;
  currency: string;
  status: 'onboarding' | 'active' | 'suspended' | 'archived';
};

/**
 * Normalize a hostname: lowercase, strip port, trim whitespace.
 */
export function normalizeHostname(hostname: string): string {
  const trimmed = hostname.trim().toLowerCase();
  const withoutPort = trimmed.split(':')[0];
  return withoutPort || '';
}

/**
 * Extract the tenant slug from a platform subdomain.
 * e.g. "luz-interior.shala.app" → "luz-interior"
 *      "shala.app" → null (apex domain)
 *      "localhost:3000" → null
 */
export function extractSlugFromHostname(hostname: string): string | null {
  const normalized = normalizeHostname(hostname);

  // Local dev subdomains: slug.localhost
  const localMatch = normalized.match(/^([a-z0-9-]+)\.localhost$/);
  if (localMatch) return localMatch[1];

  // Production subdomains: slug.shala.app (and similar)
  const prodMatch = normalized.match(/^([a-z0-9-]+)\.shala\.app$/);
  if (prodMatch) return prodMatch[1];

  // Generic subdomain pattern (slug.base-domain)
  const parts = normalized.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

/**
 * Resolve a tenant from the request hostname.
 * Returns null if no valid tenant is found.
 */
export async function resolveTenantFromHostname(
  hostname: string
): Promise<TenantContext | null> {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return null;

  // Try to find a verified domain record first
  const domain = await prisma.domain.findUnique({
    where: { hostname: normalized },
    include: { tenant: true },
  });

  if (domain) {
    if (domain.status !== 'verified') return null;
    if (domain.tenant.status === 'suspended' || domain.tenant.status === 'archived') return null;

    return {
      tenantId: domain.tenant.id,
      slug: domain.tenant.slug,
      name: domain.tenant.name,
      canonicalHost: domain.isCanonical ? domain.hostname : null,
      locale: domain.tenant.defaultLocale,
      timezone: domain.tenant.timezone,
      currency: domain.tenant.currency,
      status: domain.tenant.status,
    };
  }

  // Fallback: try to resolve from subdomain slug pattern
  const slug = extractSlugFromHostname(normalized);
  if (!slug) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) return null;
  if (tenant.status === 'archived') return null;

  return {
    tenantId: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    canonicalHost: `${tenant.slug}.shala.app`,
    locale: tenant.defaultLocale,
    timezone: tenant.timezone,
    currency: tenant.currency,
    status: tenant.status,
  };
}

/**
 * Resolve a tenant from a URL path slug (/t/[slug]).
 * Only used in local development or preview environments.
 */
export async function resolveTenantFromSlug(
  slug: string
): Promise<TenantContext | null> {
  if (!slug || slug.length < 3) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) return null;
  if (tenant.status === 'archived') return null;

  return {
    tenantId: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    canonicalHost: `${tenant.slug}.shala.app`,
    locale: tenant.defaultLocale,
    timezone: tenant.timezone,
    currency: tenant.currency,
    status: tenant.status,
  };
}

/**
 * Server-side helper: get tenant context from a request.
 * In production, resolves from the Host header.
 * In development, can also use a path parameter or cookie.
 */
export async function getTenantContext(
  request: { headers: Headers }
): Promise<TenantContext | null> {
  const host = request.headers.get('host') || '';
  return resolveTenantFromHostname(host);
}

/**
 * Create a platform subdomain for a tenant during onboarding.
 */
export async function createPlatformDomain(tenantId: string, slug: string): Promise<void> {
  const hostname = process.env.NODE_ENV === 'production'
    ? `${slug}.shala.app`
    : `${slug}.localhost`;

  const existing = await prisma.domain.findUnique({ where: { hostname } });
  if (existing) return;

  await prisma.domain.create({
    data: {
      tenantId,
      hostname,
      type: 'platform_subdomain',
      status: 'verified',
      isCanonical: true,
    },
  });
}
