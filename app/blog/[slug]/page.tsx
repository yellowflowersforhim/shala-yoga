import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { renderSections, SectionConfig } from '@/components/sections/page-sections';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, ' ')} — Shala Blog`,
    description: 'Artículo del blog de Shala.',
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Resolve tenant to make page tenant-aware
  await getTenantFromRequest(await headers());
  const sections: SectionConfig[] = [
    {
      type: 'benefits',
      order: 1,
      visible: true,
      content: {
        headline: slug.replace(/-/g, ' '),
        items: [
          { icon: '📄', title: 'Próximamente', description: 'El contenido completo de este artículo estará disponible pronto.' },
        ],
      },
    },
  ];

  return <div>{renderSections(sections)}</div>;
}
