
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EmailCampaignForm from '@/components/admin/email-campaign-form';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Editar Campaña - Admin',
  description: 'Edita una campaña de email',
};

export default async function EditEmailCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await db.emailCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    notFound();
  }

  if (campaign.status !== 'draft') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">No se puede editar</h1>
        <p className="text-gray-600">
          Solo se pueden editar campañas en estado de borrador
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Editar Campaña</h1>
        <p className="text-gray-600">Actualiza los detalles de tu campaña</p>
      </div>

      <EmailCampaignForm campaign={campaign} />
    </div>
  );
}
