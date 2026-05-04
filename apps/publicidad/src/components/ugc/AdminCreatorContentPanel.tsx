import { useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, FileImage, FileVideo, Film, Loader2, Plus, Tag } from 'lucide-react';
import type { UgcContentAsset, UgcContentTag } from '@/hooks/useUgcContentLibrary';
import UgcContentAssetCard from './UgcContentAssetCard';
import UgcTagManagerModal from './UgcTagManagerModal';

interface Props {
  assets: UgcContentAsset[];
  tags: UgcContentTag[];
  loading: boolean;
  error: string | null;
  onCreateTag: (name: string, color?: string, description?: string | null) => Promise<UgcContentTag | void>;
  onDeleteTag?: (tagId: string) => Promise<void>;
  onAssignTag: (videoId: string, tagId: string, tag?: UgcContentTag) => Promise<void>;
  onRemoveTag: (videoId: string, tagId: string) => Promise<void>;
  onDownload: (asset: UgcContentAsset) => Promise<void>;
}

export default function AdminCreatorContentPanel({
  assets,
  tags,
  loading,
  error,
  onCreateTag,
  onDeleteTag,
  onAssignTag,
  onRemoveTag,
  onDownload,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  const metrics = useMemo(() => ({
    total: assets.length,
    videos: assets.filter((asset) => asset.media_type === 'video').length,
    photos: assets.filter((asset) => asset.media_type === 'photo').length,
    untagged: assets.filter((asset) => asset.tags.length === 0).length,
  }), [assets]);

  const latest = assets[0];
  const shouldShowBody = expanded || (assets.length > 0 && assets.length <= 2);

  if (assets.length === 0 && !error) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900">
              <Film className="h-3.5 w-3.5 text-gray-500" />
              Contenido
            </p>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              {loading ? 'cargando…' : `${metrics.total} asset${metrics.total === 1 ? '' : 's'}`}
            </span>
            {metrics.untagged > 0 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                {metrics.untagged} sin etiqueta
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-gray-400">
            {latest
              ? `Último: ${latest.campaign?.name || 'Sin campaña'} · ${new Date(latest.created_at).toLocaleDateString('es-CO')}`
              : 'Videos y fotos que sube esta creadora.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowTagModal(true)}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-3 w-3" />
            Etiqueta
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            disabled={loading || assets.length === 0}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-gray-950 px-2 text-[11px] font-semibold text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
          >
            {expanded ? 'Ocultar' : 'Ver'}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">Total</p>
          <p className="text-xs font-semibold text-gray-900">{metrics.total}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-gray-400"><FileVideo className="h-2.5 w-2.5" />Videos</p>
          <p className="text-xs font-semibold text-gray-900">{metrics.videos}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-gray-400"><FileImage className="h-2.5 w-2.5" />Fotos</p>
          <p className="text-xs font-semibold text-gray-900">{metrics.photos}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-gray-400"><Tag className="h-2.5 w-2.5" />Sin tag</p>
          <p className="text-xs font-semibold text-gray-900">{metrics.untagged}</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-2 flex items-center justify-center rounded-xl border border-dashed border-gray-200 py-4 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : error ? (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : assets.length === 0 ? null : shouldShowBody ? (
        <div className="mt-2 grid gap-2 xl:grid-cols-2">
          {assets.map((asset) => (
            <UgcContentAssetCard
              key={asset.id}
              asset={asset}
              tags={tags}
              variant="compact"
              hideCreator
              onAssignTag={onAssignTag}
              onRemoveTag={onRemoveTag}
              onCreateTag={onCreateTag}
              onDownload={onDownload}
            />
          ))}
        </div>
      ) : null}

      <UgcTagManagerModal
        open={showTagModal}
        tags={tags}
        onClose={() => setShowTagModal(false)}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
      />
    </section>
  );
}
