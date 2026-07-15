

'use client';

import { useCallback, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Trash2, Upload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
import { ProgramImage } from '@/components/program-image';

export default function EditProgramPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationWeeks: '',
    priceCents: '',
    currency: 'EUR',
    imageUrl: '',
    isActive: true
  });

  const fetchProgram = useCallback(async () => {
    try {
      const response = await fetch(`/api/programs/${params.id}`);
      const data = await response.json();
      
      if (response.ok && data.program) {
        setFormData({
          title: data.program.title,
          description: data.program.description,
          durationWeeks: data.program.durationWeeks.toString(),
          priceCents: data.program.priceCents.toString(),
          currency: data.program.currency,
          imageUrl: data.program.imageUrl || '',
          isActive: data.program.isActive
        });
        setCurrentImageUrl(data.program.imageUrl);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar el programa',
        variant: 'destructive'
      });
    }
  }, [params.id, toast]);

  useEffect(() => {
    void fetchProgram();
  }, [fetchProgram]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo de imagen',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen es muy grande. Máximo 5MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create FormData
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      // Upload to server
      const response = await fetch('/api/programs/upload-image', {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir imagen');
      }

      // Update form data with image URL
      setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
      setCurrentImageUrl(null); // Clear current image since we have a new one
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast({
        title: 'Imagen subida',
        description: 'La imagen se ha subido exitosamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al subir imagen',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (currentImageUrl) {
      // If there's a current image in the database, delete it
      try {
        await fetch(`/api/programs/${params.id}/delete-image`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview(null);
    setCurrentImageUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/programs/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar programa');
      }

      toast({
        title: '¡Éxito!',
        description: 'Programa actualizado exitosamente'
      });

      router.push('/admin/programas');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar programa',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/programs/${params.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar programa');
      }

      toast({
        title: '¡Éxito!',
        description: 'Programa eliminado exitosamente'
      });

      router.push('/admin/programas');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar programa',
        variant: 'destructive'
      });
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/programas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Programas
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Editar Programa</CardTitle>
          <CardDescription>
            Actualiza la información del programa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Programa</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Imagen del Programa</Label>
              {imagePreview || currentImageUrl ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Vista previa"
                      fill
                      className="object-cover"
                    />
                  ) : currentImageUrl ? (
                    <ProgramImage
                      imageUrl={currentImageUrl}
                      programTitle={formData.title}
                      className="w-full h-full"
                    />
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[hsl(var(--brand-primary))] transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-primary-dark))] font-medium">
                      Haz clic para subir
                    </span>
                    <span className="text-gray-600"> o arrastra y suelta</span>
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG, WEBP hasta 5MB
                  </p>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                  />
                </div>
              )}
              {isUploadingImage && (
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Subiendo imagen...
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationWeeks">Duración (semanas)</Label>
                <Input
                  id="durationWeeks"
                  type="number"
                  min="1"
                  value={formData.durationWeeks}
                  onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceCents">Precio (céntimos)</Label>
                <Input
                  id="priceCents"
                  type="number"
                  min="0"
                  value={formData.priceCents}
                  onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Programa activo</Label>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Programa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todos los intensivos asociados.
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
                <Link href="/admin/programas">
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
