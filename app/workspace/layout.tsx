import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { authOptions } from '@/lib/auth-options';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { LayoutDashboard, Users, Palette, UserCircle, CheckSquare, CreditCard, BookOpen, Calendar, GraduationCap } from 'lucide-react';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const tenant = await getTenantFromRequest(await headers());

  const navItems = [
    { href: '/workspace', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/workspace/onboarding', label: 'Onboarding', icon: CheckSquare },
    { href: '/workspace/programs', label: 'Programas', icon: BookOpen },
    { href: '/workspace/cohorts', label: 'Cohortes', icon: Calendar },
    { href: '/workspace/students', label: 'Alumnos', icon: GraduationCap },
    { href: '/workspace/team', label: 'Equipo', icon: Users },
    { href: '/workspace/brand', label: 'Marca', icon: Palette },
    { href: '/workspace/profile', label: 'Perfil', icon: UserCircle },
    { href: '/workspace/stripe', label: 'Pagos', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6 border-b">
            <Link href="/workspace" className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--brand-gradient-from))] to-[hsl(var(--brand-gradient-to))] bg-clip-text text-transparent">
              {tenant?.name || 'Mi Espacio'}
            </Link>
            {tenant && <p className="text-xs text-gray-400 mt-1">{tenant.slug}.shala.app</p>}
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-3 py-2 text-gray-700 hover:bg-[hsl(var(--brand-primary-light))] hover:text-[hsl(var(--brand-primary))] rounded-lg transition-colors text-sm"
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
