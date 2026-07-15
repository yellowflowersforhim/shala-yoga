
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, ShoppingCart, CreditCard, Eye } from 'lucide-react';

interface ConversionData {
  funnel: {
    landing: number;
    view_cohort: number;
    start_checkout: number;
    complete_payment: number;
  };
  rates: {
    landingToView: number;
    viewToCheckout: number;
    checkoutToPayment: number;
    overallConversion: number;
  };
  topCohorts: Array<{
    cohortId: string;
    cohortName: string;
    conversions: number;
  }>;
}

export default function ConversionFunnel() {
  const [data, setData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/conversions?days=${days}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching conversion data:', error);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  const funnelSteps = [
    {
      label: 'Visitantes',
      value: data.funnel.landing,
      icon: Eye,
      color: 'bg-blue-500',
      rate: 100,
    },
    {
      label: 'Vieron Intensivos',
      value: data.funnel.view_cohort,
      icon: Users,
      color: 'bg-indigo-500',
      rate: data.rates.landingToView,
    },
    {
      label: 'Iniciaron Checkout',
      value: data.funnel.start_checkout,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      rate: data.rates.viewToCheckout,
    },
    {
      label: 'Completaron Pago',
      value: data.funnel.complete_payment,
      icon: CreditCard,
      color: 'bg-green-500',
      rate: data.rates.checkoutToPayment,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Embudo de Conversión</h3>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
        </select>
      </div>

      {/* Overall Conversion Rate */}
      <Card className="p-6 bg-gradient-to-r from-[hsl(var(--brand-primary-light))] to-[hsl(var(--brand-primary-light))] border-[hsl(var(--brand-primary-light))]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Tasa de Conversión Global</p>
            <p className="text-3xl font-bold text-[hsl(var(--brand-primary-dark))]">
              {data.rates.overallConversion.toFixed(2)}%
            </p>
          </div>
          <TrendingUp className="h-10 w-10 text-[hsl(var(--brand-primary))]" />
        </div>
      </Card>

      {/* Funnel Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {funnelSteps.map((step, index) => {
          const Icon = step.icon;
          const percentage = (step.value / data.funnel.landing) * 100;

          return (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`${step.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {index > 0 && (
                  <div className="flex items-center text-sm">
                    {step.rate >= 50 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={step.rate >= 50 ? 'text-green-600' : 'text-red-600'}>
                      {step.rate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              <p className="text-2xl font-bold mb-1">{step.value.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mb-2">{step.label}</p>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${step.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Top Converting Cohorts */}
      {data.topCohorts.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Top Intensivos por Conversión</h4>
          <div className="space-y-3">
            {data.topCohorts.map((cohort, index) => (
              <div key={cohort.cohortId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--brand-primary-light))] text-[hsl(var(--brand-primary-dark))] font-semibold text-sm">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{cohort.cohortName}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {cohort.conversions} conversiones
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
