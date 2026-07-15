
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, Clock, CreditCard, User, Mail, Phone, Tag, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { useToast } from '@/components/ui/use-toast';
import { formatPrice, formatDate } from '@/lib/format';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutClientProps {
  cohort: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    scheduleText: string;
    location: string;
    maxSeats: number;
    enrolledCount: number;
  };
  program: {
    title: string;
    durationWeeks: number;
    priceCents: number;
    currency: string;
  };
  userId: string | null;
}

interface CouponData {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  discountCents: number;
  finalAmountCents: number;
}

export default function CheckoutClient({ cohort, program, userId }: CheckoutClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un código de cupón',
        variant: 'destructive'
      });
      return;
    }

    setCouponLoading(true);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          purchaseAmountCents: program.priceCents
        })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        toast({
          title: '¡Cupón aplicado!',
          description: `Descuento de ${formatPrice(data.coupon.discountCents, program.currency)} aplicado`,
        });
      } else {
        toast({
          title: 'Cupón inválido',
          description: data.error || 'El cupón no pudo ser aplicado',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error al validar cupón:', error);
      toast({
        title: 'Error',
        description: 'Error al validar el cupón',
        variant: 'destructive'
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: 'Cupón removido',
      description: 'El cupón ha sido removido de tu pedido'
    });
  };

  const handleAuthenticatedCheckout = async () => {
    if (!userId) return;
    
    setIsProcessing(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortId: cohort.id,
          userId,
          couponCode: appliedCoupon?.code || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar el pago',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Validation
    if (!guestData.name.trim() || !guestData.email.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      });
      setIsProcessing(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestData.email)) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un email válido',
        variant: 'destructive'
      });
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch('/api/checkout/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortId: cohort.id,
          guestName: guestData.name.trim(),
          guestEmail: guestData.email.trim(),
          guestPhone: guestData.phone.trim(),
          couponCode: appliedCoupon?.code || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error) {
      console.error('Guest checkout error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar el pago',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  const availableSeats = cohort.maxSeats - cohort.enrolledCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirmar Inscripción</h1>
          <p className="text-gray-600">Revisa los detalles de tu programa antes de continuar</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Program Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl text-[hsl(var(--brand-primary-dark))]">{program.title}</CardTitle>
              <CardDescription>{cohort.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-700">
                  <Calendar className="h-5 w-5 mr-3 text-[hsl(var(--brand-primary))] flex-shrink-0" />
                  <div>
                    <p className="font-medium">Fechas</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="h-5 w-5 mr-3 text-[hsl(var(--brand-primary))] flex-shrink-0" />
                  <div>
                    <p className="font-medium">Horario</p>
                    <p className="text-sm text-gray-600">{cohort.scheduleText}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-5 w-5 mr-3 text-[hsl(var(--brand-primary))] flex-shrink-0" />
                  <div>
                    <p className="font-medium">Ubicación</p>
                    <p className="text-sm text-gray-600">{cohort.location}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <Users className="h-5 w-5 mr-3 text-[hsl(var(--brand-primary))] flex-shrink-0" />
                  <div>
                    <p className="font-medium">Plazas disponibles</p>
                    <p className="text-sm text-gray-600">
                      {availableSeats} de {cohort.maxSeats} plazas
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Checkout Options */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Información de Contacto</h3>
                {userId ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      ✓ Has iniciado sesión. Procede con el pago.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={handleGuestCheckout} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="Tu nombre completo"
                            value={guestData.name}
                            onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={guestData.email}
                            onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono (opcional)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+34 600 000 000"
                            value={guestData.phone}
                            onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        * Campos requeridos. Recibirás un email de confirmación con los detalles de tu inscripción.
                      </p>
                    </form>
                    <Separator className="my-4" />
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-800 mb-2">
                        ¿Ya tienes una cuenta?
                      </p>
                      <Link 
                        href={`/auth/login?callbackUrl=/checkout/${cohort.id}`}
                        className="text-blue-700 hover:text-blue-900 font-medium underline"
                      >
                        Inicia sesión aquí
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Duración</p>
                <p className="font-medium">{program.durationWeeks} semanas</p>
              </div>
              <Separator />
              
              {/* Coupon Section */}
              <div className="space-y-3">
                <Label htmlFor="coupon">¿Tienes un cupón?</Label>
                {appliedCoupon ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <div>
                          <code className="text-sm font-bold text-green-800">
                            {appliedCoupon.code}
                          </code>
                          {appliedCoupon.description && (
                            <p className="text-xs text-green-700 mt-1">
                              {appliedCoupon.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      type="text"
                      placeholder="CÓDIGO"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 font-mono"
                      disabled={couponLoading}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      variant="outline"
                      className="border-[hsl(var(--brand-primary-light))] text-[hsl(var(--brand-primary-dark))] hover:bg-[hsl(var(--brand-primary-light))]"
                    >
                      {couponLoading ? 'Validando...' : 'Aplicar'}
                    </Button>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatPrice(program.priceCents, program.currency)}
                  </span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between items-center mb-2 text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      Descuento
                    </span>
                    <span className="font-medium">
                      -{formatPrice(appliedCoupon.discountCents, program.currency)}
                    </span>
                  </div>
                )}
                
                <Separator className="my-3" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-[hsl(var(--brand-primary-dark))]">
                    {formatPrice(
                      appliedCoupon ? appliedCoupon.finalAmountCents : program.priceCents,
                      program.currency
                    )}
                  </span>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-gray-500 text-right mt-1">
                    Ahorras {formatPrice(appliedCoupon.discountCents, program.currency)}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              {userId ? (
                <Button
                  onClick={handleAuthenticatedCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] hover:from-[hsl(var(--brand-primary-dark))] hover:to-[hsl(var(--brand-primary-dark))]"
                  size="lg"
                >
                  {isProcessing ? (
                    'Procesando...'
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Proceder al Pago
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleGuestCheckout}
                  disabled={isProcessing || !guestData.name || !guestData.email}
                  className="w-full bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] hover:from-[hsl(var(--brand-primary-dark))] hover:to-[hsl(var(--brand-primary-dark))]"
                  size="lg"
                >
                  {isProcessing ? (
                    'Procesando...'
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Proceder al Pago
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
