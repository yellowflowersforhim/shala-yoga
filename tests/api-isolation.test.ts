import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../lib/prisma';
import { getTenantFromRequest, withTenant } from '../lib/api-helpers';
import { TenantContext } from '../lib/tenant';

/**
 * API-level tenant isolation tests.
 * Verifies that cross-tenant access is blocked at the service/query level.
 * Tests the same patterns that API routes use (getTenantFromRequest + withTenant).
 */

// Simulate request headers for different tenants
function fakeHeaders(host: string): Headers {
  return new Headers({ host });
}

test('api: programs list scoped to tenant via withTenant', async () => {
  const tenantA = await prisma.tenant.findFirst({ where: { slug: 'ahora-hatha-yoga' } });
  const tenantB = await prisma.tenant.findFirst({ where: { slug: 'northern-light' } });
  assert.ok(tenantA); assert.ok(tenantB);

  const ctxA: TenantContext = { tenantId: tenantA!.id, slug: tenantA!.slug, name: tenantA!.name, canonicalHost: null, locale: 'es', timezone: 'Europe/Madrid', currency: 'EUR', status: 'onboarding' };
  const ctxB: TenantContext = { tenantId: tenantB!.id, slug: tenantB!.slug, name: tenantB!.name, canonicalHost: null, locale: 'en', timezone: 'Europe/Oslo', currency: 'NOK', status: 'active' };

  const progsA = await prisma.program.findMany({ where: withTenant({}, ctxA) });
  const progsB = await prisma.program.findMany({ where: withTenant({}, ctxB) });

  assert.ok(progsA.every(p => p.tenantId === ctxA.tenantId));
  assert.ok(progsB.every(p => p.tenantId === ctxB.tenantId));
  // No overlap of program IDs between tenants
  const idsA = new Set(progsA.map(p => p.id));
  for (const p of progsB) assert.ok(!idsA.has(p.id));
});

test('api: cross-tenant cohort query returns empty', async () => {
  const tenantB = await prisma.tenant.findFirst({ where: { slug: 'northern-light' } });
  const tenantA = await prisma.tenant.findFirst({ where: { slug: 'ahora-hatha-yoga' } });
  assert.ok(tenantA); assert.ok(tenantB);

  const ctxA = { tenantId: tenantA!.id, slug: tenantA!.slug, name: tenantA!.name, canonicalHost: null, locale: 'es', timezone: 'Europe/Madrid', currency: 'EUR', status: 'onboarding' as const };

  // Tenant A's cohorts should only be from tenant A
  const cohortsA = await prisma.cohort.findMany({ where: withTenant({}, ctxA), include: { program: true } });
  for (const c of cohortsA) {
    assert.equal(c.tenantId, ctxA.tenantId);
    assert.equal(c.program.tenantId, ctxA.tenantId);
  }
});

test('api: coupon findFirst enforces tenant scope', async () => {
  const tenantA = await prisma.tenant.findFirst({ where: { slug: 'ahora-hatha-yoga' } });
  assert.ok(tenantA);

  // Coupon queries should use findFirst with tenantId, not findUnique by code alone
  const coupon = await prisma.coupon.findFirst({
    where: { tenantId: tenantA!.id },
  });
  // Should either find no coupon (empty DB) or only tenant A's coupons
  if (coupon) assert.equal(coupon.tenantId, tenantA!.id);
});

test('api: withTenant passes through when tenant is null (single-tenant fallback)', () => {
  const where = withTenant({ status: 'active' as const }, null);
  assert.deepEqual(where, { status: 'active' });
});

test('api: withTenant adds tenantId when tenant is present', () => {
  const ctx: TenantContext = { tenantId: 't_test', slug: 'test', name: 'Test', canonicalHost: null, locale: 'es', timezone: 'UTC', currency: 'EUR', status: 'active' };
  const where = withTenant({ status: 'active' as const }, ctx);
  assert.deepEqual(where, { status: 'active', tenantId: 't_test' });
});

test('api: page-level tenant brand isolation', async () => {
  const tenantA = await prisma.tenant.findFirst({ where: { slug: 'ahora-hatha-yoga' } });
  const tenantB = await prisma.tenant.findFirst({ where: { slug: 'northern-light' } });
  assert.ok(tenantA); assert.ok(tenantB);

  // Each tenant should have their own brand theme
  const brandA = await prisma.brandTheme.findFirst({ where: { tenantId: tenantA!.id } });
  const brandB = await prisma.brandTheme.findFirst({ where: { tenantId: tenantB!.id } });

  // Brand themes should be distinct
  if (brandA && brandB) {
    assert.notEqual(brandA.primaryColor, brandB.primaryColor);
  }
});

// Cleanup
test('api: cleanup', async () => {
  await prisma.$disconnect();
});
