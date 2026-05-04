import { useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, Film, Image, Loader2, Plus, RefreshCw, Search, Tag, X } from 'lucide-react';
import { useUgcContentLibrary, type UgcContentAsset } from '@/hooks/useUgcContentLibrary';
import UgcContentAssetCard from './UgcContentAssetCard';
import UgcTagManagerModal from './UgcTagManagerModal';

const ALL = 'all';

type MediaFilter = typeof ALL | 'video' | 'photo';

const statusOptions = [
  { value: ALL, label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'publicado', label: 'Publicado' },
];

function uniqueById<T extends { id: string }>(items: T[]) {
  const byId = new Map<string, T>();
  items.forEach((item) => byId.set(item.id, item));
  return [...byId.values()];
}

function assetSearchText(asset: UgcContentAsset) {
  return [
    asset.creator?.name,
    asset.creator?.instagram_handle,
    asset.campaign?.name,
    asset.original_filename,
    asset.feedback,
    asset.platform,
    asset.status,
    ...asset.tags.map((tag) => tag.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1.5 text-gray-400">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1 text-lg font-semibold text-gray-950">{value}</p>
    </div>
  );
}

export default function UgcContentLibrary() {
  const {
    assets,
    tags,
    loading,
    error,
    refetch,
    createTag,
    assignTag,
    removeTag,
    deleteTag,
    downloadAsset,
  } = useUgcContentLibrary();

  const [showTagModal, setShowTagModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [creatorId, setCreatorId] = useState(ALL);
  const [campaignId, setCampaignId] = useState(ALL);
  const [mediaType, setMediaType] = useState<MediaFilter>(ALL);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState(ALL);

  const creators = useMemo(() => uniqueById(
    assets
      .map((asset) => asset.creator)
      .filter((creator): creator is NonNullable<UgcContentAsset['creator']> => Boolean(creator))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  ), [assets]);

  const campaigns = useMemo(() => uniqueById(
    assets
      .map((asset) => asset.campaign)
      .filter((campaign): campaign is NonNullable<UgcContentAsset['campaign']> => Boolean(campaign))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  ), [assets]);

  const metrics = useMemo(() => ({
    total: assets.length,
    videos: assets.filter((asset) => asset.media_type === 'video').length,
    photos: assets.filter((asset) => asset.media_type === 'photo').length,
    untagged: assets.filter((asset) => asset.tags.length === 0).length,
  }), [assets]);

  const selectedFilterTags = useMemo(
    () => selectedTagIds
      .map((id) => tags.find((tag) => tag.id === id))
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
    [selectedTagIds, tags]
  );

  const availableFilterTags = useMemo(
    () => tags.filter((tag) => !selectedTagIds.includes(tag.id)),
    [selectedTagIds, tags]
  );

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (query && !assetSearchText(asset).includes(query)) return false;
      if (creatorId !== ALL && asset.creator_id !== creatorId) return false;
      if (campaignId !== ALL && (asset.campaign_id || 'none') !== campaignId) return false;
      if (mediaType !== ALL && asset.media_type !== mediaType) return false;
      if (selectedTagIds.length > 0 && !selectedTagIds.every((id) => asset.tags.some((tag) => tag.id === id))) return false;
      if (status !== ALL && asset.status !== status) return false;
      return true;
    });
  }, [assets, campaignId, creatorId, mediaType, search, selectedTagIds, status]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const addTagFilter = (tagId: string) => {
    if (!tagId || selectedTagIds.includes(tagId)) return;
    setSelectedTagIds((current) => [...current, tagId]);
  };

  const removeTagFilter = (tagId: string) => {
    setSelectedTagIds((current) => current.filter((id) => id !== tagId));
  };

  const handleDeleteTag = async (tagId: string) => {
    await deleteTag(tagId);
    setSelectedTagIds((current) => current.filter((id) => id !== tagId));
  };

  const resetFilters = () => {
    setSearch('');
    setCreatorId(ALL);
    setCampaignId(ALL);
    setMediaType(ALL);
    setSelectedTagIds([]);
    setStatus(ALL);
  };

  const hasFilters = Boolean(search.trim())
    || creatorId !== ALL
    || campaignId !== ALL
    || mediaType !== ALL
    || selectedTagIds.length > 0
    || status !== ALL;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Contenido recibido</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-950">Biblioteca UGC</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Revisa videos y fotos subidos por creadoras, descárgalos y filtra por una o varias etiquetas combinadas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setShowTagModal(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gray-950 px-3 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Crear / eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Metric icon={<Film className="h-3.5 w-3.5" />} label="Total" value={metrics.total} />
        <Metric icon={<Film className="h-3.5 w-3.5" />} label="Videos" value={metrics.videos} />
        <Metric icon={<Image className="h-3.5 w-3.5" />} label="Fotos" value={metrics.photos} />
        <Metric icon={<Tag className="h-3.5 w-3.5" />} label="Sin etiqueta" value={metrics.untagged} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 lg:grid-cols-[minmax(220px,1.3fr)_repeat(5,minmax(120px,1fr))]">
          <div className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar creadora, campaña, archivo, notas..."
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          <select
            value={creatorId}
            onChange={(event) => setCreatorId(event.target.value)}
            className="h-10 min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none"
          >
            <option value={ALL}>Todas las creadoras</option>
            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>{creator.name}</option>
            ))}
          </select>

          <select
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
            className="h-10 min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none"
          >
            <option value={ALL}>Todas las campañas</option>
            <option value="none">Sin campaña</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>

          <select
            value={mediaType}
            onChange={(event) => setMediaType(event.target.value as MediaFilter)}
            className="h-10 min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none"
          >
            <option value={ALL}>Videos y fotos</option>
            <option value="video">Solo videos</option>
            <option value="photo">Solo fotos</option>
          </select>

          <div className="flex min-w-0 gap-1.5">
            <select
              value=""
              onChange={(event) => addTagFilter(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="">{selectedTagIds.length === 0 ? 'Filtrar por etiquetas' : `+ etiqueta (${selectedTagIds.length})`}</option>
              {availableFilterTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowTagModal(true)}
              className="h-10 shrink-0 rounded-xl border border-gray-200 bg-white px-2.5 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
            >
              Editar
            </button>
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {selectedFilterTags.length > 0 && (
          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold text-gray-500">
                Debe tener {selectedFilterTags.length === 1 ? 'esta etiqueta' : 'todas estas etiquetas'}:
              </span>
              {selectedFilterTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200"
                  title={tag.description || tag.name}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="truncate">{tag.name}</span>
                  <button
                    type="button"
                    onClick={() => removeTagFilter(tag.id)}
                    className="rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label={`Quitar filtro ${tag.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            {selectedFilterTags.length > 1 && (
              <p className="mt-1 text-[11px] font-medium text-gray-400">
                Filtro AND: solo muestra contenido que tenga las {selectedFilterTags.length} etiquetas seleccionadas.
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 text-xs font-medium text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Mostrando {filteredAssets.length} de {assets.length} asset{assets.length === 1 ? '' : 's'}.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="self-start text-gray-500 underline decoration-gray-300 underline-offset-2 transition hover:text-gray-900 sm:self-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-700">Error al cargar contenido</p>
            <p className="mt-0.5 text-xs text-red-500">{error}</p>
            <button onClick={handleRefresh} className="mt-2 text-xs font-medium text-red-600 underline">
              Reintentar
            </button>
          </div>
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <Film className="mx-auto mb-2 h-8 w-8 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Aún no hay contenido subido por UGC.</p>
          <p className="mt-1 text-xs text-gray-400">Cuando una creadora suba fotos o videos aparecerán aquí.</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center">
          <Search className="mx-auto mb-2 h-7 w-7 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Sin resultados con estos filtros.</p>
          <button type="button" onClick={resetFilters} className="mt-2 text-xs font-semibold text-gray-900 underline">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filteredAssets.map((asset) => (
            <UgcContentAssetCard
              key={asset.id}
              asset={asset}
              tags={tags}
              onAssignTag={assignTag}
              onRemoveTag={removeTag}
              onCreateTag={createTag}
              onDownload={downloadAsset}
            />
          ))}
        </div>
      )}

      <UgcTagManagerModal
        open={showTagModal}
        tags={tags}
        onClose={() => setShowTagModal(false)}
        onCreateTag={createTag}
        onDeleteTag={handleDeleteTag}
      />
    </section>
  );
}
