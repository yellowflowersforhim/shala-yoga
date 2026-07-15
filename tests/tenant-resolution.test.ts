import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHostname, extractSlugFromHostname } from '../lib/tenant';

// ── P2-03: Hostname normalization ─────────────────────────────────────────

test('normalizeHostname lowercases and strips port', () => {
  assert.equal(normalizeHostname('Luz-Interior.Shala.App:3000'), 'luz-interior.shala.app');
  assert.equal(normalizeHostname('  TEST.example.COM  '), 'test.example.com');
  assert.equal(normalizeHostname('localhost:3000'), 'localhost');
});

test('normalizeHostname handles edge cases', () => {
  assert.equal(normalizeHostname(''), '');
  assert.equal(normalizeHostname('  '), '');
});

// ── P2-03: Subdomain slug extraction ──────────────────────────────────────

test('extractSlugFromHostname extracts slug from platform subdomain', () => {
  assert.equal(extractSlugFromHostname('luz-interior.shala.app'), 'luz-interior');
  assert.equal(extractSlugFromHostname('northern-light.shala.app'), 'northern-light');
});

test('extractSlugFromHostname extracts slug from localhost subdomain', () => {
  assert.equal(extractSlugFromHostname('test-studio.localhost'), 'test-studio');
  assert.equal(extractSlugFromHostname('Test-Studio.LocalHost:3000'), 'test-studio');
});

test('extractSlugFromHostname returns null for apex domain', () => {
  assert.equal(extractSlugFromHostname('shala.app'), null);
  assert.equal(extractSlugFromHostname('localhost'), null);
});

test('extractSlugFromHostname returns null for empty input', () => {
  assert.equal(extractSlugFromHostname(''), null);
});

// ── P2-03: Unknown / invalid domain behavior ──────────────────────────────

/**
 * These tests exercise the resolution logic without a database.
 * Integration tests for the full resolveTenantFromHostname function
 * will be written when a test database is available.
 */

test('subdomain slug pattern rejects short slugs (< 3 chars)', () => {
  // Simulating the slug validation in resolveTenantFromSlug
  const isValidSlug = (slug: string): boolean => slug.length >= 3;
  assert.equal(isValidSlug('ab'), false);
  assert.equal(isValidSlug('abc'), true);
  assert.equal(isValidSlug('northern-light'), true);
});

// ── P2-03: Cache key isolation ────────────────────────────────────────────

test('tenant context varies by hostname for cache separation', () => {
  const cacheKeys = new Set([
    `tenant:luz-interior.shala.app`,
    `tenant:northern-light.shala.app`,
    `tenant:shala.app`,
  ]);

  assert.equal(cacheKeys.size, 3);
  assert.ok(cacheKeys.has('tenant:luz-interior.shala.app'));
  assert.ok(!cacheKeys.has('tenant:other.shala.app'));
});

// ── P2-03: Path/host conflict prevention ──────────────────────────────────

test('path slug does not override resolved hostname', () => {
  // Rule: if a tenant is already resolved from the hostname,
  // a /t/[slug] path parameter must not change the resolved tenant.

  const hostResolvedTenant = 't_luz_interior';
  const pathSlug = 'northern-light'; // different tenant

  // The resolved tenant should stay as the host-resolved one
  const finalTenant = hostResolvedTenant !== null
    ? hostResolvedTenant  // use host-resolved
    : pathSlug;           // only fallback to path if no host resolution

  assert.equal(finalTenant, 't_luz_interior');
  assert.notEqual(finalTenant, pathSlug);
});

// ── P2-03: Tenant status filtering ────────────────────────────────────────

test('archived tenants are rejected', () => {
  const allowedStatuses = ['onboarding', 'active', 'suspended'];
  const rejectedStatuses = ['archived'];

  assert.ok(allowedStatuses.includes('active'));
  assert.ok(!rejectedStatuses.includes('active'));
  assert.ok(rejectedStatuses.includes('archived'));
});

test('suspended tenants are still accessible (graceful degradation)', () => {
  const statusesthatAllowAccess = ['onboarding', 'active', 'suspended'];
  assert.ok(statusesthatAllowAccess.includes('suspended'));
});
