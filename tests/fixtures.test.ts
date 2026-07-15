import assert from 'node:assert/strict';
import test from 'node:test';

// ── P1-04: Two-tenant synthetic test fixtures ──────────────────────────────
//
// These fixtures define TWO visibly distinct tenants with synthetic data.
// Neither tenant uses Joan, Ahora Hatha Yoga, Barcelona, or orange styling.
//
// Tenant A: "Luz Interior Yoga" — green/teal themed, Spanish, Madrid
// Tenant B: "Northern Light Yoga" — blue/indigo themed, English, Oslo

export interface TenantFixture {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'onboarding' | 'suspended' | 'archived';
  defaultLocale: string;
  timezone: string;
  currency: string;
  brand: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string | null;
    faviconUrl: string | null;
  };
  teacherProfile: {
    displayName: string;
    title: string;
    bio: string;
    languages: string[];
    location: string;
  };
  siteSettings: {
    title: string;
    description: string;
    heroHeadline: string;
    heroSubheadline: string;
  };
}

export const tenantA: TenantFixture = {
  id: 't_luz_interior',
  slug: 'luz-interior',
  name: 'Luz Interior Yoga',
  status: 'active',
  defaultLocale: 'es',
  timezone: 'Europe/Madrid',
  currency: 'EUR',
  brand: {
    primaryColor: '#0d9488',   // teal-600
    secondaryColor: '#14b8a6', // teal-500
    accentColor: '#f59e0b',    // amber-500
    logoUrl: null,
    faviconUrl: null,
  },
  teacherProfile: {
    displayName: 'Elena Torres',
    title: 'Instructora de Hatha Yoga',
    bio: 'Elena descubrió el yoga tras años de práctica de meditación en el Himalaya. Su enfoque combina precisión técnica con calidez humana.',
    languages: ['es', 'en'],
    location: 'Madrid, España',
  },
  siteSettings: {
    title: 'Luz Interior Yoga — Yoga en Madrid',
    description: 'Clases de Hatha Yoga en Madrid. Programas intensivos, sesiones semanales y formación para todos los niveles.',
    heroHeadline: 'Encuentra tu luz interior a través del yoga',
    heroSubheadline: 'Programas intensivos y clases semanales en Madrid',
  },
};

export const tenantB: TenantFixture = {
  id: 't_northern_light',
  slug: 'northern-light',
  name: 'Northern Light Yoga',
  status: 'active',
  defaultLocale: 'en',
  timezone: 'Europe/Oslo',
  currency: 'NOK',
  brand: {
    primaryColor: '#4f46e5',   // indigo-600
    secondaryColor: '#6366f1', // indigo-500
    accentColor: '#06b6d4',    // cyan-500
    logoUrl: null,
    faviconUrl: null,
  },
  teacherProfile: {
    displayName: 'Lars Nilsen',
    title: 'Hatha Yoga Teacher & Movement Coach',
    bio: 'Lars brings 15 years of bodywork and yoga experience. His practice integrates classical Hatha with functional movement, creating a grounded, accessible approach.',
    languages: ['en', 'no'],
    location: 'Oslo, Norway',
  },
  siteSettings: {
    title: 'Northern Light Yoga — Hatha Yoga in Oslo',
    description: 'Hatha Yoga classes and intensive programs in Oslo. Build strength, stability, and inner clarity.',
    heroHeadline: 'Stillness within movement',
    heroSubheadline: 'Intensive programs and weekly classes in Oslo',
  },
};

// ── Shared program templates (synthetic) ───────────────────────────────────

export interface ProgramFixture {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string;
  durationWeeks: number;
  priceCents: number;
  currency: string;
}

export interface CohortFixture {
  id: string;
  tenantId: string;
  programId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  maxSeats: number;
  scheduleText: string;
  location: string;
  language: string;
  isPublished: boolean;
}

export function tenantAPrograms(): ProgramFixture[] {
  return [
    {
      id: 'p_li_foundations',
      tenantId: tenantA.id,
      slug: 'fundamentos-hatha',
      title: 'Fundamentos de Hatha Yoga',
      description: 'Programa introductorio de 4 semanas para principiantes.',
      durationWeeks: 4,
      priceCents: 9500,
      currency: 'EUR',
    },
    {
      id: 'p_li_advanced',
      tenantId: tenantA.id,
      slug: 'hatha-avanzado',
      title: 'Hatha Yoga Avanzado',
      description: 'Programa de profundización de 8 semanas.',
      durationWeeks: 8,
      priceCents: 18000,
      currency: 'EUR',
    },
  ];
}

export function tenantACohorts(): CohortFixture[] {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  const endMonth = new Date(nextMonth);
  endMonth.setDate(endMonth.getDate() + 28);

  return [
    {
      id: 'c_li_march',
      tenantId: tenantA.id,
      programId: 'p_li_foundations',
      name: 'Grupo Marzo',
      startDate: nextMonth,
      endDate: endMonth,
      maxSeats: 12,
      scheduleText: 'Lunes y Miércoles, 19:00-20:30',
      location: 'Centro Mandala, Calle Mayor 15, Madrid',
      language: 'es',
      isPublished: true,
    },
  ];
}

