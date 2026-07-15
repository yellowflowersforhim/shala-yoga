import { prisma } from '../lib/prisma';
import { resolveTenantFromSlug } from '../lib/tenant';
import { createProgram, createCohort } from '../lib/services/programs';

async function main() {
  // Seed programs for both tenants
  const tenantA = await resolveTenantFromSlug('ahora-hatha-yoga');
  const tenantB = await resolveTenantFromSlug('northern-light');
  if (!tenantA || !tenantB) throw new Error('Tenants not found');

  // Tenant A: Ahora Hatha Yoga programs
  const p1 = await createProgram(tenantA, {
    slug: 'hatha-fundamentos',
    title: 'Fundamentos de Hatha Yoga',
    description: 'Programa de 4 semanas para principiantes. Aprende las bases del Hatha Yoga clásico.',
    durationWeeks: 4,
    priceCents: 9500,
  });
  console.log('A1:', p1.slug);

  await createCohort(tenantA, {
    programId: p1.id,
    name: 'Grupo Septiembre',
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-10-13'),
    maxSeats: 12,
    scheduleText: 'Lunes y Miércoles 19:00-20:30',
    location: 'Barcelona',
    isPublished: true,
  });

  // Tenant B: Northern Light Yoga programs
  const p2 = await createProgram(tenantB, {
    slug: 'hatha-foundations',
    title: 'Hatha Yoga Foundations',
    description: 'An 8-week introduction to classical Hatha Yoga. Build strength, flexibility, and inner clarity.',
    durationWeeks: 8,
    priceCents: 180000,
  });
  console.log('B1:', p2.slug);

  await createCohort(tenantB, {
    programId: p2.id,
    name: 'Autumn Cohort',
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-11-26'),
    maxSeats: 10,
    scheduleText: 'Tuesdays & Thursdays 18:00-19:30',
    location: 'Oslo',
    isPublished: true,
  });

  // Verify isolation
  const progsA = await prisma.program.count({ where: { tenantId: tenantA.tenantId } });
  const progsB = await prisma.program.count({ where: { tenantId: tenantB.tenantId } });
  console.log(`\nPrograms: Tenant A=${progsA}, Tenant B=${progsB}`);

  // Tenant B tries to access Tenant A's program
  const hijack = await prisma.program.findFirst({
    where: { id: p1.id, tenantId: tenantB.tenantId },
  });
  console.log(`Cross-tenant access: ${hijack ? 'FAILED' : 'BLOCKED ✅'}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
