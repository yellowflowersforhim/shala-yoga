
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const generateReport = async (format: 'json' | 'csv') => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        type: reportType,
        format,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/admin/reports?${params}`);

      if (!response.ok) throw new Error('Error al generar reporte');

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Reporte CSV descargado correctamente');
      } else {
        const data = await response.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Reporte JSON descargado correctamente');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Generar Reporte</h3>

      <div className="space-y-4">
        <div>
          <Label htmlFor="reportType">Tipo de Reporte</Label>
          <select
            id="reportType"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
          >
            <option value="summary">Resumen General</option>
            <option value="students">Estudiantes</option>
            <option value="revenue">Ingresos</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Fecha Inicio</Label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            />
          </div>

          <div>
            <Label htmlFor="endDate">Fecha Fin</Label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            onClick={() => generateReport('csv')}
            disabled={loading}
            className="flex-1"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Descargar CSV
          </Button>

          <Button
            onClick={() => generateReport('json')}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Descargar JSON
          </Button>
        </div>

        {loading && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Generando reporte...
          </div>
        )}
      </div>
    </Card>
  );
}
