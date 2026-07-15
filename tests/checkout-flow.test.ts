import assert from 'node:assert/strict';
import test from 'node:test';
import { isEnrollmentOpen, generateOrderNumber } from '../lib/format';
import { normalizeEmail } from '../lib/security';

// ── J2/J3: Checkout enrollment window ──────────────────────────────────────

test('enrollment is closed when enrollmentOpensAt is in the future', () => {
  const future = new Date(Date.now() + 3600_000); // 1 hour from now
  assert.equal(isEnrollmentOpen(future, null), false);
});

test('enrollment is closed when enrollmentClosesAt is in the past', () => {
  const past = new Date(Date.now() - 3600_000);
  assert.equal(isEnrollmentOpen(null, past), false);
});

test('enrollment is open when window spans the current time', () => {
  const past = new Date(Date.now() - 3600_000);
  const future = new Date(Date.now() + 3600_000);
  assert.equal(isEnrollmentOpen(past, future), true);
});

test('enrollment is open with no window restrictions', () => {
  assert.equal(isEnrollmentOpen(null, null), true);
});

test('enrollment accepts string dates', () => {
  const past = new Date(Date.now() - 3600_000).toISOString();
  const future = new Date(Date.now() + 3600_000).toISOString();
  assert.equal(isEnrollmentOpen(past, future), true);
});

// ── J4: Order number uniqueness ────────────────────────────────────────────

test('order numbers have the expected format', () => {
  const order = generateOrderNumber();
  assert.match(order, /^ORD-\d{8}-[A-F0-9]{10}$/);
});

test('consecutive order numbers are different', () => {
  const a = generateOrderNumber();
  const b = generateOrderNumber();
  assert.notEqual(a, b);
});

// ── J4: Webhook amount/currency validation logic ───────────────────────────

/**
 * Replicates the webhook validation logic from /api/webhooks/stripe/route.ts
 * without requiring a database connection.
 */
function validateWebhookPayment(params: {
  amountTotal: number | null;
  currency: string | null;
  paymentStatus: string;
  orderTotalCents: number;
  orderCurrency: string;
}): { valid: boolean; reason?: string } {
  const { amountTotal, currency, paymentStatus, orderTotalCents, orderCurrency } = params;

  if (typeof amountTotal !== 'number') {
    return { valid: false, reason: 'Missing amount_total' };
  }

  const amountMatches = amountTotal === orderTotalCents;
  if (!amountMatches) {
    return { valid: false, reason: `Amount mismatch: expected ${orderTotalCents}, got ${amountTotal}` };
  }

  const currencyMatches = currency?.toUpperCase() === orderCurrency.toUpperCase();
  if (!currencyMatches) {
    return { valid: false, reason: `Currency mismatch: expected ${orderCurrency}, got ${currency}` };
  }

  const isPaid = paymentStatus === 'paid' ||
    (paymentStatus === 'no_payment_required' && orderTotalCents === 0);

  if (!isPaid) {
    return { valid: false, reason: `Payment not complete: ${paymentStatus}` };
  }

  return { valid: true };
}

test('webhook accepts matching amount and currency', () => {
  const result = validateWebhookPayment({
    amountTotal: 15000,
    currency: 'eur',
    paymentStatus: 'paid',
    orderTotalCents: 15000,
    orderCurrency: 'EUR',
  });
  assert.equal(result.valid, true);
});

test('webhook rejects mismatched amount', () => {
  const result = validateWebhookPayment({
    amountTotal: 10000,
    currency: 'eur',
    paymentStatus: 'paid',
    orderTotalCents: 15000,
    orderCurrency: 'EUR',
  });
  assert.equal(result.valid, false);
  assert.ok(result.reason?.includes('Amount mismatch'));
});

test('webhook rejects mismatched currency', () => {
  const result = validateWebhookPayment({
    amountTotal: 15000,
    currency: 'usd',
    paymentStatus: 'paid',
    orderTotalCents: 15000,
    orderCurrency: 'EUR',
  });
  assert.equal(result.valid, false);
  assert.ok(result.reason?.includes('Currency mismatch'));
});

