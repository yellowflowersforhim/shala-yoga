
import { Metadata } from 'next';
import ConversionFunnel from '@/components/admin/conversion-funnel';

export const metadata: Metadata = {
  title: 'Análisis de Conversiones - Admin',
  description: 'Análisis detallado del embudo de conversión',
};

export default function ConversionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Análisis de Conversiones</h1>
        <p className="text-gray-600">
          Analiza el comportamiento de los visitantes y optimiza tu embudo de ventas
        </p>
      </div>

      <ConversionFunnel />
    </div>
  );
}
