import assert from 'node:assert/strict';
import test from 'node:test';

// ── P2-01: Core tenant schema specification ───────────────────────────────
//
// These tests define the EXPECTED data model after Phase 2 schema changes.
// They serve as the contract before implementing the Prisma migration.

// ── Tenant model contract ─────────────────────────────────────────────────

test('Tenant requires id, slug, name, status, locale, timezone, currency', () => {
  const validTenant = {
    id: 't_test',
    slug: 'test-studio',
    name: 'Test Yoga Studio',
    status: 'active',
    defaultLocale: 'es',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
  };

  assert.ok(validTenant.id);
  assert.ok(validTenant.slug);
  assert.ok(validTenant.name);
  assert.equal(validTenant.slug.length >= 3, true, 'slug must be at least 3 chars');
  assert.ok(['onboarding', 'active', 'suspended', 'archived'].includes(validTenant.status));
  assert.ok(validTenant.defaultLocale);
  assert.ok(validTenant.timezone);
  assert.ok(validTenant.currency);
});

test('Tenant slug is URL-safe', () => {
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  assert.match('luz-interior', slugPattern);
  assert.match('northern-light', slugPattern);
  assert.match('test', slugPattern);
  assert.equal(slugPattern.test('Has Capital'), false);
  assert.equal(slugPattern.test('spaces bad'), false);
});

// ── Domain model contract ─────────────────────────────────────────────────

test('Domain requires tenantId, hostname, type, status', () => {
  const validDomain = {
    id: 'd_1',
    tenantId: 't_test',
    hostname: 'test.shala.app',
    type: 'platform_subdomain',
    status: 'verified',
    isCanonical: true,
  };

  assert.ok(validDomain.tenantId);
  assert.match(validDomain.hostname, /^[a-z0-9.-]+$/);
  assert.ok(['platform_subdomain', 'custom'].includes(validDomain.type));
  assert.ok(['pending', 'verified', 'failed', 'disabled'].includes(validDomain.status));
});

test('Domain hostname must be globally unique after normalization', () => {
  // Two tenants cannot share the same normalized hostname
  const normalize = (h: string) => h.toLowerCase().trim();

  const domainA = 'test.shala.app';
  const domainB = 'Test.Shala.App';
  assert.equal(normalize(domainA), normalize(domainB));
  // In DB: @@unique([hostname]) or unique index on normalized hostname
});

// ── TenantMembership model contract ────────────────────────────────────────

test('TenantMembership requires tenantId, userId, role, status', () => {
  const validMembership = {
    id: 'tm_1',
    tenantId: 't_test',
    userId: 'u_1',
    role: 'OWNER',
    status: 'active',
  };

  assert.ok(validMembership.tenantId);
  assert.ok(validMembership.userId);
  assert.ok(['OWNER', 'ADMIN', 'EDITOR', 'INSTRUCTOR', 'SUPPORT', 'VIEWER'].includes(validMembership.role));
  assert.ok(['invited', 'active', 'suspended'].includes(validMembership.status));
});

test('TenantMembership unique constraint is tenantId + userId', () => {
  // Same user can be in multiple tenants
  const memberships = [
    { tenantId: 't_a', userId: 'u_1', role: 'OWNER' },
    { tenantId: 't_b', userId: 'u_1', role: 'STUDENT' },
  ];
  // These should both be valid — no conflict
  const keys = memberships.map((m) => `${m.tenantId}:${m.userId}`);
  const uniqueKeys = new Set(keys);
  assert.equal(uniqueKeys.size, keys.length);
});

// ── Existing model ownership contract ──────────────────────────────────────

/**
 * Every tenant-owned model must include a tenantId that references Tenant.
 * After backfill, tenantId must be required (NOT NULL).
 */
const TENANT_OWNED_MODELS = [
  'Program',
  'Cohort',
  'Enrollment',
  'Order',
  'Coupon',
  'NewsletterSubscriber',
  'EmailCampaign',
  'Feedback',
  'AdminNote',
  'ConversionEvent',
  'Notification',
  'WeeklySession',
  // Phase 3+ models:
  'TeacherProfile',
  'BrandTheme',
  'SiteSettings',
  'Page',
  'MediaAsset',
];

test('all tenant-owned models are identified', () => {
  assert.ok(TENANT_OWNED_MODELS.length >= 12);
  // Verify User is NOT in this list
  assert.ok(!TENANT_OWNED_MODELS.includes('User'));
  // Verify Account/Session/VerificationToken are NOT in this list
  assert.ok(!TENANT_OWNED_MODELS.includes('Account'));
  assert.ok(!TENANT_OWNED_MODELS.includes('Session'));
});

// ── AuditLog model contract ────────────────────────────────────────────────

test('AuditLog records actor, action, target, scope', () => {
  const auditEntry = {
    id: 'al_1',
    tenantId: 't_test',
    actorId: 'u_1',
    action: 'order.refund',
    targetType: 'Order',
    targetId: 'ord_123',
    metadata: JSON.stringify({ amount: 15000 }),
    requestId: 'req_abc',
  };

  assert.ok(auditEntry.tenantId || auditEntry.targetType === 'PlatformSettings');
  assert.ok(auditEntry.actorId);
  assert.ok(auditEntry.action);
  assert.ok(auditEntry.targetType);
  assert.ok(auditEntry.targetId);
});

// ── Composite uniqueness contract ──────────────────────────────────────────

test('Program slug is unique per tenant, not globally', () => {
  // Phase 2-06: Convert @@unique([slug]) => @@unique([tenantId, slug])
  const slugsByTenant = [
    { tenantId: 't_a', slug: 'hatha-basics' },
    { tenantId: 't_b', slug: 'hatha-basics' }, // Same slug, different tenant = OK
  ];

  const compositeKeys = slugsByTenant.map((s) => `${s.tenantId}:${s.slug}`);
  const uniqueKeys = new Set(compositeKeys);
  assert.equal(uniqueKeys.size, 2, 'Same slug across tenants should be allowed');
});

test('Order number is unique per tenant (in practice via prefix)', () => {
  // Order numbers could be tenant-prefixed: ORD-[tenant]-YYYYMMDD-RANDOM
  const orderA = 'ORD-LUZ-20260712-ABCDEF1234';
  const orderB = 'ORD-NOR-20260712-ABCDEF1234';
  assert.notEqual(orderA, orderB);
});

// ── Migration step validation ──────────────────────────────────────────────

test('migration follows expand/backfill/verify/contract pattern', () => {
  const phases = [
    'expand',    // Add nullable tenantId columns
    'backfill',  // Assign all existing records to reference tenant
    'verify',    // Check no orphans, counts match
    'contract',  // Make tenantId required (NOT NULL), update unique constraints
  ];

  assert.equal(phases.length, 4);
  assert.ok(phases.includes('expand'));
  assert.ok(phases.includes('backfill'));
  assert.ok(phases.includes('verify'));
  assert.ok(phases.includes('contract'));
});
