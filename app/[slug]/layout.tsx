import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';

/**
 * Converts a hex color to HSL CSS string.
 */
function hexToHsl(hex: string): string {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) clean = clean.replace(/(.)/g, '$1$1');
  if (clean.length === 8) clean = clean.slice(0, 6);
  if (clean.length !== 6) return '174 72% 35%';
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
    case g: h = ((b - r) / d + 2) * 60; break;
    case b: h = ((r - g) / d + 4) * 60; break;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function lightenHsl(hsl: string, amount: number): string {
  const parts = hsl.split(' ');
  const h = parts[0], s = parts[1];
  const l = Math.min(100, parseInt(parts[2]) + amount);
  return `${h} ${s} ${l}%`;
}

function darkenHsl(hsl: string, amount: number): string {
  const parts = hsl.split(' ');
  const h = parts[0], s = parts[1];
  const l = Math.max(0, parseInt(parts[2]) - amount);
  return `${h} ${s} ${l}%`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug },
      include: { teacherProfile: true, siteSettings: true },
    });
    if (!tenant) return { title: 'Página no encontrada' };
    const name = tenant.teacherProfile?.displayName || tenant.name;
    const description =
      tenant.siteSettings?.siteDescription ||
      tenant.teacherProfile?.title ||
      `Clases de Hatha Yoga con ${name}`;
    return {
      title: `${name} — Shala`,
      description,
      openGraph: {
        title: `${name} — Shala`,
        description,
        ...(tenant.teacherProfile?.portraitUrl && {
          images: [{ url: tenant.teacherProfile.portraitUrl }],
        }),
      },
    };
  } catch {
    return { title: 'Shala — Hatha Yoga' };
  }
}

export default async function TeacherPublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let brandVars: Record<string, string> = {};

  try {
    const tenant = await db.tenant.findUnique({
      where: { slug },
      include: { brandTheme: true },
    });
    if (!tenant) notFound();

    if (tenant.brandTheme) {
      const primary = hexToHsl(tenant.brandTheme.primaryColor);
      const secondary = hexToHsl(tenant.brandTheme.secondaryColor);
      const accent = hexToHsl(tenant.brandTheme.accentColor);
      brandVars = {
        '--brand-primary': primary,
        '--brand-primary-light': lightenHsl(primary, 40),
        '--brand-primary-dark': darkenHsl(primary, 20),
        '--brand-gradient-from': primary,
        '--brand-gradient-to': darkenHsl(primary, 10),
        '--brand-accent': accent,
        '--brand-secondary': secondary,
        '--brand-radius':
          tenant.brandTheme.borderRadius === 'pill'
            ? '9999px'
            : tenant.brandTheme.borderRadius === 'square'
              ? '0px'
              : '0.5rem',
        '--brand-button-radius':
          tenant.brandTheme.buttonStyle === 'pill'
            ? '9999px'
            : tenant.brandTheme.buttonStyle === 'square'
              ? '0px'
              : '0.5rem',
        '--heading-font': tenant.brandTheme.headingFont,
        '--body-font': tenant.brandTheme.bodyFont,
      };
    } else {
      brandVars = {
        '--brand-primary': '174 72% 35%',
        '--brand-primary-light': '174 72% 85%',
        '--brand-primary-dark': '174 72% 20%',
        '--brand-gradient-from': '174 72% 35%',
        '--brand-gradient-to': '174 72% 25%',
        '--brand-accent': '38 92% 50%',
        '--brand-secondary': '172 76% 40%',
        '--brand-radius': '0.5rem',
        '--brand-button-radius': '0.5rem',
        '--heading-font': 'inter',
        '--body-font': 'inter',
      };
    }
    // Override root shadcn CSS variables with brand values
    brandVars['--primary'] = brandVars['--brand-primary']!;
    brandVars['--primary-foreground'] = '0 0% 100%';
    brandVars['--secondary'] = brandVars['--brand-primary-light']!;
    brandVars['--secondary-foreground'] = brandVars['--brand-primary-dark']!;
    brandVars['--radius'] = brandVars['--brand-radius']!;
  } catch {
    notFound();
  }

  const styleStr = Object.entries(brandVars)
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n');
  return (
    <div style={{ fontFamily: 'var(--body-font, Inter), system-ui, sans-serif' }}>
      <style>{`:root {\n${styleStr}\n}`}</style>
      {children}
    </div>
  );
}
