import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { authOptions } from '@/lib/auth-options';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { getOnboardingProgress } from '@/lib/services/workspace';
import { CheckCircle, Circle } from 'lucide-react';

const STEPS: { id: string; title: string; desc: string; href: string }[] = [
  { id: 'create_profile', title: 'Completa tu perfil', desc: 'Añade tu nombre, biografía y foto', href: '/workspace/profile' },
  { id: 'add_program', title: 'Crea tu primer programa', desc: 'Define qué enseñas y a qué precio', href: '/admin/programas/crear' },
  { id: 'create_cohort', title: 'Abre un intensivo', desc: 'Programa fechas, horarios y plazas', href: '/admin/intensivos/crear' },
  { id: 'configure_brand', title: 'Personaliza tu marca', desc: 'Elige colores, logo y tipografía', href: '/workspace/brand' },
  { id: 'publish_site', title: 'Publica tu sitio web', desc: 'Activa tu página pública', href: '/workspace/brand' },
  { id: 'connect_stripe', title: 'Conecta Stripe', desc: 'Configura los cobros para tus programas', href: '/workspace/stripe' },
  { id: 'invite_team', title: 'Invita a tu equipo', desc: 'Añade colaboradores a tu espacio', href: '/workspace/team' },
];

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const tenant = await getTenantFromRequest(await headers());
  if (!tenant) return <div className="p-8">No se pudo identificar tu espacio de trabajo.</div>;

  const progress = await getOnboardingProgress(tenant).catch(() => ({ completed: [] as string[], pending: STEPS.map(s => s.id) }));
  const done = new Set(progress.completed);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Onboarding</h1>
      <p className="text-gray-500 mb-8">Completa estos pasos para lanzar tu espacio de enseñanza.</p>

      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              done.has(step.id)
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200 hover:border-[hsl(var(--brand-primary))] hover:shadow-sm'
            }`}
          >
            <div className="flex-shrink-0">
              {done.has(step.id)
                ? <CheckCircle className="h-6 w-6 text-green-600" />
                : <Circle className="h-6 w-6 text-gray-300" />}
            </div>
            <div>
              <span className="text-sm text-gray-400 font-mono mr-2">0{i + 1}</span>
              <span className="font-semibold text-gray-900">{step.title}</span>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {progress.completed.length === STEPS.length && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-green-800">¡Todo listo!</h2>
          <p className="text-green-700">Tu espacio está configurado. Visita tu sitio público.</p>
        </div>
      )}
    </div>
  );
}
