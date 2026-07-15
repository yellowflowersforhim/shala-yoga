
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Clock, CheckCircle, Send, Loader2 } from 'lucide-react';

export default function EmailsManager() {
  const [sendingReminders, setSendingReminders] = useState(false);
  const [sendingCompletion, setSendingCompletion] = useState(false);

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true);
      
      const response = await fetch('/api/admin/emails/send-reminders', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Recordatorios enviados: ${data.emailsSent} emails enviados${
            data.errors > 0 ? ` (${data.errors} errores)` : ''
          }`
        );
      } else {
        toast.error(data.error || 'Error al enviar recordatorios');
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error('Error al enviar recordatorios');
    } finally {
      setSendingReminders(false);
    }
  };

  const handleSendCompletion = async () => {
    try {
      setSendingCompletion(true);
      
      const response = await fetch('/api/admin/emails/send-completion', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Emails de agradecimiento enviados: ${data.emailsSent} emails enviados${
            data.errors > 0 ? ` (${data.errors} errores)` : ''
          }`
        );
      } else {
        toast.error(data.error || 'Error al enviar emails de agradecimiento');
      }
    } catch (error) {
      console.error('Error sending completion emails:', error);
      toast.error('Error al enviar emails de agradecimiento');
    } finally {
      setSendingCompletion(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Reminder Emails Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
            <CardTitle>Recordatorios de Inicio</CardTitle>
          </div>
          <CardDescription>
            Envía emails de recordatorio a estudiantes cuyos intensivos comienzan mañana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ Se envían 24 horas antes del inicio del intensivo</p>
            <p>📧 Incluye detalles del programa, ubicación y horarios</p>
            <p>💡 Incluye consejos de preparación para la práctica</p>
          </div>
          
          <Button
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="w-full"
          >
            {sendingReminders ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Recordatorios
              </>
            )}
          </Button>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>💡 Tip:</strong> Puedes configurar un cron job para enviar estos emails automáticamente cada día a las 10:00 AM.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Completion Emails Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle>Emails de Agradecimiento</CardTitle>
          </div>
          <CardDescription>
            Envía emails de agradecimiento a estudiantes que completaron intensivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ Se envían al día siguiente de finalizar el intensivo</p>
            <p>🎉 Felicita al estudiante por completar el programa</p>
            <p>📚 Incluye sugerencias de próximos pasos</p>
          </div>
          
          <Button
            onClick={handleSendCompletion}
            disabled={sendingCompletion}
            className="w-full"
          >
            {sendingCompletion ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Agradecimientos
              </>
            )}
          </Button>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800">
              <strong>💡 Tip:</strong> Estos emails también actualizan el estado de inscripción a "completado" automáticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <CardTitle>Sistema de Emails Automáticos</CardTitle>
          </div>
          <CardDescription>
            Información sobre los emails que se envían automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">✅ Emails Automáticos (al pagar)</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Confirmación de inscripción al estudiante</li>
                  <li>• Notificación al administrador</li>
                  <li>• Sincronización con Mailerlite</li>
                  <li>• Asignación a grupo por programa</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">📧 Emails Manuales/Programados</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Recordatorios 24h antes (manual o cron)</li>
                  <li>• Agradecimientos al finalizar (manual o cron)</li>
                  <li>• Newsletter via Mailerlite</li>
                  <li>• Campañas segmentadas por programa</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-sm text-blue-900 mb-2">⚙️ Automatización con Cron Jobs</h4>
              <p className="text-xs text-blue-800">
                Para automatizar completamente el envío de emails, puedes configurar cron jobs que llamen a las APIs:
              </p>
              <div className="mt-2 bg-white rounded p-2 font-mono text-xs">
                <p className="text-blue-600"># Enviar recordatorios diarios a las 10:00 AM</p>
                <p>0 10 * * * curl -X POST https://tu-dominio.com/api/admin/emails/send-reminders</p>
                <p className="mt-2 text-blue-600"># Enviar agradecimientos diarios a las 18:00 PM</p>
                <p>0 18 * * * curl -X POST https://tu-dominio.com/api/admin/emails/send-completion</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