export function tenantBPrograms(): ProgramFixture[] {
  return [
    {
      id: 'p_nl_foundations',
      tenantId: tenantB.id,
      slug: 'hatha-foundations',
      title: 'Hatha Yoga Foundations',
      description: 'An 8-week introduction to classical Hatha Yoga.',
      durationWeeks: 8,
      priceCents: 180000, // 1800 NOK
      currency: 'NOK',
    },
    {
      id: 'p_nl_mobility',
      tenantId: tenantB.id,
      slug: 'yoga-mobility',
      title: 'Yoga & Mobility',
      description: 'A 6-week program combining Hatha Yoga with functional mobility work.',
      durationWeeks: 6,
      priceCents: 150000, // 1500 NOK
      currency: 'NOK',
    },
  ];
}

export function tenantBCohorts(): CohortFixture[] {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const endMonth = new Date(nextMonth);
  endMonth.setDate(endMonth.getDate() + 56);

  return [
    {
      id: 'c_nl_spring',
      tenantId: tenantB.id,
      programId: 'p_nl_foundations',
      name: 'Spring Cohort',
      startDate: nextMonth,
      endDate: endMonth,
      maxSeats: 10,
      scheduleText: 'Tuesdays & Thursdays, 18:00-19:30',
      location: 'Frogner Studio, Kirkeveien 42, Oslo',
      language: 'en',
      isPublished: true,
    },
  ];
}

// ── Synthetic user fixtures ────────────────────────────────────────────────

export interface UserFixture {
  id: string;
  name: string;
  email: string;
  role: string;  // tenant membership role for the user's primary tenant
}

export const syntheticUsers: Record<string, UserFixture> = {
  elenaOwner: {
    id: 'u_elena_owner',
    name: 'Elena Torres',
    email: 'elena@luzinterior.test',
    role: 'OWNER',
  },
  larsOwner: {
    id: 'u_lars_owner',
    name: 'Lars Nilsen',
    email: 'lars@northernlight.test',
    role: 'OWNER',
  },
  studentA: {
    id: 'u_student_a',
    name: 'Carmen Ruiz',
    email: 'carmen@email.test',
    role: 'STUDENT',
  },
  studentB: {
    id: 'u_student_b',
    name: 'Erik Johansen',
    email: 'erik@email.test',
    role: 'STUDENT',
  },
};

// ── Verification tests ─────────────────────────────────────────────────────

test('tenants have distinct identities', () => {
  assert.notEqual(tenantA.name, tenantB.name);
  assert.notEqual(tenantA.slug, tenantB.slug);
  assert.notEqual(tenantA.brand.primaryColor, tenantB.brand.primaryColor);
});

test('tenant A uses non-orange branding', () => {
  const orangeColors = ['#f97316', '#ea580c', '#c2410c', '#f97316'];
  assert.ok(!orangeColors.includes(tenantA.brand.primaryColor));
  assert.ok(!orangeColors.includes(tenantA.brand.secondaryColor));
});

test('tenant B uses non-orange branding', () => {
  const orangeColors = ['#f97316', '#ea580c', '#c2410c'];
  assert.ok(!orangeColors.includes(tenantB.brand.primaryColor));
  assert.ok(!orangeColors.includes(tenantB.brand.secondaryColor));
});

test('neither tenant uses Joan or Ahora in names', () => {
  const forbidden = ['joan', 'ahora', 'barcelona'];
  for (const word of forbidden) {
    assert.ok(!tenantA.name.toLowerCase().includes(word), `Tenant A contains ${word}`);
    assert.ok(!tenantB.name.toLowerCase().includes(word), `Tenant B contains ${word}`);
    assert.ok(!tenantA.teacherProfile.displayName.toLowerCase().includes(word));
    assert.ok(!tenantB.teacherProfile.displayName.toLowerCase().includes(word));
  }
});

test('programs are scoped to their tenant', () => {
  const progsA = tenantAPrograms();
  const progsB = tenantBPrograms();
  for (const p of progsA) assert.equal(p.tenantId, tenantA.id);
  for (const p of progsB) assert.equal(p.tenantId, tenantB.id);
});

test('cohorts are scoped to their tenant', () => {
  const cohortsA = tenantACohorts();
  const cohortsB = tenantBCohorts();
  for (const c of cohortsA) assert.equal(c.tenantId, tenantA.id);
  for (const c of cohortsB) assert.equal(c.tenantId, tenantB.id);
});

test('fixtures use different currencies', () => {
  assert.equal(tenantA.currency, 'EUR');
  assert.equal(tenantB.currency, 'NOK');
  assert.notEqual(tenantA.currency, tenantB.currency);
});

test('fixtures use different locales', () => {
  assert.equal(tenantA.defaultLocale, 'es');
  assert.equal(tenantB.defaultLocale, 'en');
});
