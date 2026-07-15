import { Metadata } from 'next';
import { renderSections, SectionConfig } from '@/components/sections/page-sections';

export const metadata: Metadata = {
  title: 'Metodología',
  description: 'Nuestra metodología de enseñanza de Hatha Yoga.',
};

const SECTIONS: SectionConfig[] = [
  {
    type: 'methodology',
    order: 1,
    visible: true,
    content: {
      headline: 'Nuestra Metodología',
      items: [
        { icon: '🎯', title: 'Práctica precisa', description: 'Cada postura se enseña con precisión, respetando la tradición del Hatha Yoga clásico.' },
        { icon: '❤️', title: 'Enfoque personal', description: 'Adaptamos la práctica a cada estudiante, respetando su ritmo y necesidades.' },
        { icon: '🧠', title: 'Conexión cuerpo-mente', description: 'El yoga va más allá del ejercicio físico: cultivamos atención plena y presencia.' },
        { icon: '✓', title: 'Resultados duraderos', description: 'Nuestros estudiantes reportan mejor energía, sueño y bienestar general.' },
      ],
    },
  },
];

export default function MetodologiaPage() {
  return <div>{renderSections(SECTIONS)}</div>;
}