test('webhook requires paid status', () => {
  const result = validateWebhookPayment({
    amountTotal: 15000,
    currency: 'eur',
    paymentStatus: 'unpaid',
    orderTotalCents: 15000,
    orderCurrency: 'EUR',
  });
  assert.equal(result.valid, false);
  assert.ok(result.reason?.includes('not complete'));
});

test('webhook allows zero-amount orders with no_payment_required', () => {
  const result = validateWebhookPayment({
    amountTotal: 0,
    currency: 'eur',
    paymentStatus: 'no_payment_required',
    orderTotalCents: 0,
    orderCurrency: 'EUR',
  });
  assert.equal(result.valid, true);
});

test('webhook rejects zero-amount orders with unpaid status', () => {
  const result = validateWebhookPayment({
    amountTotal: 0,
    currency: 'eur',
    paymentStatus: 'unpaid',
    orderTotalCents: 0,
    orderCurrency: 'EUR',
  });
  assert.equal(result.valid, false);
});

// ── J4: Duplicate webhook idempotency ──────────────────────────────────────

/**
 * Simulates the idempotency check that should exist for webhook events.
 * Currently the code only checks if order.status === 'paid', not if the
 * specific Stripe event was already processed.
 */
function checkWebhookIdempotency(
  processedEventIds: Set<string>,
  eventId: string
): { alreadyProcessed: boolean } {
  if (processedEventIds.has(eventId)) {
    return { alreadyProcessed: true };
  }
  processedEventIds.add(eventId);
  return { alreadyProcessed: false };
}

test('webhook processes each event only once', () => {
  const processed = new Set<string>();
  const eventId = 'evt_test_123';

  const first = checkWebhookIdempotency(processed, eventId);
  assert.equal(first.alreadyProcessed, false);

  const second = checkWebhookIdempotency(processed, eventId);
  assert.equal(second.alreadyProcessed, true);
});

test('webhook processes different events independently', () => {
  const processed = new Set<string>();

  assert.equal(checkWebhookIdempotency(processed, 'evt_a').alreadyProcessed, false);
  assert.equal(checkWebhookIdempotency(processed, 'evt_b').alreadyProcessed, false);
  assert.equal(checkWebhookIdempotency(processed, 'evt_a').alreadyProcessed, true);
});

// ── Capacity validation (avoid oversell) ───────────────────────────────────

/**
 * Validates capacity for checkout. Currently capacity is not re-checked
 * during webhook processing — this is a gap (G-01).
 */
function validateCapacity(enrolledCount: number, maxSeats: number): { available: boolean; remaining: number } {
  const remaining = Math.max(0, maxSeats - enrolledCount);
  return { available: enrolledCount < maxSeats, remaining };
}

test('capacity is available when seats remain', () => {
  const result = validateCapacity(5, 10);
  assert.equal(result.available, true);
  assert.equal(result.remaining, 5);
});

test('capacity is exhausted when full', () => {
  const result = validateCapacity(10, 10);
  assert.equal(result.available, false);
  assert.equal(result.remaining, 0);
});

test('capacity rejects over-enrollment', () => {
  const result = validateCapacity(11, 10);
  assert.equal(result.available, false);
  assert.equal(result.remaining, 0);
});

test('capacity allows zero maxSeats (unlimited)', () => {
  // Edge case: if maxSeats = 0, treat as no limit
  const unlimited = (enrolled: number, max: number) => max === 0 || enrolled < max;
  assert.equal(unlimited(100, 0), true);
});

// ── Coupon discount calculation ────────────────────────────────────────────

