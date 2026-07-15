import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import Link from 'next/link';

/**
 * Shala platform admin console.
 * For Shala operators (SUPER_ADMIN/SUPPORT) to manage tenants, view platform
 * metrics, and handle support operations.
 *
 * Access: authenticated users with PlatformMembership role.
 * In pre-migration mode, global isAdmin can access.
 */
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shala — Panel de Administración</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <QuickCard title="Dashboard" desc="Estadísticas y métricas" href="/admin/dashboard" />
        <QuickCard title="Programas" desc="Gestionar programas de yoga" href="/admin/programas" />
        <QuickCard title="Estudiantes" desc="Ver y gestionar estudiantes" href="/admin/estudiantes" />
        <QuickCard title="Intensivos" desc="Gestionar cohortes" href="/admin/intensivos" />
        <QuickCard title="Pedidos" desc="Ver pedidos y pagos" href="/admin/pedidos" />
        <QuickCard title="Cupones" desc="Gestionar descuentos" href="/admin/cupones" />
        <QuickCard title="Newsletter" desc="Suscriptores del newsletter" href="/admin/newsletter" />
        <QuickCard title="Campañas" desc="Campañas de email" href="/admin/campanas" />
        <QuickCard title="Reportes" desc="Informes y análisis" href="/admin/reportes" />
      </div>

      <div className="bg-[hsl(var(--brand-primary-light))] border border-[hsl(var(--brand-primary-light))] rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-2">Plataforma Shala</h2>
        <p className="text-gray-600 mb-4">
          Panel de administración para gestionar tu espacio de enseñanza de Hatha Yoga.
          Gestiona programas, estudiantes, pagos y comunicaciones desde un solo lugar.
        </p>
        <div className="flex gap-4 text-sm text-gray-500">
          <Link href="/admin/sesion-semanal" className="hover:text-[hsl(var(--brand-primary))]">Sesión Semanal</Link>
          <Link href="/admin/emails" className="hover:text-[hsl(var(--brand-primary))]">Emails</Link>
          <Link href="/admin/feedback" className="hover:text-[hsl(var(--brand-primary))]">Feedback</Link>
          <Link href="/admin/conversiones" className="hover:text-[hsl(var(--brand-primary))]">Conversiones</Link>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-[hsl(var(--brand-primary))] hover:shadow-md transition-all"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </Link>
  );
}
