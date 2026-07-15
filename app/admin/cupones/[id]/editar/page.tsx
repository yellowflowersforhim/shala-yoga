
import { Metadata } from 'next';
import CouponForm from '@/components/admin/coupon-form';

export const metadata: Metadata = {
  title: 'Editar Cupón - Admin',
  description: 'Editar cupón de descuento'
};

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Editar Cupón</h1>
      <CouponForm couponId={id} />
    </div>
  );
}
