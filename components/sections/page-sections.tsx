/**
 * Typed page section components.
 *
 * Each section maps a validated JSON schema to a React component.
 * Sections receive content data and render with tenant-branded styling
 * via CSS custom properties (--brand-* tokens in globals.css).
 */

import React from 'react';

// ── Section type definitions ──────────────────────────────────────────────

export type SectionType =
  | 'hero'
  | 'benefits'
  | 'teacher_summary'
  | 'programs_featured'
  | 'cohorts_upcoming'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'methodology'
  | 'newsletter';

export interface SectionConfig {
  type: SectionType;
  order: number;
  visible: boolean;
  content: Record<string, unknown>;
  variant?: string;
}

// ── Hero Section ──────────────────────────────────────────────────────────

function HeroSection({ content }: { content: Record<string, unknown> }) {
  const cta = content.ctaText ? String(content.ctaText) : null;
  const ctaUrl = content.ctaUrl ? String(content.ctaUrl) : '#';
  return React.createElement('section', {
    className: 'relative py-24 px-4 bg-gradient-to-br from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-to))] text-white'
  },
    React.createElement('div', { className: 'max-w-4xl mx-auto text-center' },
      React.createElement('h1', { className: 'text-4xl md:text-5xl font-bold mb-6' }, String(content.headline || '')),
      React.createElement('p', { className: 'text-xl opacity-90 mb-8 max-w-2xl mx-auto' }, String(content.subheadline || '')),
      cta && React.createElement('a', {
        href: ctaUrl,
        className: 'inline-block bg-white text-[hsl(var(--brand-primary))] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors'
      }, cta)
    )
  );
}

// ── Benefits Section ──────────────────────────────────────────────────────

