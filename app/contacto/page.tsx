import { Suspense } from 'react';
import type { Metadata } from 'next';
import { renderSections, SectionConfig } from '@/components/sections/page-sections';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ponte en contacto con tu instructor de Hatha Yoga.',
};

const SECTIONS: SectionConfig[] = [
  {
    type: 'contact',
    order: 1,
    visible: true,
    content: {
      headline: 'Contacto',
      email: 'info@shala.app',
      phone: '',
      location: '',
    },
  },
];

export default function ContactoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <div>{renderSections(SECTIONS)}</div>
    </Suspense>
  );
}
