import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import Link from 'next/link';
import { BookOpen, Users, Calendar, ShoppingCart, LayoutDashboard, Tag, Mail, Send, Video, UserCircle, TrendingUp, FileText, MessageSquare } from 'lucide-react';

/**
 * Admin layout — neutral branding, CSS-token-powered.
 * Authorization: requires login. Role-specific access gating happens in API routes.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/estudiantes', label: 'Estudiantes', icon: UserCircle },
    { href: '/admin/programas', label: 'Programas', icon: BookOpen },
    { href: '/admin/intensivos', label: 'Intensivos', icon: Calendar },
    { href: '/admin/sesion-semanal', label: 'Sesión Semanal', icon: Video },
    { href: '/admin/inscripciones', label: 'Inscripciones', icon: Users },
    { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
    { href: '/admin/cupones', label: 'Cupones', icon: Tag },
    { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
    { href: '/admin/campanas', label: 'Campañas Email', icon: Send },
    { href: '/admin/conversiones', label: 'Conversiones', icon: TrendingUp },
    { href: '/admin/reportes', label: 'Reportes', icon: FileText },
    { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-to))] bg-clip-text text-transparent">
              Administración
            </h2>
          </div>
          <nav className="px-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-3 py-2 text-gray-700 hover:bg-[hsl(var(--brand-primary-light))] hover:text-[hsl(var(--brand-primary))] rounded-lg transition-colors"
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