function BenefitsSection({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items as Record<string, unknown>[] : [];
  return React.createElement('section', {
    className: 'py-20 px-4 bg-[hsl(var(--brand-primary-light))]'
  },
    React.createElement('div', { className: 'max-w-6xl mx-auto' },
      React.createElement('h2', { className: 'text-3xl font-bold text-center mb-12' }, String(content.headline || 'Beneficios')),
      React.createElement('div', { className: 'grid md:grid-cols-3 gap-8' },
        items.map((item, i) =>
          React.createElement('div', {
            key: i,
            className: 'bg-white rounded-xl p-8 shadow-sm border border-[hsl(var(--brand-primary-light))]'
          },
            React.createElement('div', { className: 'w-12 h-12 bg-[hsl(var(--brand-primary-light))] rounded-full flex items-center justify-center mb-4' },
              React.createElement('span', { className: 'text-[hsl(var(--brand-primary))] text-xl font-bold' }, String(item.icon || '✓'))
            ),
            React.createElement('h3', { className: 'text-xl font-semibold mb-2' }, String(item.title || '')),
            React.createElement('p', { className: 'text-gray-600' }, String(item.description || ''))
          )
        )
      )
    )
  );
}

// ── Teacher Summary ───────────────────────────────────────────────────────

function TeacherSummarySection({ content }: { content: Record<string, unknown> }) {
  const imageUrl = content.imageUrl ? String(content.imageUrl) : null;
  const cta = content.ctaText ? String(content.ctaText) : null;
  const ctaUrl = content.ctaUrl ? String(content.ctaUrl) : '#';
  return React.createElement('section', { className: 'py-20 px-4' },
    React.createElement('div', { className: 'max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center' },
      imageUrl && React.createElement('div', {
        className: 'aspect-[3/4] bg-[hsl(var(--brand-primary-light))] rounded-2xl overflow-hidden shadow-xl'
      },
        React.createElement('img', {
          src: imageUrl,
          alt: String(content.imageAlt || 'Teacher'),
          className: 'w-full h-full object-cover'
        })
      ),
      React.createElement('div', null,
        React.createElement('h2', { className: 'text-3xl font-bold mb-4' }, String(content.headline || 'Conoce a tu instructor')),
        React.createElement('p', { className: 'text-gray-700 leading-relaxed mb-6' }, String(content.bio || '')),
        cta && React.createElement('a', {
          href: ctaUrl,
          className: 'inline-block bg-[hsl(var(--brand-primary))] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity'
        }, cta)
      )
    )
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────

function TestimonialsSection({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items as Record<string, unknown>[] : [];
  return React.createElement('section', {
    className: 'py-20 px-4 bg-[hsl(var(--brand-primary-light))]'
  },
    React.createElement('div', { className: 'max-w-6xl mx-auto' },
      React.createElement('h2', { className: 'text-3xl font-bold text-center mb-12' }, String(content.headline || 'Testimonios')),
      React.createElement('div', { className: 'grid md:grid-cols-3 gap-8' },
        items.map((item, i) =>
          React.createElement('blockquote', {
            key: i,
            className: 'bg-white p-6 rounded-xl shadow-sm border border-[hsl(var(--brand-primary-light))]'
          },
            React.createElement('p', { className: 'text-gray-700 italic mb-4' }, `"${String(item.quote || '')}"`),
            React.createElement('p', { className: 'text-[hsl(var(--brand-primary))] font-semibold' }, `— ${String(item.author || '')}`)
          )
        )
      )
    )
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────

function FaqSection({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items as Record<string, unknown>[] : [];
  return React.createElement('section', { className: 'py-20 px-4' },
    React.createElement('div', { className: 'max-w-3xl mx-auto' },
      React.createElement('h2', { className: 'text-3xl font-bold text-center mb-12' }, String(content.headline || 'Preguntas Frecuentes')),
      React.createElement('div', { className: 'space-y-4' },
        items.map((item, i) =>
          React.createElement('details', {
            key: i,
            className: 'bg-white border border-[hsl(var(--brand-primary-light))] rounded-xl p-6'
          },
            React.createElement('summary', { className: 'font-semibold cursor-pointer text-lg' }, String(item.question || '')),
            React.createElement('p', { className: 'mt-4 text-gray-600' }, String(item.answer || ''))
          )
        )
      )
    )
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────

function CtaSection({ content }: { content: Record<string, unknown> }) {
  const cta = content.ctaText ? String(content.ctaText) : null;
  const ctaUrl = content.ctaUrl ? String(content.ctaUrl) : '#';
  return React.createElement('section', {
    className: 'py-24 px-4 bg-gradient-to-r from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-to))] text-white'
  },
    React.createElement('div', { className: 'max-w-3xl mx-auto text-center' },
      React.createElement('h2', { className: 'text-3xl md:text-4xl font-bold mb-4' }, String(content.headline || '')),
      React.createElement('p', { className: 'text-xl opacity-90 mb-8' }, String(content.subheadline || '')),
      cta && React.createElement('a', {
        href: ctaUrl,
        className: 'inline-block bg-white text-[hsl(var(--brand-primary))] px-10 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors'
      }, cta)
    )
  );
}

// ── Contact ───────────────────────────────────────────────────────────────

function ContactSection({ content }: { content: Record<string, unknown> }) {
  const email = content.email ? String(content.email) : null;
  const phone = content.phone ? String(content.phone) : null;
  const location = content.location ? String(content.location) : null;
  return React.createElement('section', { className: 'py-20 px-4' },
    React.createElement('div', { className: 'max-w-4xl mx-auto' },
      React.createElement('h2', { className: 'text-3xl font-bold text-center mb-12' }, String(content.headline || 'Contacto')),
      React.createElement('div', { className: 'grid md:grid-cols-3 gap-8 mb-12' },
        email && React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'w-12 h-12 bg-[hsl(var(--brand-primary-light))] rounded-full flex items-center justify-center mx-auto mb-4' },
            React.createElement('span', { className: 'text-[hsl(var(--brand-primary))] text-xl' }, '✉')
          ),
          React.createElement('p', { className: 'text-gray-600' }, email)
        ),
        phone && React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'w-12 h-12 bg-[hsl(var(--brand-primary-light))] rounded-full flex items-center justify-center mx-auto mb-4' },
            React.createElement('span', { className: 'text-[hsl(var(--brand-primary))] text-xl' }, '📞')
          ),
          React.createElement('p', { className: 'text-gray-600' }, phone)
        ),
        location && React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'w-12 h-12 bg-[hsl(var(--brand-primary-light))] rounded-full flex items-center justify-center mx-auto mb-4' },
            React.createElement('span', { className: 'text-[hsl(var(--brand-primary))] text-xl' }, '📍')
          ),
          React.createElement('p', { className: 'text-gray-600' }, location)
        )
      )
    )
  );
}

// ── Section renderer ──────────────────────────────────────────────────────

export function renderSections(sections: SectionConfig[]): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  const visible = sections.filter(s => s.visible).sort((a, b) => a.order - b.order);

  for (let i = 0; i < visible.length; i++) {
    const section = visible[i];
    const key = `${section.type}-${i}`;

    switch (section.type) {
      case 'hero':
        result.push(React.createElement(HeroSection, { key, content: section.content }));
        break;
      case 'benefits':
      case 'programs_featured':
      case 'methodology':
        result.push(React.createElement(BenefitsSection, { key, content: section.content }));
        break;
      case 'teacher_summary':
        result.push(React.createElement(TeacherSummarySection, { key, content: section.content }));
        break;
      case 'testimonials':
        result.push(React.createElement(TestimonialsSection, { key, content: section.content }));
        break;
      case 'faq':
        result.push(React.createElement(FaqSection, { key, content: section.content }));
        break;
      case 'cta':
      case 'newsletter':
        result.push(React.createElement(CtaSection, { key, content: section.content }));
        break;
      case 'contact':
        result.push(React.createElement(ContactSection, { key, content: section.content }));
        break;
      case 'cohorts_upcoming':
        result.push(React.createElement(BenefitsSection, { key, content: section.content }));
        break;
    }
  }

  return result;
}
