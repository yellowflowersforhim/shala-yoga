
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/checkout/status?sessionId=${encodeURIComponent(sessionId)}`);
        const data = await response.json();
        setIsVerified(response.ok && data.paid === true);
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void verifyPayment();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--brand-primary))] mx-auto"></div>
          <p className="mt-4 text-gray-600">Procesando tu pago...</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))] px-4">
        <Card className="max-w-xl w-full">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No pudimos verificar el pago</h1>
            <p className="text-gray-600 mb-6">
              Si acabas de pagar, espera unos instantes y recarga esta página. No se ha mostrado una confirmación sin validar el pago con Stripe.
            </p>
            <Link href="/intensivos"><Button variant="outline">Volver a intensivos</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))] px-4 py-12">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 md:p-12">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¡Pago Confirmado!
            </h1>

            {/* Message */}
            <p className="text-lg text-gray-600 mb-6">
              Tu inscripción ha sido procesada exitosamente. 
            </p>

            {/* Email Notice */}
            <div className="bg-[hsl(var(--brand-primary-light))] border border-[hsl(var(--brand-primary-light))] rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <Mail className="h-6 w-6 text-[hsl(var(--brand-primary))] mr-3 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Revisa tu correo electrónico
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Te hemos enviado un email de confirmación con toda la información del intensivo
                    y un enlace a un formulario que debes completar antes del inicio del curso.
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
              <p className="text-sm text-blue-900">
                <strong>Importante:</strong> Por favor, completa el formulario de registro lo antes posible. 
                Si no recibes el email en los próximos minutos, revisa tu carpeta de spam.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/intensivos">
                <Button 
                  className="w-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] hover:from-[hsl(var(--brand-primary-dark))] hover:to-[hsl(var(--brand-primary-dark))]"
                >
                  Ver más intensivos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Volver al inicio
                </Button>
              </Link>
            </div>

            {/* Support Info */}
            <p className="text-sm text-gray-500 mt-8">
              ¿Tienes preguntas? Contáctanos en{' '}
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

export default function CheckoutSuccessPage() {
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
      <CheckoutSuccessContent />
    </Suspense>
  );
}
