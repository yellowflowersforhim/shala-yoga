import { Metadata } from 'next';
import { renderSections, SectionConfig } from '@/components/sections/page-sections';

export const metadata: Metadata = {
  title: 'Testimonios',
  description: 'Lo que nuestros estudiantes dicen sobre su experiencia.',
};

const SECTIONS: SectionConfig[] = [
  {
    type: 'testimonials',
    order: 1,
    visible: true,
    content: {
      headline: 'Testimonios',
      items: [
        { quote: 'Descubrí una nueva forma de entender mi cuerpo y mi energía. La práctica me ha ayudado a encontrar equilibrio en mi día a día.', author: 'Estudiante de Hatha Yoga' },
        { quote: 'Pensé que el yoga no era para mí, pero la metodología y el acompañamiento me hicieron sentir cómoda desde el primer día.', author: 'Estudiante de Hatha Yoga' },
        { quote: 'Después de meses de práctica, mi flexibilidad y fuerza han mejorado notablemente. Pero lo mejor es la claridad mental que he ganado.', author: 'Estudiante de Hatha Yoga' },
      ],
    },
  },
  {
    type: 'cta',
    order: 2,
    visible: true,
    content: {
      headline: '¿Listo para tu transformación?',
      subheadline: 'Únete a nuestra comunidad de estudiantes.',
      ctaText: 'Ver programas',
      ctaUrl: '/programas',
    },
  },
];

export default function TestimoniosPage() {
  return <div>{renderSections(SECTIONS)}</div>;
}
