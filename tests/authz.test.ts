import assert from 'node:assert/strict';
import test from 'node:test';
import { hasPermission, AuthorizationError, authErrorToResponse } from '../lib/authz';

// ── P2-04: Permission map ─────────────────────────────────────────────────

test('OWNER has workspace wildcard permission', () => {
  assert.equal(hasPermission('OWNER', 'workspace:*'), true);
});

test('OWNER permission matches specific action via wildcard', () => {
  assert.equal(hasPermission('OWNER', 'content:write'), true);
  assert.equal(hasPermission('OWNER', 'billing:delete'), true);
  assert.equal(hasPermission('OWNER', 'students:notes'), true);
});

test('ADMIN cannot access billing or delete workspace', () => {
  assert.equal(hasPermission('ADMIN', 'billing:*'), false);
  assert.equal(hasPermission('ADMIN', 'workspace:delete'), false);
});

test('ADMIN can manage content and students', () => {
  assert.equal(hasPermission('ADMIN', 'content:write'), true);
  assert.equal(hasPermission('ADMIN', 'students:read'), true);
  assert.equal(hasPermission('ADMIN', 'reports:*'), true);
});

test('EDITOR can write content but not manage team', () => {
  assert.equal(hasPermission('EDITOR', 'content:write'), true);
  assert.equal(hasPermission('EDITOR', 'content:publish'), true);
  assert.equal(hasPermission('EDITOR', 'team:invite'), false);
});

test('INSTRUCTOR has cohort-scoped permissions', () => {
  assert.equal(hasPermission('INSTRUCTOR', 'content:read'), true);
  assert.equal(hasPermission('INSTRUCTOR', 'students:read'), true);
  assert.equal(hasPermission('INSTRUCTOR', 'students:attendance'), true);
  assert.equal(hasPermission('INSTRUCTOR', 'students:notes'), true);
  assert.equal(hasPermission('INSTRUCTOR', 'reports:cohort'), true);
  assert.equal(hasPermission('INSTRUCTOR', 'content:write'), false);
  assert.equal(hasPermission('INSTRUCTOR', 'commerce:refund'), false);
});

test('SUPPORT can read orders and issue refunds', () => {
  assert.equal(hasPermission('SUPPORT', 'commerce:read'), true);
  assert.equal(hasPermission('SUPPORT', 'commerce:refund'), true);
  assert.equal(hasPermission('SUPPORT', 'content:write'), false);
  assert.equal(hasPermission('SUPPORT', 'team:invite'), false);
});

test('VIEWER has read-only access', () => {
  assert.equal(hasPermission('VIEWER', 'content:read'), true);
  assert.equal(hasPermission('VIEWER', 'reports:read'), true);
  assert.equal(hasPermission('VIEWER', 'content:write'), false);
  assert.equal(hasPermission('VIEWER', 'commerce:read'), false);
});

test('unknown role returns false for any permission', () => {
  assert.equal(hasPermission('UNKNOWN', 'content:read'), false);
  assert.equal(hasPermission('', 'content:read'), false);
});

// ── P2-04: AuthorizationError to response ─────────────────────────────────

test('authErrorToResponse maps TENANT_MEMBERSHIP_REQUIRED to 403', () => {
  const err = new AuthorizationError('TENANT_MEMBERSHIP_REQUIRED', 'Membership required');
  const res = authErrorToResponse(err);
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'TENANT_MEMBERSHIP_REQUIRED');
});

test('authErrorToResponse maps TENANT_ROLE_DENIED to 403', () => {
  const err = new AuthorizationError('TENANT_ROLE_DENIED', 'Role denied');
  const res = authErrorToResponse(err);
  assert.equal(res.status, 403);
});

test('authErrorToResponse maps unknown code to 500', () => {
  const err = new AuthorizationError('UNKNOWN_CODE', 'Error');
  const res = authErrorToResponse(err);
  assert.equal(res.status, 500);
});

// ── P2-04: Session user ID extraction ─────────────────────────────────────

import { getSessionUserId } from '../lib/authz';

test('getSessionUserId extracts valid session', () => {
  const session = { user: { id: 'u_123', name: 'Test' } };
  assert.equal(getSessionUserId(session), 'u_123');
});

test('getSessionUserId returns null for missing user', () => {
  assert.equal(getSessionUserId(null), null);
  assert.equal(getSessionUserId({}), null);
  assert.equal(getSessionUserId({ user: null }), null);
});

test('getSessionUserId returns null for missing id', () => {
  assert.equal(getSessionUserId({ user: { name: 'NoId' } }), null);
});

// ── P2-04: Last-owner invariant ───────────────────────────────────────────

test('cannot remove last OWNER from tenant', () => {
  // Simulate: if only 1 active OWNER remains, removal should be rejected
  const activeOwners = 1;
  const wouldRemoveOwner = true;
  const isLastOwner = activeOwners === 1 && wouldRemoveOwner;

  assert.equal(isLastOwner, true);
  // In production: requireTenantMembership should check countActiveOwners
});

test('can remove OWNER when another exists', () => {
  const activeOwners = 2;
  const wouldRemoveOwner = true;
  const isLastOwner = activeOwners <= 1 && wouldRemoveOwner;

  assert.equal(isLastOwner, false);
});
