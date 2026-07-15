import Link from 'next/link';
import { Heart } from 'lucide-react';
import NewsletterForm from './newsletter-form';

/**
 * Tenant-configurable footer.
 * Content comes from tenant site settings. Falls back to neutral "Shala" branding.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[hsl(var(--brand-primary-light))] border-t border-[hsl(var(--brand-primary-light))] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-to))] bg-clip-text text-transparent mb-4">
              Shala
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Transformando vidas a través de la práctica ancestral del yoga
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/programas" className="text-gray-600 hover:text-[hsl(var(--brand-primary))] transition-colors">
                  Programas
                </Link>
              </li>
              <li>
                <Link href="/sobre-mi" className="text-gray-600 hover:text-[hsl(var(--brand-primary))] transition-colors">
                  Sobre Mí
                </Link>
              </li>
              <li>
                <Link href="/metodologia" className="text-gray-600 hover:text-[hsl(var(--brand-primary))] transition-colors">
                  Metodología
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contacto" className="text-gray-600 hover:text-[hsl(var(--brand-primary))] transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Newsletter</h4>
            <p className="text-gray-600 text-sm mb-4">
              Recibe novedades sobre programas, eventos y contenido exclusivo
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div className="flex items-center mb-4 md:mb-0">
              <span>© {currentYear} Shala. Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center">
              <span>Hecho con</span>
              <Heart className="h-4 w-4 mx-1 text-red-500 fill-current" />
              <span>para profesores de yoga</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
