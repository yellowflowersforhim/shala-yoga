
'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import Link from 'next/link';

interface UpcomingCohort {
  id: string;
  name: string;
  programTitle: string;
  startDate: string;
  endDate: string;
  enrolled: number;
  maxSeats: number;
}

interface StatsResponse {
  upcomingCohorts: UpcomingCohort[];
}

export function UpcomingCohorts() {
  const [cohorts, setCohorts] = useState<UpcomingCohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard/stats')
      .then((res) => res.json())
      .then((data: StatsResponse) => {
        setCohorts(data.upcomingCohorts || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching upcoming cohorts:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Próximos Intensivos
      </h3>
      {cohorts.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No hay intensivos programados
        </p>
      ) : (
        <div className="space-y-4">
          {cohorts.map((cohort) => {
            const fillPercentage = (cohort.enrolled / cohort.maxSeats) * 100;
            return (
              <Link
                key={cohort.id}
                href={`/admin/intensivos/${cohort.id}/editar`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-[hsl(var(--brand-primary-light))] hover:bg-[hsl(var(--brand-primary-light))] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {cohort.programTitle}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{cohort.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(cohort.startDate).toLocaleDateString('es-ES')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {cohort.enrolled}/{cohort.maxSeats}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        fillPercentage >= 100
                          ? 'bg-red-100 text-red-700'
                          : fillPercentage >= 75
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {fillPercentage.toFixed(0)}% lleno
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
