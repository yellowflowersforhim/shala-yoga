import { prisma } from '../lib/prisma';

async function main() {
  // Create second test tenant — Northern Light Yoga
  const t = await prisma.tenant.create({
    data: {
      slug: 'northern-light',
      name: 'Northern Light Yoga',
      status: 'active',
      defaultLocale: 'en',
      timezone: 'Europe/Oslo',
      currency: 'NOK',
    },
  });
  console.log('Tenant B:', t.slug, t.id);

  // Dev domain
  await prisma.domain.create({
    data: {
      tenantId: t.id,
      hostname: 'northern-light.localhost',
      type: 'platform_subdomain',
      status: 'verified',
      isCanonical: true,
    },
  });
  console.log('Domain B created');

  // Create brand theme for Northern Light
  await prisma.brandTheme.create({
    data: {
      tenantId: t.id,
      primaryColor: '#4f46e5',
      secondaryColor: '#6366f1',
      accentColor: '#06b6d4',
    },
  });
  console.log('Brand theme B created');

  // List all tenants
  const tenants = await prisma.tenant.findMany();
  console.log('\nAll tenants:');
  tenants.forEach((t) => console.log(`  ${t.slug} (${t.id}) - ${t.status}`));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
