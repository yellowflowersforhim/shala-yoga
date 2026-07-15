/**
 * API route helpers for tenant resolution.
 *
 * Provides a uniform way for API routes to resolve the current tenant
 * from the request hostname. Returns null in single-tenant (pre-migration)
 * mode — all queries then default to global scope.
 *
 * After Phase 2 migration: this resolves the tenant from the Domain table.
 */

import { normalizeHostname, resolveTenantFromHostname } from '@/lib/tenant';
import { TenantContext } from '@/lib/tenant';

/**
 * Resolve tenant context from the incoming request.
 * Pre-migration: returns null (global queries).
 * Post-migration: queries Domain → Tenant from the database.
 */
export async function getTenantFromRequest(
  headers: Headers
): Promise<TenantContext | null> {
  const host = headers.get('host') || '';
  const normalized = normalizeHostname(host);

  try {
    const tenant = await resolveTenantFromHostname(normalized);
    if (tenant) return tenant;
  } catch {
    // DB or Domain table not ready — fall through to subdomain extraction
  }

  // Fallback: try subdomain slug extraction (no DB query needed)
  const { extractSlugFromHostname } = await import('@/lib/tenant');
  const slug = extractSlugFromHostname(normalized);
  if (!slug) return null;

  try {
    const { prisma } = await import('@/lib/prisma');
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (tenant && tenant.status !== 'archived') {
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
  } catch {
    // DB not available — single-tenant fallback
  }

  return null;
}

/**
 * Add tenantId filter to a Prisma where clause when tenant is resolved.
 */
export function withTenant<T extends Record<string, unknown>>(
  where: T,
  tenant: TenantContext | null
): T & { tenantId?: string } {
  if (!tenant) return where;
  return { ...where, tenantId: tenant.tenantId };
}
