import { Suspense } from 'react';
import type { Metadata } from 'next';
import { renderSections, SectionConfig } from '@/components/sections/page-sections';

export const metadata: Metadata = {
  title: 'Sobre Mí',
  description: 'Conoce a tu instructor de Hatha Yoga.',
};

const SECTIONS: SectionConfig[] = [
  {
    type: 'teacher_summary',
    order: 1,
    visible: true,
    content: {
      headline: 'Conoce a tu instructor',
      bio: 'Cada instructor en Shala aporta su experiencia única y formación en Hatha Yoga clásico. Descubre quién te guiará en tu práctica.',
      ctaText: 'Ver programas',
      ctaUrl: '/programas',
    },
  },
];

export default function SobreMiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <div>{renderSections(SECTIONS)}</div>
    </Suspense>
  );
}
