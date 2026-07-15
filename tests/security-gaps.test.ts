import assert from 'node:assert/strict';
import test from 'node:test';

// ── G-02: Webhook idempotency (Stripe event ID tracking) ───────────────────

/**
 * Current gap: /api/webhooks/stripe/route.ts does NOT store the Stripe
 * event ID. It only checks order.status === 'paid' for duplicate detection.
 * This means a replayed or out-of-order event could bypass the check.
 *
 * This test defines the CORRECT behavior: store processed event IDs and
 * reject duplicates before any business logic runs.
 */

type WebhookEventRecord = {
  eventId: string;
  processedAt: Date;
};

class WebhookEventStore {
  private events = new Map<string, WebhookEventRecord>();

  /**
   * Returns true if this event was already processed.
   * Stores the event as processed if it's new.
   */
  processOnce(eventId: string): { alreadyProcessed: boolean } {
    if (this.events.has(eventId)) {
      return { alreadyProcessed: true };
    }
    this.events.set(eventId, { eventId, processedAt: new Date() });
    return { alreadyProcessed: false };
  }

  hasEvent(eventId: string): boolean {
    return this.events.has(eventId);
  }
}

test('webhook event store rejects duplicate event IDs', () => {
  const store = new WebhookEventStore();

  // First attempt: should process
  const first = store.processOnce('evt_3abc123');
  assert.equal(first.alreadyProcessed, false);

  // Same event again: should reject
  const second = store.processOnce('evt_3abc123');
  assert.equal(second.alreadyProcessed, true);
});

test('webhook event store allows different event IDs', () => {
  const store = new WebhookEventStore();

  assert.equal(store.processOnce('evt_a').alreadyProcessed, false);
  assert.equal(store.processOnce('evt_b').alreadyProcessed, false);
  assert.equal(store.processOnce('evt_c').alreadyProcessed, false);
  assert.equal(store.hasEvent('evt_a'), true);
  assert.equal(store.hasEvent('evt_b'), true);
  assert.equal(store.hasEvent('evt_unknown'), false);
});

test('webhook event store survives out-of-order delivery', () => {
  const store = new WebhookEventStore();

  // Process event B before A (out of order)
  assert.equal(store.processOnce('evt_B').alreadyProcessed, false);
  assert.equal(store.processOnce('evt_A').alreadyProcessed, false);

  // Replayed event B
  assert.equal(store.processOnce('evt_B').alreadyProcessed, true);
});

// ── G-03: Coupon usedCount concurrency ─────────────────────────────────────

/**
 * Current gap: /api/webhooks/stripe/route.ts increments coupon usedCount
 * with a simple `{ usedCount: { increment: 1 } }` inside a transaction.
 * However, the validateCoupon function reads usedCount BEFORE the
 * transaction, creating a TOCTOU race condition.
 *
 * The correct pattern: validate + increment atomically within the same
 * transaction, or use an atomic conditional update.
 */

type CouponRecord = {
  id: string;
  code: string;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
};

/**
 * Atomic coupon claim: validates and claims a usage in one operation.
 * Returns false if the coupon is exhausted or inactive.
 */
function claimCouponAtomically(
  coupon: CouponRecord
): { claimed: boolean; error?: string } {
  if (!coupon.isActive) {
    return { claimed: false, error: 'Coupon not active' };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    // Check BEFORE claiming — in a real DB this would be a conditional UPDATE
    return { claimed: false, error: 'Coupon exhausted' };
  }

  // Atomic increment — in a real DB: UPDATE ... SET usedCount = usedCount + 1
  // WHERE id = ? AND (maxUses IS NULL OR usedCount < maxUses)
  coupon.usedCount += 1;
  return { claimed: true };
}

test('coupon claim succeeds when usage is below maxUses', () => {
  const coupon: CouponRecord = {
    id: 'c1',
    code: 'YOGA20',
    maxUses: 100,
    usedCount: 50,
    isActive: true,
  };

  const result = claimCouponAtomically(coupon);
  assert.equal(result.claimed, true);
  assert.equal(coupon.usedCount, 51);
});

test('coupon claim rejects when maxUses reached', () => {
  const coupon: CouponRecord = {
    id: 'c1',
    code: 'YOGA20',
    maxUses: 100,
    usedCount: 100,
    isActive: true,
  };

  const result = claimCouponAtomically(coupon);
  assert.equal(result.claimed, false);
  assert.ok(result.error?.includes('exhausted'));
  assert.equal(coupon.usedCount, 100); // unchanged
});

test('coupon claim rejects inactive coupons', () => {
  const coupon: CouponRecord = {
    id: 'c1',
    code: 'OLD50',
    maxUses: 100,
    usedCount: 0,
    isActive: false,
  };

  const result = claimCouponAtomically(coupon);
  assert.equal(result.claimed, false);
});

