/**
 * Shala authorization layer.
 *
 * Centralized helpers that replace scattered `isAdmin` checks with
 * tenant-scoped membership and role verification.
 *
 * Rules:
 * - Platform permissions come from PlatformMembership role.
 * - Teacher permissions come from active TenantMembership.
 * - Public access is restricted to published tenant content.
 * - Never authorize solely on userId — always check membership + role.
 */

import { prisma } from '@/lib/prisma';
import { TenantContext } from '@/lib/tenant';

// ── Permission map ────────────────────────────────────────────────────────

/**
 * Which actions each role can perform.
 * Not a simple hierarchy — some roles have unique permissions.
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    'workspace:*',        // full workspace access
    'billing:*',          // billing, subscriptions, deletion
    'team:*',            // manage team members
    'settings:*',        // brand, domain, integrations
    'content:*',         // programs, pages, blog, media
    'commerce:*',        // orders, enrollments, refunds, coupons
    'students:*',        // student CRM, notes
    'communications:*',  // email, campaigns, newsletter
    'reports:*',         // analytics, exports
  ],
  ADMIN: [
    'team:read',
    'team:invite',
    'settings:read',
    'content:*',
    'commerce:*',
    'students:*',
    'communications:*',
    'reports:*',
  ],
  EDITOR: [
    'content:write',
    'content:publish',
    'communications:campaigns',
    'communications:newsletter',
  ],
  INSTRUCTOR: [
    'content:read',
    'students:read',
    'students:attendance',
    'students:notes',
    'reports:cohort',
  ],
  SUPPORT: [
    'commerce:read',
    'commerce:refund',
    'students:read',
    'students:notes',
  ],
  VIEWER: [
    'content:read',
    'reports:read',
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  // Check exact match
  if (permissions.includes(permission)) return true;

  // Check wildcard match: "content:*" matches "content:write"
  const [category] = permission.split(':');
  if (permissions.includes(`${category}:*`)) return true;

  return false;
}

// ── Platform authorization ────────────────────────────────────────────────

/**
 * Require the current user to have a platform role.
 * Returns the PlatformMembership or throws.
 */
export async function requirePlatformRole(
  userId: string,
  ...allowedRoles: string[]
): Promise<{ userId: string; role: string }> {
  const membership = await prisma.platformMembership.findUnique({
    where: { userId },
  });

  if (!membership) {
    throw new AuthorizationError('PLATFORM_ACCESS_DENIED', 'Platform access required');
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
    throw new AuthorizationError('PLATFORM_ROLE_DENIED', `Role ${membership.role} not permitted`);
  }

  return { userId: membership.userId, role: membership.role };
}

// ── Tenant membership authorization ───────────────────────────────────────

export type MemberContext = {
  userId: string;
  tenantId: string;
  role: string;
  membershipId: string;
};

/**
 * Require the current user to be an active member of the given tenant
 * with at least one of the allowed roles.
 */
export async function requireTenantMembership(
  userId: string,
  tenantId: string,
  ...allowedRoles: string[]
): Promise<MemberContext> {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: { tenantId, userId },
    },
  });

  if (!membership || membership.status !== 'active') {
    throw new AuthorizationError(
      'TENANT_MEMBERSHIP_REQUIRED',
      'Tenant membership required'
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
    throw new AuthorizationError(
      'TENANT_ROLE_DENIED',
      `Role ${membership.role} not permitted for this operation`
    );
  }

  return {
    userId: membership.userId,
    tenantId: membership.tenantId,
    role: membership.role,
    membershipId: membership.id,
  };
}

/**
 * Convenience: require tenant membership + a specific permission.
 */
export async function requireTenantPermission(
  userId: string,
  tenantId: string,
  permission: string
): Promise<MemberContext> {
  const member = await requireTenantMembership(userId, tenantId);

  if (!hasPermission(member.role, permission)) {
    throw new AuthorizationError(
      'TENANT_PERMISSION_DENIED',
      `Permission "${permission}" denied for role "${member.role}"`
    );
  }

  return member;
}

/**
 * Check if a user is a member of a tenant (non-throwing).
 */
export async function getTenantMembership(
  userId: string,
  tenantId: string
): Promise<MemberContext | null> {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: { tenantId, userId },
    },
  });

  if (!membership || membership.status !== 'active') return null;

  return {
    userId: membership.userId,
    tenantId: membership.tenantId,
    role: membership.role,
    membershipId: membership.id,
  };
}

/**
 * Check if user is tenant OWNER (non-throwing).
 * Used for ownership-transfer invariants.
 */
export async function isTenantOwner(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const membership = await getTenantMembership(userId, tenantId);
  return membership?.role === 'OWNER';
}

/**
 * Count active OWNERs in a tenant. Used to enforce last-owner invariant.
 */
export async function countActiveOwners(tenantId: string): Promise<number> {
  return prisma.tenantMembership.count({
    where: {
      tenantId,
      role: 'OWNER',
      status: 'active',
    },
  });
}

// ── Auth helpers for API routes and server components ─────────────────────

/**
 * Get the current session user ID from NextAuth session.
 * Returns null if not authenticated.
 */
export function getSessionUserId(session: unknown): string | null {
  if (
    session &&
    typeof session === 'object' &&
    'user' in session &&
    session.user &&
    typeof session.user === 'object' &&
    'id' in session.user &&
    typeof (session.user as Record<string, unknown>).id === 'string'
  ) {
    return (session.user as Record<string, string>).id;
  }
  return null;
}

/**
 * Legacy compatibility: check if user has global admin flag.
 * This will be phased out as tenant-scoped auth replaces it.
 */
export async function isGlobalAdmin(userId: string): Promise<boolean> {
  const membership = await prisma.platformMembership.findUnique({
    where: { userId },
  });
  return membership?.role === 'SUPER_ADMIN';
}

// ── Error type ────────────────────────────────────────────────────────────

export class AuthorizationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthorizationError';
  }
}

/**
 * Convert an AuthorizationError into a NextResponse-friendly object.
 */
export function authErrorToResponse(error: AuthorizationError): {
  status: number;
  body: { error: string; code: string };
} {
  const statusMap: Record<string, number> = {
    PLATFORM_ACCESS_DENIED: 403,
    PLATFORM_ROLE_DENIED: 403,
    TENANT_MEMBERSHIP_REQUIRED: 403,
    TENANT_ROLE_DENIED: 403,
    TENANT_PERMISSION_DENIED: 403,
  };

  return {
    status: statusMap[error.code] || 500,
    body: { error: error.message, code: error.code },
  };
}
