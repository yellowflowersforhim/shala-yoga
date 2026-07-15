
import { Metadata } from 'next';
import ReportGenerator from '@/components/admin/report-generator';

export const metadata: Metadata = {
  title: 'Reportes - Admin',
  description: 'Genera reportes descargables de tu negocio',
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reportes</h1>
        <p className="text-gray-600">
          Genera reportes detallados en formato CSV o JSON para análisis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportGenerator />

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Reporte de Resumen General
            </h3>
            <p className="text-sm text-blue-700">
              Incluye métricas clave como total de estudiantes, inscripciones activas,
              pedidos e ingresos totales.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">Reporte de Estudiantes</h3>
            <p className="text-sm text-green-700">
              Lista detallada de todos los estudiantes con sus inscripciones y programas
              completados.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-2">Reporte de Ingresos</h3>
            <p className="text-sm text-purple-700">
              Análisis completo de todos los pedidos con detalles de estudiantes,
              programas y montos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
