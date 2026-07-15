
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleTest = async () => {
    if (!email) {
      setResult({
        success: false,
        message: 'Por favor ingresa un email'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: '✅ Email enviado exitosamente',
          details: data
        });
      } else {
        setResult({
          success: false,
          message: '❌ Error al enviar email',
          details: data
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: '❌ Error de conexión',
        details: { error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Probar Configuración de Email
          </CardTitle>
          <CardDescription>
            Envía un email de prueba para verificar que la configuración de Ionos está funcionando correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email de destino
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleTest}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email de Prueba
              </>
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="font-semibold mb-2">{result.message}</div>
                    {result.details && (
                      <div className="text-sm space-y-2">
                        {result.details.messageId && (
                          <div>
                            <strong>Message ID:</strong> {result.details.messageId}
                          </div>
                        )}
                        {result.details.error && (
                          <div>
                            <strong>Error:</strong> {result.details.error}
                          </div>
                        )}
                        {result.details.details && (
                          <div>
                            <strong>Detalles:</strong> {result.details.details}
                          </div>
                        )}
                        {result.details.code && (
                          <div>
                            <strong>Código:</strong> {result.details.code}
                          </div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">📋 Configuración actual:</h3>
            <div className="bg-muted p-3 rounded text-sm space-y-1 font-mono">
              <div><strong>HOST:</strong> {process.env.NEXT_PUBLIC_EMAIL_HOST || 'smtp.ionos.es'}</div>
              <div><strong>PORT:</strong> {process.env.NEXT_PUBLIC_EMAIL_PORT || '587'}</div>
              <div><strong>USER:</strong> info@shala.app</div>
            </div>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-sm">
            <p className="font-semibold mb-2">⚠️ Importante:</p>
            <p>
              Si el email no se envía, verifica que la variable <code className="bg-amber-100 px-1 rounded">EMAIL_PASS</code> en el archivo <code className="bg-amber-100 px-1 rounded">.env</code> contenga tu contraseña real de Ionos (no el placeholder &quot;your-app-password-here&quot;).
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-sm">
            <p className="font-semibold mb-2">💡 Cómo obtener tu contraseña de Ionos:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Accede a tu panel de control de Ionos</li>
              <li>Ve a la sección de Email</li>
              <li>Busca la configuración de la cuenta info@shala.app</li>
              <li>Usa la contraseña de esa cuenta de email</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
