import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { authOptions } from '@/lib/auth-options';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { generateConnectOnboardingLink, getStripeAccountId } from '@/lib/stripe-connect';

export default async function StripePage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams;
  const callbackStatus = params.success ? 'success' : params.error ? 'error' : null;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const tenant = await getTenantFromRequest(await headers());
  if (!tenant) return <div className="p-8">No se pudo identificar tu espacio.</div>;

  const stripeAccountId = await getStripeAccountId(tenant.tenantId).catch(() => null);
  const connectLink = generateConnectOnboardingLink(tenant.tenantId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Conexión con Stripe</h1>

      {callbackStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800">✅ Stripe conectado correctamente.</div>
      )}
      {callbackStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">❌ Error al conectar con Stripe. Inténtalo de nuevo.</div>
      )}

      <div className="bg-white border rounded-xl p-6">
        {stripeAccountId ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <p className="text-green-800 font-semibold text-lg mb-2">✅ Stripe conectado</p>
            <p className="text-green-700 text-sm mb-1">Tu cuenta de Stripe está vinculada.</p>
            <p className="text-xs text-green-600 font-mono">{stripeAccountId}</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-6">
              Conecta tu cuenta de Stripe para recibir pagos por tus programas.
              Shala cobra una comisión del 10% sobre cada transacción.
            </p>
            <a
              href={connectLink}
              className="inline-block bg-[#635bff] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4f46e5] transition-colors"
            >
              Conectar con Stripe
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
