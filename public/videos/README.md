
# Videos Folder

## Hero Video (Background Loop)

⚠️ **OPCIONAL:** La página principal actualmente usa una imagen estática. Si deseas añadir un video de fondo en loop, sigue estas instrucciones.

### Cómo Activar el Video de Fondo:

1. **Prepara tu video:**
   - Duración: 5-10 segundos (se repetirá en loop)
   - Formato: MP4 (H.264 codec)
   - Resolución: 1920x1080 (Full HD) o superior
   - Tamaño: Menos de 5MB para carga rápida

2. **Nombra tu video:** `hero-loop.mp4`

3. **Coloca el video en esta carpeta:** `/public/videos/hero-loop.mp4`

4. **Actualiza el código en** `app/page.tsx`:

Busca esta sección (línea ~88):
```tsx
<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1600')] bg-cover bg-center" />
```

Y reemplázala con:
```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  className="absolute inset-0 w-full h-full object-cover"
  poster="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1600"
>
  <source src="/videos/hero-loop.mp4" type="video/mp4" />
</video>
```

### Consejos de Optimización:
- Usa herramientas como HandBrake o FFmpeg para comprimir el video
- Asegúrate de que el video loop sea perfecto (primer y último frame deben coincidir)
- Prueba en móviles para verificar el rendimiento
- Considera usar videos diferentes para móvil y desktop si es necesario

### Estado Actual:
✅ Imagen estática funcionando (no requiere acción)
⏳ Video en loop: Pendiente de añadir (opcional)
