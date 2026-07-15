
import { Metadata } from 'next';
import EmailCampaignForm from '@/components/admin/email-campaign-form';

export const metadata: Metadata = {
  title: 'Nueva Campaña de Email - Admin',
  description: 'Crea una nueva campaña de email masiva',
};

export default function CreateEmailCampaignPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Nueva Campaña de Email</h1>
        <p className="text-gray-600">
          Crea una campaña para comunicarte con tus estudiantes y suscriptores
        </p>
      </div>

      <EmailCampaignForm />
    </div>
  );
}
