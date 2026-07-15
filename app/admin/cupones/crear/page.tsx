
import { Metadata } from 'next';
import CouponForm from '@/components/admin/coupon-form';

export const metadata: Metadata = {
  title: 'Crear Cupón - Admin',
  description: 'Crear nuevo cupón de descuento'
};

export default function CreateCouponPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Crear Cupón</h1>
      <CouponForm />
    </div>
  );
}
