
'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

export function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);

  useEffect(() => {
    fetch(`/api/admin/dashboard/revenue-chart?months=${months}`)
      .then((res) => res.json())
      .then((chartData) => {
        setData(chartData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching revenue chart:', error);
        setLoading(false);
      });
  }, [months]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Ingresos por Mes
        </h3>
        <select
          value={months}
          onChange={(e) => setMonths(parseInt(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="6">Últimos 6 meses</option>
          <option value="12">Últimos 12 meses</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [`€${value.toFixed(2)}`, 'Ingresos']}
          />
          <Legend />
          <Bar dataKey="revenue" fill="#ea580c" name="Ingresos (€)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
