import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_STORE = Symbol.for('ahora-hatha-yoga.rate-limit-store');

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type GlobalWithRateLimits = typeof globalThis & {
  [RATE_LIMIT_STORE]?: Map<string, RateLimitEntry>;
};

const rateLimitStore = (globalThis as GlobalWithRateLimits)[RATE_LIMIT_STORE] ?? new Map<string, RateLimitEntry>();
(globalThis as GlobalWithRateLimits)[RATE_LIMIT_STORE] = rateLimitStore;

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

export function getPasswordValidationError(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 10) {
    return 'La contraseña debe tener al menos 10 caracteres';
  }
  if (Buffer.byteLength(value, 'utf8') > 72) {
    return 'La contraseña es demasiado larga';
  }
  return null;
}

export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\0/g, '').trim().slice(0, maxLength);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashPurposeToken(purpose: 'email-verification' | 'password-reset', token: string): string {
  return createHash('sha256').update(`${purpose}:${token}`).digest('hex');
}

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Best-effort per-instance abuse protection. Production should additionally
 * enforce distributed rate limits at the CDN/reverse proxy.
 */
export function enforceRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const now = Date.now();
  const key = `${scope}:${getClientIdentifier(request)}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;

  if (current.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  return NextResponse.json(
    { error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'Cache-Control': 'no-store',
      },
    }
  );
}

export function isIdentifierRateLimited(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const key = `${scope}:${identifier}`;
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) return false;
  return current.count >= limit;
}

export function recordIdentifierFailure(scope: string, identifier: string, windowMs: number): void {
  const now = Date.now();
  const key = `${scope}:${identifier}`;
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
}

export function clearIdentifierFailures(scope: string, identifier: string): void {
  rateLimitStore.delete(`${scope}:${identifier}`);
}
