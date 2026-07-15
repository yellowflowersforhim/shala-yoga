
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  minPurchaseCents: number | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    orders: number;
  };
}

export default function CouponsList() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons');
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error al cargar cupones:', error);
      toast.error('Error al cargar los cupones');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`¿Estás seguro de eliminar el cupón "${code}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Cupón eliminado exitosamente');
        fetchCoupons();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al eliminar el cupón');
      }
    } catch (error) {
      console.error('Error al eliminar cupón:', error);
      toast.error('Error al eliminar el cupón');
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    } else {
      return `€${(coupon.discountValue / 100).toFixed(2)}`;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin límite';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cupones de Descuento</h1>
          <p className="text-gray-600 mt-2">
            Total: {coupons.length} cupones • Activos: {coupons.filter(c => c.isActive).length}
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/cupones/crear')}
          className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Cupón
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay cupones</h3>
          <p className="text-gray-600 mb-6">
            Crea tu primer cupón de descuento para ofrecer promociones
          </p>
          <Button
            onClick={() => router.push('/admin/cupones/crear')}
            className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Cupón
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-xl font-bold bg-[hsl(var(--brand-primary-light))] text-[hsl(var(--brand-primary-dark))] px-3 py-1 rounded">
                      {coupon.code}
                    </code>
                    {coupon.isActive ? (
                      <Badge className="bg-green-100 text-green-700">Activo</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">Inactivo</Badge>
                    )}
                    <Badge className="bg-blue-100 text-blue-700">
                      {formatDiscount(coupon)}
                    </Badge>
                  </div>

                  {coupon.description && (
                    <p className="text-gray-600 mb-3">{coupon.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Usos:</span>
                      <p className="font-semibold">
                        {coupon._count.orders} / {coupon.maxUses || '∞'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Válido desde:</span>
                      <p className="font-semibold">{formatDate(coupon.validFrom)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Válido hasta:</span>
                      <p className="font-semibold">{formatDate(coupon.validUntil)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Compra mínima:</span>
                      <p className="font-semibold">
                        {coupon.minPurchaseCents
                          ? `€${(coupon.minPurchaseCents / 100).toFixed(2)}`
                          : 'Sin mínimo'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/cupones/${coupon.id}/editar`)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(coupon.id, coupon.code)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
