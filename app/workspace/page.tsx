import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { authOptions } from '@/lib/auth-options';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { getTeacherDashboard } from '@/lib/services/workspace';
import { BookOpen, Users, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default async function WorkspaceDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const tenant = await getTenantFromRequest(await headers());
  if (!tenant) return <div className="p-8"><p>No se pudo identificar tu espacio de trabajo.</p></div>;

  const stats = await getTeacherDashboard(tenant).catch(() => ({
    activePrograms: 0, upcomingCohorts: 0, totalStudents: 0, totalEnrollments: 0, revenueThisMonthCents: 0,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Programas activos" value={stats.activePrograms} />
        <StatCard icon={Calendar} label="Próximos intensivos" value={stats.upcomingCohorts} />
        <StatCard icon={Users} label="Estudiantes" value={stats.totalStudents} />
        <StatCard icon={DollarSign} label="Ingresos este mes" value={`€${(stats.revenueThisMonthCents / 100).toFixed(0)}`} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <QuickAction href="/admin/programas/crear" label="Nuevo programa" desc="Crear un programa de yoga" />
        <QuickAction href="/admin/intensivos/crear" label="Nuevo intensivo" desc="Abrir una nueva cohorte" />
        <QuickAction href="/workspace/team" label="Invitar equipo" desc="Añadir colaboradores" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function QuickAction({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="block bg-white border rounded-xl p-5 hover:border-[hsl(var(--brand-primary))] hover:shadow-sm transition-all">
      <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </Link>
  );
}
