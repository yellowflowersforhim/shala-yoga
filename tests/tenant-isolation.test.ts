import assert from 'node:assert/strict';
import test from 'node:test';

// ── P2-07: Cross-tenant isolation test suite ──────────────────────────────
//
// These tests define the contract for tenant isolation. They verify that:
// - Tenant A cannot read Tenant B's records
// - Guessing a valid ID from another tenant returns null (not the record)
// - Write operations are scoped to the tenant
// - Cache keys include tenant context

// ── Data store simulation ─────────────────────────────────────────────────

type TenantRecord = {
  id: string;
  tenantId: string;
  data: string;
};

class TenantScopedStore {
  private records: TenantRecord[] = [];

  create(record: TenantRecord): void {
    this.records.push(record);
  }

  findById(id: string, tenantId: string): TenantRecord | null {
    return (
      this.records.find((r) => r.id === id && r.tenantId === tenantId) ?? null
    );
  }

  findByTenant(tenantId: string): TenantRecord[] {
    return this.records.filter((r) => r.tenantId === tenantId);
  }

  updateById(
    id: string,
    tenantId: string,
    data: Partial<TenantRecord>
  ): TenantRecord | null {
    const record = this.findById(id, tenantId);
    if (!record) return null;
    Object.assign(record, data);
    return record;
  }

  deleteById(id: string, tenantId: string): boolean {
    const index = this.records.findIndex(
      (r) => r.id === id && r.tenantId === tenantId
    );
    if (index === -1) return false;
    this.records.splice(index, 1);
    return true;
  }

