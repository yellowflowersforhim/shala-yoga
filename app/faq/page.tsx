import { Metadata } from 'next';
import { renderSections, SectionConfig } from '@/components/sections/page-sections';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Respuestas a las preguntas más comunes sobre Hatha Yoga.',
};

const SECTIONS: SectionConfig[] = [
  {
    type: 'faq',
    order: 1,
    visible: true,
    content: {
      headline: 'Preguntas Frecuentes',
      items: [
        { question: '¿Necesito experiencia previa?', answer: 'No, nuestros programas están diseñados para todos los niveles, desde principiantes hasta practicantes avanzados.' },
        { question: '¿Qué debo llevar a clase?', answer: 'Ropa cómoda, una esterilla de yoga, una botella de agua y muchas ganas de aprender.' },
        { question: '¿Cuánto dura un programa intensivo?', answer: 'La duración varía según el programa. Consulta la página de cada programa para más detalles.' },
        { question: '¿Hay clases online?', answer: 'Sí, ofrecemos tanto clases presenciales como online. Consulta los horarios disponibles.' },
      ],
    },
  },
  {
    type: 'cta',
    order: 2,
    visible: true,
    content: {
      headline: '¿Tienes más preguntas?',
      subheadline: 'Estaremos encantados de ayudarte.',
      ctaText: 'Contactar',
      ctaUrl: '/contacto',
    },
  },
];

export default function FaqPage() {
  return <div>{renderSections(SECTIONS)}</div>;
}
