/**
 * P2-02: Backfill the reference (Joan/Ahora) tenant.
 *
 * Strategy: expand/backfill/verify/contract
 *   1. EXPAND: Run the migration to add nullable tenantId columns (P2-01).
 *   2. BACKFILL: This script creates a Joan/Ahora tenant and assigns all
 *      existing records to it.
 *   3. VERIFY: Check no records are orphaned, counts match expectations.
 *   4. CONTRACT: Make tenantId required (P2-06).
 *
 * This script is IDEMPOTENT — running it twice does not duplicate data.
 *
 * Usage: npx tsx --require dotenv/config scripts/backfill-tenant.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REFERENCE_TENANT = {
  slug: 'ahora-hatha-yoga',
  name: 'Ahora Hatha Yoga',
  defaultLocale: 'es',
  timezone: 'Europe/Madrid',
  currency: 'EUR',
};

async function main() {
  console.log('P2-02: Backfill reference tenant');
  console.log('================================\n');

  // ── Step 1: Count existing records before backfill ─────────────────────
  const before = {
    programs: await prisma.program.count(),
    cohorts: await prisma.cohort.count(),
    enrollments: await prisma.enrollment.count(),
    orders: await prisma.order.count(),
    coupons: await prisma.coupon.count(),
    newsletterSubscribers: await prisma.newsletterSubscriber.count(),
    emailCampaigns: await prisma.emailCampaign.count(),
    feedback: await prisma.feedback.count(),
    adminNotes: await prisma.adminNote.count(),
    conversionEvents: await prisma.conversionEvent.count(),
    notifications: await prisma.notification.count(),
    weeklySessions: await prisma.weeklySession.count(),
  };

  console.log('Records before backfill:');
  for (const [key, count] of Object.entries(before)) {
    console.log(`  ${key}: ${count}`);
  }

  // ── Step 2: Find or create the reference tenant ────────────────────────
  let tenant = await prisma.tenant.findUnique({
    where: { slug: REFERENCE_TENANT.slug },
  });

  if (tenant) {
    console.log(`\n✅ Reference tenant already exists: ${tenant.id} (${tenant.slug})`);
  } else {
    tenant = await prisma.tenant.create({
      data: REFERENCE_TENANT,
    });
    console.log(`\n✅ Created reference tenant: ${tenant.id} (${tenant.slug})`);
  }

  // ── Step 3: Assign orphaned records to the reference tenant ────────────
  const backfillResults: Record<string, number> = {};

  // Programs
  const orphanedPrograms = await prisma.program.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.programs = orphanedPrograms.count;

  // Cohorts
  const orphanedCohorts = await prisma.cohort.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.cohorts = orphanedCohorts.count;

  // Enrollments
  const orphanedEnrollments = await prisma.enrollment.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.enrollments = orphanedEnrollments.count;

  // Orders
  const orphanedOrders = await prisma.order.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.orders = orphanedOrders.count;

  // Coupons
  const orphanedCoupons = await prisma.coupon.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.coupons = orphanedCoupons.count;

  // Newsletter subscribers
  const orphanedSubscribers = await prisma.newsletterSubscriber.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.newsletterSubscribers = orphanedSubscribers.count;

  // Email campaigns
  const orphanedCampaigns = await prisma.emailCampaign.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.emailCampaigns = orphanedCampaigns.count;

  // Feedback
  const orphanedFeedback = await prisma.feedback.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.feedback = orphanedFeedback.count;

  // Admin notes
  const orphanedNotes = await prisma.adminNote.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.adminNotes = orphanedNotes.count;

  // Conversion events
  const orphanedConversions = await prisma.conversionEvent.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.conversionEvents = orphanedConversions.count;

  // Notifications
  const orphanedNotifications = await prisma.notification.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.notifications = orphanedNotifications.count;

  // Weekly sessions
  const orphanedSessions = await prisma.weeklySession.updateMany({
    where: { tenantId: null },
    data: { tenantId: tenant.id },
  });
  backfillResults.weeklySessions = orphanedSessions.count;

  console.log('\nBackfill results:');
  for (const [key, count] of Object.entries(backfillResults)) {
    console.log(`  ${key}: ${count} assigned`);
  }

  // ── Step 4: Verify — no orphaned records remain ────────────────────────
  const after = {
    programs: await prisma.program.count({ where: { tenantId: null } }),
    cohorts: await prisma.cohort.count({ where: { tenantId: null } }),
    enrollments: await prisma.enrollment.count({ where: { tenantId: null } }),
    orders: await prisma.order.count({ where: { tenantId: null } }),
    coupons: await prisma.coupon.count({ where: { tenantId: null } }),
    newsletterSubscribers: await prisma.newsletterSubscriber.count({ where: { tenantId: null } }),
    emailCampaigns: await prisma.emailCampaign.count({ where: { tenantId: null } }),
    feedback: await prisma.feedback.count({ where: { tenantId: null } }),
    adminNotes: await prisma.adminNote.count({ where: { tenantId: null } }),
    conversionEvents: await prisma.conversionEvent.count({ where: { tenantId: null } }),
    notifications: await prisma.notification.count({ where: { tenantId: null } }),
    weeklySessions: await prisma.weeklySession.count({ where: { tenantId: null } }),
  };

  console.log('\nOrphaned records after backfill (should all be 0):');
  let allClean = true;
  for (const [key, count] of Object.entries(after)) {
    const status = count === 0 ? '✅' : '❌ ORPHANED';
    if (count !== 0) allClean = false;
    console.log(`  ${key}: ${count} ${status}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n================================');
  console.log(allClean ? '✅ Backfill complete — no orphaned records.' : '❌ Backfill incomplete — orphaned records remain!');
  console.log(`Reference tenant ID: ${tenant.id}`);
  console.log('\nNext: Run migrate + verify, then create domain record manually.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
