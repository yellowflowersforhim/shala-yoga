
'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

interface CouponFormProps {
  couponId?: string;
}

export default function CouponForm({ couponId }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    minPurchaseCents: '',
    isActive: true
  });

  const fetchCoupon = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`);
      const data = await response.json();
      
      if (response.ok && data.coupon) {
        const coupon = data.coupon;
        setFormData({
          code: coupon.code,
          description: coupon.description || '',
          discountType: coupon.discountType,
          discountValue: coupon.discountValue.toString(),
          maxUses: coupon.maxUses?.toString() || '',
          validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
          validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : '',
          minPurchaseCents: coupon.minPurchaseCents ? (coupon.minPurchaseCents / 100).toString() : '',
          isActive: coupon.isActive
        });
      }
    } catch (error) {
      console.error('Error al cargar cupón:', error);
      toast.error('Error al cargar el cupón');
    }
  }, [couponId]);

  useEffect(() => {
    if (couponId) {
      void fetchCoupon();
    }
  }, [couponId, fetchCoupon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        discountType: formData.discountType,
        discountValue: formData.discountType === 'percentage'
          ? parseInt(formData.discountValue)
          : Math.round(parseFloat(formData.discountValue) * 100),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
        minPurchaseCents: formData.minPurchaseCents
          ? Math.round(parseFloat(formData.minPurchaseCents) * 100)
          : null,
        isActive: formData.isActive
      };

      const url = couponId
        ? `/api/admin/coupons/${couponId}`
        : '/api/admin/coupons';
      
      const method = couponId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(couponId ? 'Cupón actualizado exitosamente' : 'Cupón creado exitosamente');
        router.push('/admin/cupones');
      } else {
        toast.error(data.error || 'Error al guardar el cupón');
      }
    } catch (error) {
      console.error('Error al guardar cupón:', error);
      toast.error('Error al guardar el cupón');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/cupones')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Cupones
      </Button>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código del cupón */}
          <div>
            <Label htmlFor="code">Código del Cupón *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="VERANO2025"
              required
              maxLength={50}
              className="font-mono"
            />
            <p className="text-sm text-gray-500 mt-1">
              El código que los usuarios ingresarán al hacer el checkout
            </p>
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descuento especial de verano para nuevos estudiantes"
              rows={3}
            />
          </div>

          {/* Tipo de descuento y valor */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountType">Tipo de Descuento *</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) => setFormData({ ...formData, discountType: value, discountValue: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                  <SelectItem value="fixed">Cantidad Fija (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="discountValue">
                Valor del Descuento * {formData.discountType === 'percentage' ? '(%)' : '(€)'}
              </Label>
              <Input
                id="discountValue"
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder={formData.discountType === 'percentage' ? '20' : '10.00'}
                required
                min="0"
                max={formData.discountType === 'percentage' ? '100' : undefined}
                step={formData.discountType === 'fixed' ? '0.01' : '1'}
              />
            </div>
          </div>

          {/* Fechas de validez */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Válido Desde</Label>
              <Input
                id="validFrom"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="validUntil">Válido Hasta</Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>

          {/* Límites */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxUses">Número Máximo de Usos</Label>
              <Input
                id="maxUses"
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                placeholder="Ilimitado"
                min="1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Deja vacío para usos ilimitados
              </p>
            </div>

            <div>
              <Label htmlFor="minPurchaseCents">Compra Mínima (€)</Label>
              <Input
                id="minPurchaseCents"
                type="number"
                value={formData.minPurchaseCents}
                onChange={(e) => setFormData({ ...formData, minPurchaseCents: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <p className="text-sm text-gray-500 mt-1">
                Monto mínimo de compra para usar el cupón
              </p>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-base">Cupón Activo</Label>
              <p className="text-sm text-gray-500">
                Los cupones inactivos no se pueden usar
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/cupones')}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]"
            >
              {loading ? 'Guardando...' : couponId ? 'Actualizar Cupón' : 'Crear Cupón'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
