
import { randomBytes } from 'crypto';

// Formatting utilities

export function formatPrice(cents: number, currency: string = 'EUR'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = randomBytes(5).toString('hex').toUpperCase();
  
  return `ORD-${year}${month}${day}-${random}`;
}

export function isEnrollmentOpen(
  enrollmentOpensAt: Date | string | null,
  enrollmentClosesAt: Date | string | null
): boolean {
  const now = new Date();
  
  if (enrollmentOpensAt) {
    const opensAt = typeof enrollmentOpensAt === 'string' ? new Date(enrollmentOpensAt) : enrollmentOpensAt;
    if (now < opensAt) return false;
  }
  
  if (enrollmentClosesAt) {
    const closesAt = typeof enrollmentClosesAt === 'string' ? new Date(enrollmentClosesAt) : enrollmentClosesAt;
    if (now > closesAt) return false;
  }
  
  return true;
}
