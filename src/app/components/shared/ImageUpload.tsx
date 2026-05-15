import { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'sonner';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;        // máximo de imágenes permitidas (default 5)
  single?: boolean;    // true = solo una imagen (avatar, etc.)
}

export function ImageUpload({ value, onChange, max = 5, single = false }: Props) {
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const limit = single ? 1 : max;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!user) { toast.error('Debes iniciar sesión para subir imágenes'); return; }

    const allowed = Array.from(files).slice(0, limit - value.length);
    if (allowed.length === 0) {
      toast.error(`Máximo ${limit} imagen${limit !== 1 ? 'es' : ''}`);
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of allowed) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" no es una imagen válida`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" supera los 5 MB`);
        continue;
      }

      const ext  = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('images').upload(path, file, { upsert: false });
      if (error) { toast.error(`Error subiendo ${file.name}`); continue; }

      const { data } = supabase.storage.from('images').getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    if (uploaded.length > 0) {
      onChange(single ? uploaded : [...value, ...uploaded]);
      toast.success(`${uploaded.length} imagen${uploaded.length !== 1 ? 'es' : ''} subida${uploaded.length !== 1 ? 's' : ''}`);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">
      {/* Previews */}
      {value.length > 0 && (
        <div className={`grid gap-2 ${single ? '' : 'grid-cols-3 sm:grid-cols-4'}`}>
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

      {/* Upload zone — hidden if single and already has image */}
      {(!single || value.length === 0) && value.length < limit && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Subiendo...' : 'Haz clic o arrastra imágenes aquí'}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP · Máx 5 MB{!single && ` · ${value.length}/${limit}`}
          </p>
        </button>
      )}

      {/* URL fallback */}
      {(!single || value.length === 0) && value.length < limit && (
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
                  if (url) {
                    onChange(single ? [url] : [...value, url]);
                    (e.target as HTMLInputElement).value = '';
                  }
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
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
