import assert from 'node:assert/strict';
import test from 'node:test';
import { csvCell } from '../lib/csv';
import {
  escapeHtml,
  getPasswordValidationError,
  hashPurposeToken,
  isSafeHttpUrl,
  isValidEmail,
  normalizeEmail,
} from '../lib/security';

test('purpose-bound tokens cannot cross authentication flows', () => {
  const rawToken = 'same-opaque-token';
  assert.notEqual(
    hashPurposeToken('email-verification', rawToken),
    hashPurposeToken('password-reset', rawToken)
  );
});

test('HTML values are escaped before entering email templates', () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
  );
});

test('CSV cells neutralize formulas and quote delimiters', () => {
  assert.equal(csvCell('=HYPERLINK("https://evil.example")'), '"\'=HYPERLINK(""https://evil.example"")"');
  assert.equal(csvCell('Doe, Jane'), '"Doe, Jane"');
});

test('email normalization and validation are consistent', () => {
  const email = normalizeEmail('  Person+Yoga@Example.COM ');
  assert.equal(email, 'person+yoga@example.com');
  assert.equal(isValidEmail(email), true);
  assert.equal(isValidEmail('not-an-email'), false);
});

test('password validation respects bcrypt limits', () => {
  assert.ok(getPasswordValidationError('short'));
  assert.equal(getPasswordValidationError('a secure passphrase'), null);
  assert.ok(getPasswordValidationError('🙂'.repeat(19)));
});

test('only HTTP(S) links are accepted for public calls to action', () => {
  assert.equal(isSafeHttpUrl('https://example.com/form'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,hello'), false);
});