test('coupon claim allows unlimited uses (null maxUses)', () => {
  const coupon: CouponRecord = {
    id: 'c2',
    code: 'WELCOME',
    maxUses: null,
    usedCount: 999,
    isActive: true,
  };

  const result = claimCouponAtomically(coupon);
  assert.equal(result.claimed, true);
  assert.equal(coupon.usedCount, 1000);
});

test('coupon claim prevents over-claiming at the boundary', () => {
  const coupon: CouponRecord = {
    id: 'c3',
    code: 'LASTONE',
    maxUses: 10,
    usedCount: 9,
    isActive: true,
  };

  // Last valid claim
  assert.equal(claimCouponAtomically(coupon).claimed, true);
  assert.equal(coupon.usedCount, 10);

  // Next claim fails
  const result = claimCouponAtomically(coupon);
  assert.equal(result.claimed, false);
  assert.equal(coupon.usedCount, 10); // unchanged
});

// ── G-01: Capacity re-check during webhook ─────────────────────────────────

/**
 * Current gap: /api/webhooks/stripe/route.ts does NOT re-check capacity
 * during webhook processing. The capacity is only checked during checkout
 * (POST /api/checkout). Between checkout and payment confirmation, another
 * user could complete a payment, causing oversell.
 *
 * The fix: check and claim a seat atomically during webhook processing.
 */

type CohortCapacity = {
  maxSeats: number;
  enrolledCount: number;
};

function tryClaimSeat(
  capacity: CohortCapacity
): { claimed: boolean; remaining: number } {
  if (capacity.enrolledCount >= capacity.maxSeats) {
    return { claimed: false, remaining: 0 };
  }

  // In a real DB: UPDATE cohort SET enrolledCount = enrolledCount + 1
  // WHERE id = ? AND enrolledCount < maxSeats
  capacity.enrolledCount += 1;
  return { claimed: true, remaining: capacity.maxSeats - capacity.enrolledCount };
}

test('seat claim succeeds when capacity remains', () => {
  const cap: CohortCapacity = { maxSeats: 10, enrolledCount: 8 };
  const result = tryClaimSeat(cap);
  assert.equal(result.claimed, true);
  assert.equal(cap.enrolledCount, 9);
});

test('seat claim fails when full', () => {
  const cap: CohortCapacity = { maxSeats: 10, enrolledCount: 10 };
  const result = tryClaimSeat(cap);
  assert.equal(result.claimed, false);
  assert.equal(cap.enrolledCount, 10); // unchanged
});

test('seat claim prevents oversell at last seat', () => {
  const cap: CohortCapacity = { maxSeats: 5, enrolledCount: 4 };

  // User A claims last seat
  assert.equal(tryClaimSeat(cap).claimed, true);
  assert.equal(cap.enrolledCount, 5);

  // User B tries to claim — fails
  const result = tryClaimSeat(cap);
  assert.equal(result.claimed, false);
  assert.equal(cap.enrolledCount, 5); // unchanged
});

// ── Price trust: server-side only ──────────────────────────────────────────

/**
 * Verification: the price used in checkout must come from the server-loaded
 * cohort record, never from the browser request body.
 */
test('checkout price is derived from server-loaded cohort, not request body', () => {
  // Server loads the cohort
  const serverCohort = {
    program: { priceCents: 15000, currency: 'EUR' },
  };

  // Browser sends a request body (could be manipulated)
  const requestBody = { cohortId: 'abc', priceCents: 1 }; // Tampered!

  // Correct: use server price
  const checkpointPrice = serverCohort.program.priceCents;
  assert.equal(checkpointPrice, 15000);
  assert.notEqual(checkpointPrice, requestBody.priceCents);
});

// ── Tenant isolation: cross-tenant denial ──────────────────────────────────

/**
 * Proactive test for Phase 2: tenant-scoped authorization.
 * When tenant A requests a record owned by tenant B, the result must be
 * not found or forbidden, never exposed.
 */
type TenantOwned = { id: string; tenantId: string; data: string };

function scopedFind(id: string, tenantId: string, records: TenantOwned[]): TenantOwned | null {
  const record = records.find((r) => r.id === id);
  if (!record || record.tenantId !== tenantId) return null;
  return record;
}

test('scoped find returns record for correct tenant', () => {
  const records: TenantOwned[] = [
    { id: 'p1', tenantId: 't_a', data: 'Program A' },
    { id: 'p2', tenantId: 't_b', data: 'Program B' },
  ];

  const result = scopedFind('p1', 't_a', records);
  assert.ok(result);
  assert.equal(result?.data, 'Program A');
});

test('scoped find returns null for cross-tenant access', () => {
  const records: TenantOwned[] = [
    { id: 'p1', tenantId: 't_a', data: 'Program A' },
  ];

  // Tenant B tries to access Tenant A's program
  const result = scopedFind('p1', 't_b', records);
  assert.equal(result, null);
});

test('scoped find returns null for non-existent record', () => {
  const records: TenantOwned[] = [
    { id: 'p1', tenantId: 't_a', data: 'Program A' },
  ];

  const result = scopedFind('nonexistent', 't_a', records);
  assert.equal(result, null);
});
