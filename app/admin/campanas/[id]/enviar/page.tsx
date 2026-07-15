
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, Users, AlertCircle, CheckCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SendEmailCampaignPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fetchCampaign = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/email-campaigns/${params.id}`);
      const data = await response.json();
      setCampaign(data);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Error al cargar la campaña');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void fetchCampaign();
  }, [fetchCampaign]);

  const handleSend = async () => {
    if (!confirm('¿Estás seguro de que quieres enviar esta campaña?')) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`/api/admin/email-campaigns/${params.id}/send`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar campaña');
      }

      setResult(data);
      toast.success('Campaña enviada correctamente');
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast.error(error.message || 'Error al enviar la campaña');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--brand-primary))] border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-600 mt-4">Cargando campaña...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Campaña no encontrada</h1>
      </div>
    );
  }

  if (campaign.status === 'sent') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Esta campaña ya fue enviada</h1>
        <Button onClick={() => router.push('/admin/campanas')}>
          Volver a Campañas
        </Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">¡Campaña enviada con éxito!</h1>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{result.totalRecipients}</p>
              <p className="text-sm text-gray-600">Total Destinatarios</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{result.sentCount}</p>
              <p className="text-sm text-gray-600">Enviados</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{result.failedCount}</p>
              <p className="text-sm text-gray-600">Fallidos</p>
            </div>
          </div>

          <Button onClick={() => router.push('/admin/campanas')}>
            Volver a Campañas
          </Button>
        </Card>
      </div>
    );
  }

  const getRecipientTypeLabel = (type: string) => {
    const labels: any = {
      all_students: 'Todos los estudiantes',
      active_students: 'Estudiantes activos',
      newsletter_subscribers: 'Suscriptores newsletter',
      custom: 'Personalizado',
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Enviar Campaña</h1>
        <p className="text-gray-600">Revisa los detalles antes de enviar</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Nombre de la Campaña</p>
            <p className="font-semibold text-lg">{campaign.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Asunto</p>
            <p className="font-semibold">{campaign.subject}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Destinatarios</p>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              <p>{getRecipientTypeLabel(campaign.recipientType)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Vista Previa del Contenido</p>
            <iframe
              title="Vista previa segura de la campaña"
              sandbox=""
              srcDoc={campaign.content}
              className="w-full min-h-64 bg-white rounded-lg border border-gray-200"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 mb-1">Importante</p>
            <p className="text-sm text-yellow-700">
              Una vez enviada la campaña, no podrás cancelarla ni modificarla. Asegúrate de
              revisar todos los detalles antes de continuar.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={sending}
        >
          Cancelar
        </Button>
        <Button onClick={handleSend} disabled={sending}>
          {sending ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar Campaña
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
