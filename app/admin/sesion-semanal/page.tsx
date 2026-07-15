
'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Power } from 'lucide-react';

interface WeeklySession {
  id: string;
  sessionType: string;
  dayOfWeek: string;
  time: string;
  durationHours: number;
  formUrl: string;
  presentialDate: string | null;
  presentialLocation: string | null;
  presentialUrl: string | null;
  isActive: boolean;
}

const diasSemana = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
];

export default function WeeklySessionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [session, setSession] = useState<WeeklySession | null>(null);
  
  const [formData, setFormData] = useState({
    sessionType: 'online',
    dayOfWeek: 'Miércoles',
    time: '19:00',
    durationHours: 1,
    formUrl: '',
    presentialDate: '',
    presentialLocation: '',
    presentialUrl: '',
    isActive: true
  });

  const fetchWeeklySession = useCallback(async () => {
    try {
      setIsFetching(true);
      const response = await fetch('/api/weekly-session');
      const data = await response.json();
      
      if (data.weeklySession) {
        setSession(data.weeklySession);
        setFormData({
          sessionType: data.weeklySession.sessionType || 'online',
          dayOfWeek: data.weeklySession.dayOfWeek,
          time: data.weeklySession.time,
          durationHours: data.weeklySession.durationHours,
          formUrl: data.weeklySession.formUrl,
          presentialDate: data.weeklySession.presentialDate 
            ? new Date(data.weeklySession.presentialDate).toISOString().slice(0, 16)
            : '',
          presentialLocation: data.weeklySession.presentialLocation || '',
          presentialUrl: data.weeklySession.presentialUrl || '',
          isActive: data.weeklySession.isActive
        });
      }
    } catch (error) {
      console.error('Error fetching weekly session:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración de la sesión semanal',
        variant: 'destructive'
      });
    } finally {
      setIsFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchWeeklySession();
  }, [fetchWeeklySession]);

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/weekly-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar');
      }

      setSession(data.weeklySession);
      
      toast({
        title: 'Éxito',
        description: 'Configuración guardada correctamente'
      });
    } catch (error: any) {
      console.error('Error saving weekly session:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la configuración',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setIsLoading(true);

      const newActiveState = !formData.isActive;

      const response = await fetch('/api/weekly-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActiveState })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar estado');
      }

      setFormData({ ...formData, isActive: newActiveState });
      setSession(data.weeklySession);
      
      toast({
        title: 'Éxito',
        description: newActiveState 
          ? 'Sesión semanal activada' 
          : 'Sesión semanal desactivada'
      });
    } catch (error: any) {
      console.error('Error toggling active state:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cambiar el estado',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sesión Semanal Gratuita</h1>
          <p className="text-gray-600 mt-1">
            Configura la sesión de introducción online gratuita semanal
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de la Sesión</CardTitle>
          <CardDescription>
            Define el tipo de sesión y su configuración para mostrar en la página principal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <Label className="text-base font-semibold">Estado de la Sesión</Label>
              <p className="text-sm text-gray-600 mt-1">
                {formData.isActive 
                  ? 'La sesión está activa y visible en la página principal' 
                  : 'La sesión está desactivada y no se muestra en la página principal'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={handleToggleActive}
                disabled={isLoading}
              />
              <Power className={`h-5 w-5 ${formData.isActive ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <Label htmlFor="sessionType">Tipo de Sesión</Label>
            <Select
              value={formData.sessionType}
              onValueChange={(value) => setFormData({ ...formData, sessionType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo de sesión" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Sesión Online Gratuita (Recurrente)</SelectItem>
                <SelectItem value="presencial">Clase Gratuita Presencial (Fecha específica)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Online Session Fields */}
          {formData.sessionType === 'online' && (
            <>
              {/* Day of Week */}
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Día de la Semana</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((dia) => (
                      <SelectItem key={dia} value={dia}>
                        {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time">Hora (formato 24h, ej: 19:00)</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="max-w-xs"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (horas)</Label>
                <Select
                  value={formData.durationHours.toString()}
                  onValueChange={(value) => setFormData({ ...formData, durationHours: parseInt(value) })}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Selecciona duración" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="2">2 horas</SelectItem>
                    <SelectItem value="3">3 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Form URL */}
              <div className="space-y-2">
                <Label htmlFor="formUrl">Enlace del Formulario de Inscripción</Label>
                <Input
                  id="formUrl"
                  type="url"
                  placeholder="https://docs.google.com/forms/..."
                  value={formData.formUrl}
                  onChange={(e) => setFormData({ ...formData, formUrl: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Enlace del formulario de Google Forms o cualquier otro formulario de inscripción
                </p>
              </div>
            </>
          )}

          {/* Presential Session Fields */}
          {formData.sessionType === 'presencial' && (
            <>
              {/* Date and Time */}
              <div className="space-y-2">
                <Label htmlFor="presentialDate">Fecha y Hora de la Clase</Label>
                <Input
                  id="presentialDate"
                  type="datetime-local"
                  value={formData.presentialDate}
                  onChange={(e) => setFormData({ ...formData, presentialDate: e.target.value })}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500">
                  Selecciona la fecha y hora exacta de la clase presencial
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="presentialLocation">Ubicación (Opcional)</Label>
                <Input
                  id="presentialLocation"
                  type="text"
                  placeholder="Ej: Madrid, Centro"
                  value={formData.presentialLocation}
                  onChange={(e) => setFormData({ ...formData, presentialLocation: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Ubicación de la clase (se mostrará en el botón)
                </p>
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="presentialUrl">URL de Inscripción</Label>
                <Input
                  id="presentialUrl"
                  type="url"
                  placeholder="https://..."
                  value={formData.presentialUrl}
                  onChange={(e) => setFormData({ ...formData, presentialUrl: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Enlace al que se redirigirá cuando hagan clic en el botón
                </p>
              </div>
            </>
          )}

          {/* Preview */}
          {formData.isActive && (
            <div className="p-4 bg-[hsl(var(--brand-primary-light))] border border-[hsl(var(--brand-primary-light))] rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Vista Previa del Botón:</h3>
              {formData.sessionType === 'online' ? (
                <p className="text-sm text-gray-700">
                  📅 Sesión Online Gratuita - {formData.dayOfWeek} {formData.time}
                </p>
              ) : (
                <p className="text-sm text-gray-700">
                  🎉 Clase Gratuita Presencial - {formData.presentialDate && new Date(formData.presentialDate).toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}{formData.presentialLocation && ` en ${formData.presentialLocation}`}
                </p>
              )}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={
                isLoading || 
                (formData.sessionType === 'online' && !formData.formUrl) ||
                (formData.sessionType === 'presencial' && (!formData.presentialDate || !formData.presentialUrl))
              }
              className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Activar/Desactivar:</strong> Usa el switch para activar o desactivar la sesión cuando no puedas darla.</p>
          <p>• <strong>Tipo de Sesión:</strong> Elige entre sesión online recurrente o clase presencial con fecha específica.</p>
          <p>• <strong>Sesión Online:</strong> Configura el día y hora semanal, se repetirá cada semana.</p>
          <p>• <strong>Clase Presencial:</strong> Define fecha/hora exacta y ubicación para una clase específica.</p>
          <p>• <strong>Actualización Automática:</strong> Los cambios se reflejan inmediatamente en la página principal.</p>
        </CardContent>
      </Card>
    </div>
  );
}
