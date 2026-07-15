import { Metadata } from 'next';
import { headers } from 'next/headers';
import FeedbackForm from '@/components/feedback-form';
import { Card } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import { db } from '@/lib/db';
import { getTenantFromRequest } from '@/lib/api-helpers';

export const metadata: Metadata = {
  title: 'Feedback — Shala',
  description: 'Cuéntanos sobre tu experiencia con Classical Hatha Yoga',
};

// Forzar renderizado dinámico para evitar errores en build
export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  const headersList = await headers();
  const tenant = await getTenantFromRequest(headersList);

  const testimonials = await db.feedback.findMany({
    where: {
      isPublic: true,
      rating: { gte: 4 },
      ...(tenant ? { tenantId: tenant.tenantId } : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 6,
    select: {
      id: true,
      name: true,
      rating: true,
      message: true,
      createdAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--brand-primary-light))] to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tu Opinión es Importante
          </h1>
          <p className="text-xl text-[hsl(var(--brand-primary-light))] max-w-2xl mx-auto">
            Comparte tu experiencia con Classical Hatha Yoga y ayuda a otros a descubrir
            esta práctica transformadora
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Feedback Form */}
          <div>
            <FeedbackForm />
          </div>

          {/* Testimonials */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Lo que Dicen Nuestros Estudiantes
            </h2>

            {testimonials.length === 0 ? (
              <Card className="p-12 text-center">
                <Quote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  Sé el primero en compartir tu experiencia
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.id} className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">
                      "{testimonial.message}"
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}