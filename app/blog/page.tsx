import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { renderSections, SectionConfig } from '@/components/sections/page-sections';

export const metadata: Metadata = {
  title: 'Blog — Shala',
  description: 'Artículos sobre Hatha Yoga, bienestar y práctica.',
};

const PLACEHOLDER: SectionConfig[] = [
  {
    type: 'benefits',
    order: 1,
    visible: true,
    content: {
      headline: 'Blog',
      items: [
        { icon: '📝', title: 'Próximamente', description: 'Artículos sobre Hatha Yoga, bienestar y práctica estarán disponibles pronto.' },
      ],
    },
  },
  {
    type: 'cta',
    order: 2,
    visible: true,
    content: {
      headline: 'Suscríbete a nuestro newsletter',
      subheadline: 'Recibe los nuevos artículos directamente en tu correo.',
      ctaText: 'Suscribirse',
      ctaUrl: '#newsletter',
    },
  },
];

export default async function BlogPage() {
  // Resolve tenant to make page tenant-aware (blog content will be loaded
  // from typed sections / Page model when available)
  await getTenantFromRequest(await headers());
  return <div>{renderSections(PLACEHOLDER)}</div>;
}
