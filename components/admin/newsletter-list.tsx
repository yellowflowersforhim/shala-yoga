
'use client';

import { useCallback, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mail, Trash2, Search, Download, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { csvCell } from '@/lib/csv';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

export default function NewsletterList() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (searchTerm) {
      const filtered = subscribers.filter(
        (sub) =>
          sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubscribers(filtered);
    } else {
      setFilteredSubscribers(subscribers);
    }
  }, [searchTerm, subscribers]);

  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/newsletter');
      const data = await response.json();
      setSubscribers(data.subscribers || []);
      setFilteredSubscribers(data.subscribers || []);
      setStats(data.stats || { total: 0, active: 0, inactive: 0 });
    } catch (error) {
      console.error('Error al cargar suscriptores:', error);
      toast.error('Error al cargar los suscriptores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubscribers();
  }, [fetchSubscribers]);

  const handleDelete = async (email: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${email}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/newsletter?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Suscriptor eliminado exitosamente');
        fetchSubscribers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al eliminar el suscriptor');
      }
    } catch (error) {
      console.error('Error al eliminar suscriptor:', error);
      toast.error('Error al eliminar el suscriptor');
    }
  };

  const handleExport = () => {
    const activeSubscribers = subscribers.filter(s => s.isActive);
    const csv = [
      ['Email', 'Nombre', 'Fecha de Suscripción'].map(csvCell).join(','),
      ...activeSubscribers.map(sub => [
        sub.email,
        sub.name || '',
        new Date(sub.subscribedAt).toLocaleDateString('es-ES')
      ].map(csvCell).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Lista exportada exitosamente');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--brand-primary))]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Newsletter</h1>
        <p className="text-gray-600 mt-2">
          Gestión de suscriptores del newsletter
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Suscriptores</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-[hsl(var(--brand-primary))] opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Mail className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-3xl font-bold text-gray-400">{stats.inactive}</p>
            </div>
            <Mail className="w-12 h-12 text-gray-400 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Barra de búsqueda y exportar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          disabled={stats.active === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Lista de suscriptores */}
      {filteredSubscribers.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchTerm ? 'No se encontraron resultados' : 'No hay suscriptores'}
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Intenta con otro término de búsqueda'
              : 'Los suscriptores aparecerán aquí cuando se registren'}
          </p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredSubscribers.map((subscriber) => (
              <div
                key={subscriber.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium">{subscriber.email}</p>
                    {subscriber.isActive ? (
                      <Badge className="bg-green-100 text-green-700">Activo</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">Inactivo</Badge>
                    )}
                  </div>
                  {subscriber.name && (
                    <p className="text-sm text-gray-600">{subscriber.name}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Suscrito: {formatDate(subscriber.subscribedAt)}
                    {subscriber.unsubscribedAt && (
                      <> • Desuscrito: {formatDate(subscriber.unsubscribedAt)}</>
                    )}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(subscriber.email)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
