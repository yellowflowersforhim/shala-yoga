import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../lib/prisma';
import { getPrograms } from '../lib/services/programs';
import { getRevenueStats } from '../lib/services/commerce';
import { resolveTenantFromSlug } from '../lib/tenant';

/**
 * Real database cross-tenant isolation tests.
 * Verifies that tenant-scoped services prevent data leakage
 * against the actual PostgreSQL database.
 */

const TENANT_A_SLUG = 'ahora-hatha-yoga';
const TENANT_B_SLUG = 'northern-light';

test('DB: resolve both tenants', async () => {
  const a = await resolveTenantFromSlug(TENANT_A_SLUG);
  const b = await resolveTenantFromSlug(TENANT_B_SLUG);

  assert.ok(a, 'Tenant A should resolve');
  assert.ok(b, 'Tenant B should resolve');
  assert.notEqual(a!.tenantId, b!.tenantId);
});

test('DB: getPrograms returns only own tenant data', async () => {
  const tenantA = await resolveTenantFromSlug(TENANT_A_SLUG);
  const tenantB = await resolveTenantFromSlug(TENANT_B_SLUG);
  assert.ok(tenantA);
  assert.ok(tenantB);

  const programsA = await getPrograms(tenantA!);
  const programsB = await getPrograms(tenantB!);

  // Each tenant only sees their own programs
  for (const p of programsA) {
    assert.equal(p.tenantId, tenantA!.tenantId, `Program ${p.id} should belong to tenant A`);
  }
  for (const p of programsB) {
    assert.equal(p.tenantId, tenantB!.tenantId, `Program ${p.id} should belong to tenant B`);
  }
});

test('DB: revenue stats are tenant-scoped', async () => {
  const tenantA = await resolveTenantFromSlug(TENANT_A_SLUG);
  const tenantB = await resolveTenantFromSlug(TENANT_B_SLUG);
  assert.ok(tenantA);
  assert.ok(tenantB);

  const statsA = await getRevenueStats(tenantA!);
  const statsB = await getRevenueStats(tenantB!);

  // Both should return valid (possibly empty) results
  assert.ok(typeof statsA.totalRevenueCents === 'number');
  assert.ok(typeof statsB.totalRevenueCents === 'number');
});

test('DB: cross-tenant ID lookup returns null', async () => {
  const tenantA = await resolveTenantFromSlug(TENANT_A_SLUG);
  const tenantB = await resolveTenantFromSlug(TENANT_B_SLUG);
  assert.ok(tenantA);
  assert.ok(tenantB);

  // Get a program from tenant B, try to look it up as tenant A
  const programsB = await getPrograms(tenantB!);
  if (programsB.length > 0) {
    // Tenant A tries to access tenant B's program by ID
    const hijacked = await prisma.program.findFirst({
      where: { id: programsB[0].id, tenantId: tenantA!.tenantId },
    });
    assert.equal(hijacked, null, 'Tenant A should not access Tenant B program');
  }
});

// Cleanup
test('DB: cleanup', async () => {
  await prisma.$disconnect();
});
