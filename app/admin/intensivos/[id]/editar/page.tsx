

'use client';

import { useCallback, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function EditCohortPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    maxSeats: '',
    scheduleText: '',
    location: '',
    language: 'es',
    isPublished: false,
    enrollmentOpensAt: '',
    enrollmentClosesAt: ''
  });

  const fetchCohort = useCallback(async () => {
    try {
      const response = await fetch(`/api/intensivos/${params.id}`);
      const data = await response.json();
      
      if (response.ok && data.cohort) {
        const cohort = data.cohort;
        setFormData({
          name: cohort.name,
          startDate: cohort.startDate ? new Date(cohort.startDate).toISOString().split('T')[0] : '',
          endDate: cohort.endDate ? new Date(cohort.endDate).toISOString().split('T')[0] : '',
          maxSeats: cohort.maxSeats.toString(),
          scheduleText: cohort.scheduleText,
          location: cohort.location,
          language: cohort.language || 'es',
          isPublished: cohort.isPublished,
          enrollmentOpensAt: cohort.enrollmentOpensAt 
            ? new Date(cohort.enrollmentOpensAt).toISOString().slice(0, 16)
            : '',
          enrollmentClosesAt: cohort.enrollmentClosesAt
            ? new Date(cohort.enrollmentClosesAt).toISOString().slice(0, 16)
            : ''
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar el intensivo',
        variant: 'destructive'
      });
    }
  }, [params.id, toast]);

  useEffect(() => {
    void fetchCohort();
  }, [fetchCohort]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/intensivos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar intensivo');
      }

      toast({
        title: '¡Éxito!',
        description: 'Intensivo actualizado exitosamente'
      });

      router.push('/admin/intensivos');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar intensivo',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/intensivos/${params.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar intensivo');
      }

      toast({
        title: '¡Éxito!',
        description: 'Intensivo eliminado exitosamente'
      });

      router.push('/admin/intensivos');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar intensivo',
        variant: 'destructive'
      });
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/intensivos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Intensivos
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Editar Intensivo</CardTitle>
          <CardDescription>
            Actualiza la información del intensivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Intensivo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSeats">Plazas Máximas</Label>
              <Input
                id="maxSeats"
                type="number"
                min="1"
                value={formData.maxSeats}
                onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleText">Horario</Label>
              <Textarea
                id="scheduleText"
                value={formData.scheduleText}
                onChange={(e) => setFormData({ ...formData, scheduleText: e.target.value })}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma del Programa</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enrollmentOpensAt">Inscripción Abre</Label>
                <Input
                  id="enrollmentOpensAt"
                  type="datetime-local"
                  value={formData.enrollmentOpensAt}
                  onChange={(e) => setFormData({ ...formData, enrollmentOpensAt: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollmentClosesAt">Inscripción Cierra</Label>
                <Input
                  id="enrollmentClosesAt"
                  type="datetime-local"
                  value={formData.enrollmentClosesAt}
                  onChange={(e) => setFormData({ ...formData, enrollmentClosesAt: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="isPublished">Publicar intensivo</Label>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Intensivo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todas las inscripciones asociadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-3">
                <Link href="/admin/intensivos">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]"
                  disabled={isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
