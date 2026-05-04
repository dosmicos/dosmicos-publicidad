import { useState, type FormEvent } from 'react';
import { Plus, Tag, X } from 'lucide-react';
import type { UgcContentTag } from '@/hooks/useUgcContentLibrary';

interface UgcTagManagerModalProps {
  open: boolean;
  tags: UgcContentTag[];
  onClose: () => void;
  onCreateTag: (name: string, color: string, description?: string | null) => Promise<UgcContentTag | void>;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export default function UgcTagManagerModal({
  open,
  tags,
  onClose,
  onCreateTag,
}: UgcTagManagerModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#111827');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Escribe un nombre para la etiqueta.');
      return;
    }
    if (!HEX_COLOR.test(color)) {
      setError('El color debe tener formato #RRGGBB.');
      return;
    }

    setSaving(true);
    try {
      await onCreateTag(cleanName, color, description.trim() || null);
      setName('');
      setDescription('');
      setColor('#111827');
    } catch (err: any) {
      const message = err?.message || 'No se pudo crear la etiqueta.';
      setError(
        message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('unique')
          ? 'Ya existe una etiqueta activa con ese nombre.'
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Biblioteca UGC</p>
            <h2 className="mt-0.5 text-base font-semibold text-gray-950">Etiquetas de contenido</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-4 py-3">
          <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Tag className="h-3.5 w-3.5" />
              Etiquetas existentes
            </div>
            {tags.length === 0 ? (
              <p className="text-xs text-gray-400">Aún no hay etiquetas reutilizables.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700"
                    title={tag.description || tag.name}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="truncate">{tag.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Ads, Orgánico, Pendiente edición"
                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950"
              />
            </div>

            <div className="grid grid-cols-[72px_1fr] gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white p-1"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Hex</label>
                <input
                  type="text"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-950"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Descripción opcional</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Uso interno de esta etiqueta..."
                rows={2}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-950 px-3 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {saving ? 'Creando...' : 'Crear etiqueta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
