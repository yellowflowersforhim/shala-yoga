import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { headers } from 'next/headers';

import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { Star, MessageSquare, User, Calendar, Eye, EyeOff } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata: Metadata = {
  title: 'Feedback - Admin',
  description: 'Revisa el feedback de tus estudiantes',
};

export default async function FeedbackPage() {
  const tenant = await getTenantFromRequest(await headers());
  const feedback = await prisma.feedback.findMany({
    where: withTenant({}, tenant),
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      cohort: {
        select: {
          name: true,
          program: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  const averageRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : '0';

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: feedback.filter((f) => f.rating === rating).length,
    percentage: feedback.length > 0
      ? (feedback.filter((f) => f.rating === rating).length / feedback.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Feedback de Estudiantes</h1>
        <p className="text-gray-600">
          Revisa y gestiona el feedback recibido de tus estudiantes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Total Feedback</p>
            <MessageSquare className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
          </div>
          <p className="text-3xl font-bold">{feedback.length}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Calificación Promedio</p>
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          </div>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold">{averageRating}</p>
            <p className="text-gray-500 ml-2">/ 5.0</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Públicos</p>
            <Eye className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">
            {feedback.filter((f) => f.isPublic).length}
          </p>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Distribución de Calificaciones</h3>
        <div className="space-y-3">
          {ratingDistribution.map((item) => (
            <div key={item.rating} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-16">
                <span className="text-sm font-medium">{item.rating}</span>
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[hsl(var(--brand-primary))] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Feedback List */}
      {feedback.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay feedback todavía</h3>
          <p className="text-gray-600">
            Los estudiantes podrán dejar feedback al completar sus programas
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[hsl(var(--brand-primary-light))] flex items-center justify-center">
                      <User className="h-6 w-6 text-[hsl(var(--brand-primary))]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < item.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {item.isPublic ? (
                        <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <Eye className="h-3 w-3 mr-1" />
                          Público
                        </span>
                      ) : (
                        <span className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Privado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{item.email}</p>
                    {item.cohort && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.cohort.program.title} - {item.cohort.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(item.createdAt), "d 'de' MMMM, yyyy", {
                    locale: es,
                  })}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{item.message}</p>
              </div>

              <div className="mt-4 flex items-center space-x-2">
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                  {item.category}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