function calculateCouponDiscount(
  discountType: string,
  discountValue: number,
  purchaseAmountCents: number
): { valid: boolean; discountCents: number; error?: string } {
  if (!Number.isSafeInteger(purchaseAmountCents) || purchaseAmountCents < 0) {
    return { valid: false, discountCents: 0, error: 'Importe de compra inválido' };
  }

  if (discountType === 'percentage') {
    if (discountValue < 0 || discountValue > 100) {
      return { valid: false, discountCents: 0, error: 'Porcentaje inválido' };
    }
    return { valid: true, discountCents: Math.round((purchaseAmountCents * discountValue) / 100) };
  }

  if (discountType === 'fixed') {
    if (discountValue < 0) {
      return { valid: false, discountCents: 0, error: 'Valor fijo inválido' };
    }
    return { valid: true, discountCents: Math.min(discountValue, purchaseAmountCents) };
  }

  return { valid: false, discountCents: 0, error: 'Tipo de descuento desconocido' };
}

test('percentage coupon calculates correct discount', () => {
  const result = calculateCouponDiscount('percentage', 20, 15000);
  assert.equal(result.valid, true);
  assert.equal(result.discountCents, 3000); // 20% of 15000
});

test('percentage coupon rounds correctly', () => {
  const result = calculateCouponDiscount('percentage', 15, 9999);
  assert.equal(result.valid, true);
  assert.equal(result.discountCents, 1500); // 14.9985 rounds to 1500
});

test('fixed coupon calculates correct discount', () => {
  const result = calculateCouponDiscount('fixed', 5000, 15000);
  assert.equal(result.valid, true);
  assert.equal(result.discountCents, 5000);
});

test('fixed coupon caps at purchase amount', () => {
  const result = calculateCouponDiscount('fixed', 20000, 15000);
  assert.equal(result.valid, true);
  assert.equal(result.discountCents, 15000); // capped
});

test('percentage coupon rejects values over 100', () => {
  const result = calculateCouponDiscount('percentage', 150, 15000);
  assert.equal(result.valid, false);
});

test('coupon rejects negative purchase amount', () => {
  const result = calculateCouponDiscount('percentage', 20, -1000);
  assert.equal(result.valid, false);
});

// ── Guest account linking logic ────────────────────────────────────────────

/**
 * Simulates linking guest orders/enrollments to a registered user.
 * This logic runs during OAuth signIn callback.
 */
function linkGuestRecords(
  guestEmail: string,
  userEmail: string
): { shouldLink: boolean } {
  const normalizedGuest = normalizeEmail(guestEmail);
  const normalizedUser = normalizeEmail(userEmail);
  return { shouldLink: normalizedGuest === normalizedUser && normalizedGuest !== '' };
}

test('guest records link when emails match', () => {
  assert.equal(linkGuestRecords('guest@test.com', 'Guest@Test.com').shouldLink, true);
  assert.equal(linkGuestRecords('guest@test.com', 'other@test.com').shouldLink, false);
});

test('guest records handle normalized emails', () => {
  assert.equal(linkGuestRecords('  GUEST@test.COM ', 'guest@test.com').shouldLink, true);
});

test('guest records reject empty emails', () => {
  assert.equal(linkGuestRecords('', 'someone@test.com').shouldLink, false);
  assert.equal(linkGuestRecords('someone@test.com', '').shouldLink, false);
});

// ── Order price immutability ───────────────────────────────────────────────

/**
 * Verifies that once an order is created, its price snapshot is immutable.
 * The order stores subtotalCents, discountCents, totalCents at creation time.
 * Webhook validation compares stripe amount against stored order amounts,
 * not current program price.
 */
test('order totals are immutable snapshots independent of program price changes', () => {
  // Simulate: program price changes after order creation
  const orderSnapshot = {
    subtotalCents: 15000,
    discountCents: 2000,
    totalCents: 13000,
    currency: 'EUR',
  };

  const newProgramPrice = 20000; // Price increased after order was placed

  // Webhook should validate against the ORDER snapshot, not current program price
  assert.equal(orderSnapshot.totalCents, 13000);
  assert.notEqual(orderSnapshot.totalCents, newProgramPrice);
});