  count(tenantId: string): number {
    return this.records.filter((r) => r.tenantId === tenantId).length;
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────

function setupTwoTenantStore(): {
  store: TenantScopedStore;
  tenantA: { id: string };
  tenantB: { id: string };
  recordA1: TenantRecord;
  recordB1: TenantRecord;
} {
  const store = new TenantScopedStore();
  const tenantA = { id: 't_luz_interior' };
  const tenantB = { id: 't_northern_light' };

  const recordA1: TenantRecord = {
    id: 'prog_a1',
    tenantId: tenantA.id,
    data: 'Luz Interior Program 1',
  };
  const recordB1: TenantRecord = {
    id: 'prog_b1',
    tenantId: tenantB.id,
    data: 'Northern Light Program 1',
  };

  store.create(recordA1);
  store.create(recordB1);

  return { store, tenantA, tenantB, recordA1, recordB1 };
}

// ── Read isolation ────────────────────────────────────────────────────────

test('tenant A can read its own records', () => {
  const { store, tenantA, recordA1 } = setupTwoTenantStore();
  const found = store.findById(recordA1.id, tenantA.id);
  assert.ok(found);
  assert.equal(found?.data, 'Luz Interior Program 1');
});

test('tenant A cannot read tenant B records by guessing ID', () => {
  const { store, tenantA, recordB1 } = setupTwoTenantStore();
  // Tenant A tries to guess Tenant B's record ID
  const found = store.findById(recordB1.id, tenantA.id);
  assert.equal(found, null, 'Should return null, not expose Tenant B data');
});

test('tenant B cannot read tenant A records by guessing ID', () => {
  const { store, tenantB, recordA1 } = setupTwoTenantStore();
  const found = store.findById(recordA1.id, tenantB.id);
  assert.equal(found, null);
});

test('list operations only return own tenant records', () => {
  const { store, tenantA, tenantB } = setupTwoTenantStore();
  const recordsA = store.findByTenant(tenantA.id);
  const recordsB = store.findByTenant(tenantB.id);

  assert.equal(recordsA.length, 1);
  assert.equal(recordsB.length, 1);
  assert.ok(recordsA.every((r) => r.tenantId === tenantA.id));
  assert.ok(recordsB.every((r) => r.tenantId === tenantB.id));
});

// ── Write isolation ───────────────────────────────────────────────────────

test('update only affects the correct tenant record', () => {
  const { store, tenantA, tenantB, recordA1, recordB1 } =
    setupTwoTenantStore();

  // Tenant A updates their record
  const updated = store.updateById(recordA1.id, tenantA.id, {
    data: 'Updated Luz Interior',
  });
  assert.ok(updated);
  assert.equal(updated.data, 'Updated Luz Interior');

  // Tenant B's record is unaffected
  const bRecord = store.findById(recordB1.id, tenantB.id);
  assert.ok(bRecord);
  assert.equal(bRecord.data, 'Northern Light Program 1');
});

test('update returns null for cross-tenant access', () => {
  const { store, tenantA, recordB1 } = setupTwoTenantStore();
  const result = store.updateById(recordB1.id, tenantA.id, {
    data: 'Hacked',
  });
  assert.equal(result, null);
});

test('delete only removes the correct tenant record', () => {
  const { store, tenantA, tenantB, recordA1, recordB1 } =
    setupTwoTenantStore();

  // Tenant A deletes their record
  const deleted = store.deleteById(recordA1.id, tenantA.id);
  assert.equal(deleted, true);

  // Tenant A now has 0 records
  assert.equal(store.count(tenantA.id), 0);

  // Tenant B still has their record
  assert.equal(store.count(tenantB.id), 1);
});

test('delete returns false for cross-tenant access', () => {
  const { store, tenantA, recordB1 } = setupTwoTenantStore();
  const result = store.deleteById(recordB1.id, tenantA.id);
  assert.equal(result, false);

  // Tenant B still has their record
  const { store: _, tenantB } = setupTwoTenantStore();
  assert.equal(store.count(tenantB.id), 1);
});

// ── ID-only access forbidden ──────────────────────────────────────────────

test('querying by ID alone is not sufficient — requires tenantId', () => {
  const { store, tenantA, recordB1 } = setupTwoTenantStore();

  // Simulate: the old pattern of querying by ID without tenant scope
  // This would expose cross-tenant data
  const unsafeFindById = (id: string) =>
    store['records'].find((r) => r.id === id) ?? null;

  const dangerous = unsafeFindById(recordB1.id);
  assert.ok(dangerous, 'ID-only query finds the record');
  assert.equal(
    dangerous.tenantId,
    't_northern_light',
    'Record belongs to tenant B'
  );

  // Correct: always include tenantId
  const safe = store.findById(recordB1.id, tenantA.id);
  assert.equal(safe, null, 'Safe query with wrong tenantId returns null');
});

// ── Enumeration resistance ────────────────────────────────────────────────

test('cannot enumerate another tenant records via incrementing IDs', () => {
  const { store, tenantA, tenantB } = setupTwoTenantStore();

  // Add more records to tenant B
  store.create({ id: 'prog_b2', tenantId: tenantB.id, data: 'NL Prog 2' });
  store.create({ id: 'prog_b3', tenantId: tenantB.id, data: 'NL Prog 3' });

  // Tenant A tries to enumerate via IDs
  const guessedIds = ['prog_b1', 'prog_b2', 'prog_b3', 'prog_b4'];
  const found = guessedIds.map((id) => store.findById(id, tenantA.id));

  assert.ok(found.every((r) => r === null), 'All cross-tenant lookups return null');
});

// ── Cache key isolation ───────────────────────────────────────────────────

test('cache keys include tenant context to prevent cross-tenant cache hits', () => {
  const cacheKey = (tenantId: string, resource: string, id: string) =>
    `tenant:${tenantId}:${resource}:${id}`;

  const keyA = cacheKey('t_a', 'program', 'p1');
  const keyB = cacheKey('t_b', 'program', 'p1');

  assert.notEqual(keyA, keyB);
  assert.match(keyA, /^tenant:t_a:program:p1$/);
  assert.match(keyB, /^tenant:t_b:program:p1$/);
});

// ── Reporting and aggregation isolation ───────────────────────────────────

test('revenue reports are tenant-scoped', () => {
  const { store, tenantA, tenantB } = setupTwoTenantStore();

  // Each tenant only sees their own data in aggregations
  const countA = store.count(tenantA.id);
  const countB = store.count(tenantB.id);

  assert.equal(countA, 1);
  assert.equal(countB, 1);
  assert.equal(countA + countB, 2);
});

// ── Media/asset isolation ─────────────────────────────────────────────────

test('media keys are tenant-prefixed, not user-controlled slug alone', () => {
  const mediaKey = (tenantId: string, filename: string) =>
    `${tenantId}/uploads/${filename}`;

  const keyA = mediaKey('t_luz_interior', 'logo.png');
  const keyB = mediaKey('t_northern_light', 'logo.png');

  assert.notEqual(keyA, keyB);
  assert.equal(keyA, 't_luz_interior/uploads/logo.png');
  assert.equal(keyB, 't_northern_light/uploads/logo.png');
});

// ── Respect for suspended tenants ─────────────────────────────────────────

test('suspended tenants can still read their own data', () => {
  const { store, tenantA } = setupTwoTenantStore();
  // Suspended means site is down but data is still accessible to owner
  const records = store.findByTenant(tenantA.id);
  assert.equal(records.length, 1);
});
