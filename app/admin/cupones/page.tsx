
import { Metadata } from 'next';
import CouponsList from '@/components/admin/coupons-list';

export const metadata: Metadata = {
  title: 'Gestión de Cupones - Admin',
  description: 'Administrar cupones de descuento'
};

export default function CouponsPage() {
  return <CouponsList />;
}
