/**
 * Neutral brand primitives.
 *
 * These components use CSS custom properties (--brand-*) so they can be
 * themed per tenant without changing component code. Phase 3 will populate
 * these properties from tenant configuration.
 *
 * No Joan/Ahora/Barcelona content appears in these primitives.
 */

/**
 * SiteBrand renders the site name using the --brand-site-name CSS variable.
 * Falls back to a provided `fallback` prop.
 */
export function SiteBrand({
  fallback = 'Shala',
  className = '',
}: {
  fallback?: string;
  className?: string;
}) {
  return (
    <span
      className={`site-brand ${className}`}
      data-brand-name={fallback}
    >
      {fallback}
    </span>
  );
}

/**
 * Gradient brand text using --brand-gradient-from and --brand-gradient-to.
 */
export function BrandGradientText({
  children,
  className = '',
  as: Component = 'span',
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Component
      className={`bg-gradient-to-r from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-to))] bg-clip-text text-transparent ${className}`}
    >
      {children}
    </Component>
  );
}

/**
 * Brand colored background with gradient.
 */
export function BrandGradientBg({
  children,
  className = '',
  direction = 'br',
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'br' | 'r' | 'b';
}) {
  const dirMap = {
    br: `from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-to))]`,
    r: `from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-from)/0.8)]`,
    b: `from-[hsl(var(--brand-primary-light))] to-white`,
  };
  return (
    <div className={`bg-gradient-to-${direction} ${dirMap[direction]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Brand primary button using CSS custom properties.
 */
export function BrandButton({
  children,
  className = '',
  variant = 'solid',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'font-semibold transition-colors rounded-lg';
  const variants: Record<string, string> = {
    solid: `bg-[hsl(var(--brand-primary))] text-white hover:bg-[hsl(var(--brand-primary-dark))]`,
    outline: `border-2 border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-light))]`,
    ghost: `text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-light))]`,
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/**
 * Brand section background (light tint).
 */
export function BrandSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-[hsl(var(--brand-primary-light))] ${className}`}>
      {children}
    </section>
  );
}

/**
 * Brand card with accent border.
 */
export function BrandCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-[hsl(var(--brand-primary-light))] shadow-sm ${className}`}>
      {children}
    </div>
  );
}
