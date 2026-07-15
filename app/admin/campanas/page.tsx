
import { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Mail, Calendar, Users, Send, CheckCircle, XCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata: Metadata = {
  title: 'Campañas de Email - Admin',
  description: 'Gestiona tus campañas de email masivas',
};

export default async function EmailCampaignsPage() {
  const tenant = await getTenantFromRequest(await headers());
  const campaigns = await prisma.emailCampaign.findMany({
    where: withTenant({}, tenant),
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      admin: {
        select: {
          name: true,
        },
      },
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      sending: 'bg-blue-100 text-blue-700',
      sent: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };

    const labels = {
      draft: 'Borrador',
      sending: 'Enviando',
      sent: 'Enviada',
      failed: 'Error',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${(styles as any)[status]}`}>
        {(labels as any)[status]}
      </span>
    );
  };

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campañas de Email</h1>
          <p className="text-gray-600">
            Envía emails masivos a tus estudiantes y suscriptores
          </p>
        </div>
        <Link href="/admin/campanas/crear">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Campaña
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay campañas</h3>
          <p className="text-gray-600 mb-6">
            Crea tu primera campaña de email para comunicarte con tus estudiantes
          </p>
          <Link href="/admin/campanas/crear">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Campaña
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    {getStatusBadge(campaign.status)}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{campaign.subject}</p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {getRecipientTypeLabel(campaign.recipientType)}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDistanceToNow(new Date(campaign.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                    {campaign.status === 'sent' && (
                      <>
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {campaign.sentCount} enviados
                        </div>
                        {Number(campaign.failedCount) > 0 && (
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-2" />
                            {campaign.failedCount} fallidos
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {campaign.status === 'draft' && (
                    <>
                      <Link href={`/admin/campanas/${campaign.id}/editar`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Link href={`/admin/campanas/${campaign.id}/enviar`}>
                        <Button size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Enviar
                        </Button>
                      </Link>
                    </>
                  )}
                  {campaign.status === 'sent' && (
                    <Link href={`/admin/campanas/${campaign.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
