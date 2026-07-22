import { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2, ZoomIn, ZoomOut, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'sonner';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  single?: boolean;
}

interface CropArea {
  x: number; y: number; width: number; height: number;
}

async function getCroppedBlob(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen en este navegador.');

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height,
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas vacío')), 'image/jpeg', 0.92)
  );
}

export function ImageUpload({ value, onChange, max = 5, single = false }: Props) {
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // crop state (solo single)
  const [cropSrc, setCropSrc]     = useState<string | null>(null);
  const [crop, setCrop]           = useState({ x: 0, y: 0 });
  const [zoom, setZoom]           = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);

  const limit = single ? 1 : max;

  const onCropComplete = useCallback((_: any, pixels: CropArea) => {
    setCroppedArea(pixels);
  }, []);

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!user) { toast.error('Debes iniciar sesión para subir imágenes'); return; }

    const file = files[0];
    if (!file.type.startsWith('image/')) { toast.error('Selecciona una imagen válida'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('La imagen supera los 10 MB'); return; }

    if (single) {
      const url = URL.createObjectURL(file);
      setCropSrc(url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } else {
      uploadFiles(files);
    }

    if (inputRef.current) inputRef.current.value = '';
  }

  async function applyCrop() {
    if (!cropSrc || !croppedArea || !user) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedArea);
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('images').upload(path, blob, {
        contentType: 'image/jpeg', upsert: true,
      });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      onChange([data.publicUrl]);
      setCropSrc(null);
      toast.success('Foto de perfil actualizada');
    } catch (e: any) {
      console.error('Crop upload error:', e);
      toast.error(e.message ?? 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  async function uploadFiles(files: FileList) {
    if (!user) return;
    const allowed = Array.from(files).slice(0, limit - value.length);
    if (allowed.length === 0) { toast.error(`Máximo ${limit} imágenes`); return; }
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of allowed) {
        if (!file.type.startsWith('image/')) { toast.error(`"${file.name}" no es imagen válida`); continue; }
        if (file.size > 5 * 1024 * 1024) { toast.error(`"${file.name}" supera los 5 MB`); continue; }
        const ext  = file.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
        if (error) { console.error(error); toast.error(`Error subiendo ${file.name}: ${error.message}`); continue; }
        const { data } = supabase.storage.from('images').getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} imagen${uploaded.length !== 1 ? 'es' : ''} subida${uploaded.length !== 1 ? 's' : ''}`);
      }
    } catch (e: any) {
      toast.error('Error inesperado al subir');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">

      {/* Modal de recorte */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <p className="font-semibold text-sm">Ajusta tu foto de perfil</p>
              <button onClick={() => setCropSrc(null)} className="p-1.5 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Área de recorte */}
            <div className="relative w-full" style={{ height: 300 }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Slider de zoom */}
            <div className="px-4 py-3 flex items-center gap-3 border-t border-border">
              <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>

            {/* Botones */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => setCropSrc(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyCrop}
                disabled={uploading}
                className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                  : <><Check className="w-4 h-4" /> Aplicar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview circular (single) */}
      {single && value.length > 0 && !cropSrc && (
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 bg-secondary">
              <img src={value[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => remove(value[0])}
              className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Así se verá tu foto de perfil</p>
        </div>
      )}

      {/* Preview cuadrícula (múltiple) */}
      {!single && value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url) => (
            <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-secondary">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Zona de subida */}
      {(!single || value.length === 0) && value.length < limit && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {uploading
            ? <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            : <Upload className="w-6 h-6 text-muted-foreground" />}
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Subiendo...' : single ? 'Haz clic para subir tu foto' : 'Haz clic o arrastra imágenes aquí'}
          </p>
          <p className="text-xs text-muted-foreground">
            {single ? 'PNG, JPG, WEBP · Máx 10 MB' : `PNG, JPG, WEBP · Máx 5 MB · ${value.length}/${limit}`}
          </p>
        </button>
      )}

      {/* Fallback URL (solo múltiple) */}
      {!single && value.length < limit && (
        <details className="text-xs">
          <summary className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
            O pega una URL de imagen
          </summary>
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              placeholder="https://..."
              className="flex-1 px-3 py-1.5 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const url = (e.target as HTMLInputElement).value.trim();
                  if (url) { onChange([...value, url]); (e.target as HTMLInputElement).value = ''; }
                }
              }}
            />
            <span className="text-muted-foreground text-xs self-center">Enter para agregar</span>
          </div>
        </details>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={!single}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  );
}
