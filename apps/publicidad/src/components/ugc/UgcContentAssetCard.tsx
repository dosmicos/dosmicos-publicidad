import { useMemo, useState, type MouseEvent } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileImage,
  FileVideo,
  Loader2,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import type { UgcContentAsset, UgcContentTag } from '@/hooks/useUgcContentLibrary';
import { useToast } from '@/hooks/use-toast';

interface Props {
  asset: UgcContentAsset;
  tags: UgcContentTag[];
  onAssignTag: (videoId: string, tagId: string) => Promise<void>;
  onRemoveTag: (videoId: string, tagId: string) => Promise<void>;
  onCreateTag?: (name: string, color?: string, description?: string | null) => Promise<UgcContentTag | void>;
  onDownload: (asset: UgcContentAsset) => Promise<void>;
  variant?: 'default' | 'compact';
  hideCreator?: boolean;
}

const platformLabel: Record<string, string> = {
  instagram_reel: 'IG Reel',
  instagram_story: 'IG Story',
  tiktok: 'TikTok',
};

const statusLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  publicado: 'Publicado',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Sin tamaño';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'Fecha desconocida';
  }
}

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white ring-1 ring-gray-200">
      {initials}
    </div>
  );
}

export default function UgcContentAssetCard({
  asset,
  tags,
  onAssignTag,
  onRemoveTag,
  onCreateTag,
  onDownload,
  variant = 'default',
  hideCreator = false,
}: Props) {
  const { toast } = useToast();
  const [selectedTagId, setSelectedTagId] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#111827');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const availableTags = useMemo(
    () => tags.filter((tag) => !asset.tags.some((current) => current.id === tag.id)),
    [asset.tags, tags]
  );

  const creatorName = asset.creator?.name || 'Creadora desconocida';
  const handle = asset.creator?.instagram_handle;
  const assetUrl = asset.preview_url || asset.video_url || '';
  const publicUrl = asset.video_url || asset.preview_url || '';
  const isCompact = variant === 'compact';
  const cleanNewTagName = newTagName.trim();
  const existingTagForNewName = cleanNewTagName
    ? availableTags.find((tag) => tag.name.trim().toLowerCase() === cleanNewTagName.toLowerCase())
    : undefined;

  const handleAssign = async () => {
    if (!selectedTagId) return;
    setBusyAction('assign');
    try {
      await onAssignTag(asset.id, selectedTagId);
      setSelectedTagId('');
      toast({ title: 'Etiqueta agregada' });
    } catch (err: any) {
      toast({ title: 'No se pudo agregar', description: err?.message, variant: 'destructive' });
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateAndAssign = async () => {
    if (!cleanNewTagName) return;
    setBusyAction('create-tag');
    try {
      const tag = existingTagForNewName || await onCreateTag?.(cleanNewTagName, newTagColor, null);
      if (!tag?.id) throw new Error('No se recibió el ID de la etiqueta creada.');

      await onAssignTag(asset.id, tag.id);
      setNewTagName('');
      setNewTagColor('#111827');
      toast({ title: existingTagForNewName ? 'Etiqueta agregada' : 'Etiqueta creada y agregada' });
    } catch (err: any) {
      const message = err?.message || 'No se pudo crear/agregar la etiqueta.';
      toast({
        title: 'No se pudo etiquetar',
        description: message.toLowerCase().includes('authorized') ? 'Tu usuario no tiene permiso para crear etiquetas UGC.' : message,
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleVideoClick = (event: MouseEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.paused) {
      void video.play().catch(() => {
        toast({ title: 'No se pudo reproducir', description: 'Intenta usar el botón de play del video.', variant: 'destructive' });
      });
    } else {
      video.pause();
    }
  };

  const handleRemove = async (tagId: string) => {
    setBusyAction(`remove-${tagId}`);
    try {
      await onRemoveTag(asset.id, tagId);
      toast({ title: 'Etiqueta removida' });
    } catch (err: any) {
      toast({ title: 'No se pudo remover', description: err?.message, variant: 'destructive' });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownload = async () => {
    setBusyAction('download');
    try {
      await onDownload(asset);
      toast({
        title: asset.storage_path ? 'Descarga iniciada' : 'Asset legacy abierto',
        description: asset.storage_path ? undefined : 'No tenía storage_path; se abrió el link público.',
      });
    } catch (err: any) {
      toast({ title: 'No se pudo descargar', description: err?.message, variant: 'destructive' });
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpen = () => {
    if (!assetUrl) return;
    window.open(assetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      toast({ title: 'Link copiado' });
    } else {
      toast({ title: 'No se pudo copiar', variant: 'destructive' });
    }
  };

  return (
    <article className={`min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${isCompact ? 'p-2' : 'p-3'}`}>
      <div className={isCompact ? 'grid gap-2 sm:grid-cols-[96px_minmax(0,1fr)]' : 'grid gap-3 sm:grid-cols-[136px_minmax(0,1fr)]'}>
        <div className={isCompact ? 'relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100 sm:aspect-square' : 'relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100 sm:aspect-[3/4]'}>
          {assetUrl ? (
            asset.media_type === 'photo' ? (
              <img
                src={assetUrl}
                alt={asset.original_filename || `UGC ${creatorName}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <video
                src={assetUrl}
                controls
                playsInline
                preload="metadata"
                onClick={handleVideoClick}
                className="h-full w-full cursor-pointer bg-black object-contain"
              />
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300">
              {asset.media_type === 'photo' ? <FileImage className="h-7 w-7" /> : <FileVideo className="h-7 w-7" />}
              <span className="text-[11px] font-medium">Sin preview</span>
            </div>
          )}
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-700 shadow-sm">
            {asset.media_type === 'photo' ? <FileImage className="h-3 w-3" /> : <FileVideo className="h-3 w-3" />}
            {asset.media_type === 'photo' ? 'Foto' : 'Video'}
          </span>
        </div>

        <div className={isCompact ? 'min-w-0 space-y-2' : 'min-w-0 space-y-2.5'}>
          {hideCreator ? (
            <div className="min-w-0">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-gray-950">{asset.campaign?.name || 'Sin campaña'}</p>
                <span className="shrink-0 text-[10px] font-medium text-gray-400">{formatDate(asset.created_at)}</span>
              </div>
              <p className="truncate text-[11px] text-gray-400">{asset.original_filename || (asset.media_type === 'photo' ? 'Foto subida' : 'Video subido')}</p>
            </div>
          ) : (
            <div className="flex min-w-0 items-start gap-2">
              <Avatar url={asset.creator?.avatar_url || null} name={creatorName} />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-gray-950">{creatorName}</p>
                  <span className="shrink-0 text-[11px] font-medium text-gray-400">{formatDate(asset.created_at)}</span>
                </div>
                <p className="truncate text-xs text-gray-400">
                  {handle ? `@${handle}` : 'Sin handle'} · {asset.campaign?.name || 'Sin campaña'}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{platformLabel[asset.platform || ''] || asset.platform || 'Sin plataforma'}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{formatFileSize(asset.file_size_bytes)}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{statusLabel[asset.status] || asset.status}</span>
          </div>

          {(asset.original_filename || asset.feedback) && (
            <div className="space-y-1 text-xs text-gray-500">
              {asset.original_filename && (
                <p className="truncate" title={asset.original_filename}>
                  <span className="font-semibold text-gray-700">Archivo:</span> {asset.original_filename}
                </p>
              )}
              {asset.feedback && (
                <p className="line-clamp-2" title={asset.feedback}>
                  <span className="font-semibold text-gray-700">Notas:</span> {asset.feedback}
                </p>
              )}
            </div>
          )}

          <div className={isCompact ? 'space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 p-1.5' : 'space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-2'}>
            <div className="flex flex-wrap gap-1.5">
              {asset.tags.length === 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-gray-400 ring-1 ring-gray-200">
                  <Tag className="h-3 w-3" />
                  Sin etiqueta
                </span>
              ) : (
                asset.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200"
                    title={tag.description || tag.name}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="truncate">{tag.name}</span>
                    <button
                      type="button"
                      disabled={busyAction === `remove-${tag.id}`}
                      onClick={() => handleRemove(tag.id)}
                      className="rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                      aria-label={`Remover ${tag.name}`}
                    >
                      {busyAction === `remove-${tag.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
              <select
                value={selectedTagId}
                onChange={(event) => setSelectedTagId(event.target.value)}
                disabled={availableTags.length === 0 || busyAction === 'assign'}
                className="min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 outline-none disabled:text-gray-400"
              >
                <option value="">{availableTags.length === 0 ? 'No hay etiquetas libres' : 'Agregar etiqueta existente'}</option>
                {availableTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedTagId || busyAction === 'assign'}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-950 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-40"
              >
                {busyAction === 'assign' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Agregar
              </button>
            </div>

            {onCreateTag && (
              <div className="grid grid-cols-[minmax(0,1fr)_34px_auto] gap-1.5">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(event) => setNewTagName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleCreateAndAssign();
                    }
                  }}
                  placeholder="Crear etiqueta aquí..."
                  className="min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 outline-none placeholder:text-gray-400 focus:border-gray-950"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(event) => setNewTagColor(event.target.value)}
                  disabled={busyAction === 'create-tag'}
                  aria-label="Color de etiqueta"
                  className="h-[31px] w-[34px] rounded-lg border border-gray-200 bg-white p-0.5 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleCreateAndAssign}
                  disabled={!cleanNewTagName || busyAction === 'create-tag'}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  {busyAction === 'create-tag' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {existingTagForNewName ? 'Usar' : 'Crear'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={busyAction === 'download'}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {busyAction === 'download' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Descargar
            </button>
            <button
              type="button"
              onClick={handleOpen}
              disabled={!assetUrl}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!publicUrl}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              Copiar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
