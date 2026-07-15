'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function CheckoutCancelContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))] px-4 py-12">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 md:p-12">
          <div className="text-center">
            {/* Cancel Icon */}
            <div className="mb-6 flex justify-center">
              <div className="bg-amber-100 rounded-full p-4">
                <XCircle className="h-16 w-16 text-amber-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pago Cancelado
            </h1>

            {/* Message */}
            <p className="text-lg text-gray-600 mb-6">
              El proceso de pago fue cancelado antes de completarse.
            </p>

            {/* Reassurance */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <div className="text-left w-full">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    No se ha realizado ningún cargo
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Tu tarjeta no ha sido cargada y no se ha procesado ningún pago.
                    Si cambiaste de opinión, puedes intentarlo de nuevo cuando quieras.
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
              <p className="text-sm text-blue-900">
                <strong>¿Tuviste algún problema?</strong> Si experimentaste dificultades
                durante el proceso de pago, no dudes en contactarnos. Estaremos encantados de ayudarte.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/intensivos">
                <Button
                  className="w-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] hover:from-[hsl(var(--brand-primary-dark))] hover:to-[hsl(var(--brand-primary-dark))]"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Ver programas disponibles
                </Button>
              </Link>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Button>
              </Link>
            </div>

            {/* Support Info */}
            <p className="text-sm text-gray-500 mt-8">
              ¿Necesitas ayuda? Contáctanos en{' '}
              <a href="/contacto" className="text-[hsl(var(--brand-primary))] hover:underline">
                nuestra página de contacto
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--brand-primary))] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <CheckoutCancelContent />
    </Suspense>
  );
}
