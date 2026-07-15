
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface EmailCampaignFormProps {
  campaign?: any;
}

export default function EmailCampaignForm({ campaign }: EmailCampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    subject: campaign?.subject || '',
    content: campaign?.content || '',
    recipientType: campaign?.recipientType || 'all_students',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = campaign
        ? `/api/admin/email-campaigns/${campaign.id}`
        : '/api/admin/email-campaigns';
      
      const method = campaign ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al guardar la campaña');

      toast.success(
        campaign ? 'Campaña actualizada correctamente' : 'Campaña creada correctamente'
      );
      router.push('/admin/campanas');
      router.refresh();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Error al guardar la campaña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Nombre de la Campaña *</Label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="Ej: Newsletter Febrero 2024"
          />
        </div>

        <div>
          <Label htmlFor="subject">Asunto del Email *</Label>
          <input
            id="subject"
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="Ej: Nuevos intensivos disponibles"
          />
        </div>

        <div>
          <Label htmlFor="recipientType">Destinatarios *</Label>
          <select
            id="recipientType"
            value={formData.recipientType}
            onChange={(e) =>
              setFormData({ ...formData, recipientType: e.target.value })
            }
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
          >
            <option value="all_students">Todos los estudiantes</option>
            <option value="active_students">Estudiantes activos</option>
            <option value="newsletter_subscribers">Suscriptores newsletter</option>
          </select>
        </div>

        <div>
          <Label htmlFor="content">Contenido del Email *</Label>
          <textarea
            id="content"
            required
            rows={12}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="Escribe el contenido del email en HTML..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Puedes usar HTML para formatear el email
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : campaign ? 'Actualizar' : 'Crear Campaña'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
