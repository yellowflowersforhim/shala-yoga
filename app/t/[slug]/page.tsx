import { notFound } from 'next/navigation';
import { renderSections, SectionConfig } from '@/components/sections/page-sections';
import { db } from '@/lib/db';
import type { Tenant } from '@prisma/client';

/**
 * Tenant path-based resolution: /t/[slug]
 * Queries the database for the tenant and renders their published page sections.
 * Used in local development and preview environments.
 */
export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Query tenant from database
  let tenant: Tenant | null = null;
  let sections: SectionConfig[] = [];

  try {
    const found = await db.tenant.findUnique({ where: { slug } });
    if (!found) notFound();
    tenant = found;

    // Try to load published page sections
    const page = await db.page.findFirst({
      where: { tenantId: tenant.id, routeKey: 'home', isPublished: true },
      include: { revisions: { where: { status: 'published' }, take: 1 } },
    });

    if (page?.revisions[0]?.sections) {
      sections = page.revisions[0].sections as unknown as SectionConfig[];
    }
  } catch {
    // DB not available — fall back to defaults
  }

  if (sections.length === 0) {
    sections = [
      {
        type: 'hero', order: 1, visible: true,
        content: {
          headline: tenant?.name || slug,
          subheadline: 'Programas intensivos y clases semanales de Hatha Yoga.',
          ctaText: 'Explorar programas',
          ctaUrl: `/t/${slug}/programas`,
        },
      },
      {
        type: 'benefits', order: 2, visible: true,
        content: {
          headline: '¿Por qué elegirnos?',
          items: [
            { icon: '🧘', title: 'Práctica auténtica', description: 'Hatha Yoga clásico con instructores certificados.' },
            { icon: '⚡', title: 'Energía y vitalidad', description: 'Activa tu sistema energético y fortalece tu cuerpo.' },
            { icon: '🌿', title: 'Bienestar integral', description: 'Reduce el estrés y encuentra equilibrio duradero.' },
          ],
        },
      },
    ];
  }

  return <div>{renderSections(sections)}</div>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let name = slug;
  try {
    const tenant = await db.tenant.findUnique({ where: { slug }, select: { name: true } });
    if (tenant) name = tenant.name;
  } catch { /* DB not available */ }

  return { title: `${name} — Shala`, description: `Hatha Yoga con ${name} en Shala.` };
}
