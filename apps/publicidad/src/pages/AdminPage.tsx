import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  RotateCcw,
  Users,
  Trophy,
  RefreshCw,
  AlertCircle,
  Search,
  History,
  ChevronDown,
  Film,
  Wallet,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboard, type CreatorWithLink } from '@/hooks/useAdminDashboard';
import { usePublicRanking } from '@/hooks/usePublicRanking';
import { useUgcContentLibrary } from '@/hooks/useUgcContentLibrary';
import AdminCreatorCard from '@/components/ugc/AdminCreatorCard';
import UgcContentLibrary from '@/components/ugc/UgcContentLibrary';
import PayoutModal from '@/components/ugc/PayoutModal';
import ResetPeriodModal from '@/components/ugc/ResetPeriodModal';
import RankingSection from '@/components/ugc/RankingSection';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

type Tab = 'creators' | 'content' | 'ranking' | 'payouts';
type CreatorFilter = 'all' | 'with_balance' | 'with_link' | 'no_link' | 'no_club' | 'no_upload';
type CreatorIdeaFilter = 'all' | 'none' | string;
type PayoutsSubtab = 'pending' | 'history';

const CREATOR_PAGE_SIZE = 30;
const HISTORY_PAGE_SIZE = 50;

export default function AdminPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const {
    creators,
    payouts,
    rankingStartedAt,
    loading,
    error,
    refetch,
    resetRankingPeriod,
    registerPayout,
    createDiscountLink,
    deleteDiscountLink,
    updateCommissionRate,
    generateClubPortalLink,
    revokeClubPortalLink,
    generateUploadToken,
    deactivateUploadToken,
    addToolkitAssignment,
    deactivateToolkitAssignment,
  } = useAdminDashboard();

  const { rankingByCommission, loading: rankingLoading } = usePublicRanking('dosmicos');

  const [tab, setTab] = useState<Tab>('creators');
  const [showResetModal, setShowResetModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CreatorFilter>('all');
  const [ideaFilter, setIdeaFilter] = useState<CreatorIdeaFilter>('all');
  const [payoutsCreatorId, setPayoutsCreatorId] = useState<string>('all');
  const [payoutsSubtab, setPayoutsSubtab] = useState<PayoutsSubtab>('pending');
  const [selectedPayoutCreator, setSelectedPayoutCreator] = useState<CreatorWithLink | null>(null);
  const [showCreatorPicker, setShowCreatorPicker] = useState(false);
  const [visibleCreatorCount, setVisibleCreatorCount] = useState(CREATOR_PAGE_SIZE);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(HISTORY_PAGE_SIZE);

  const contentLibrary = useUgcContentLibrary({ includePreviewUrls: tab === 'content' });

  const contentByCreator = useMemo(() => {
    const byCreator = new Map<string, typeof contentLibrary.assets>();
    contentLibrary.assets.forEach((asset) => {
      const current = byCreator.get(asset.creator_id) || [];
      current.push(asset);
      byCreator.set(asset.creator_id, current);
    });
    return byCreator;
  }, [contentLibrary.assets]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), contentLibrary.refetch({ silent: true })]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setVisibleCreatorCount(CREATOR_PAGE_SIZE);
  }, [filter, ideaFilter, search]);

  useEffect(() => {
    setVisibleHistoryCount(HISTORY_PAGE_SIZE);
  }, [payoutsCreatorId, payoutsSubtab]);

  const formattedStartDate = rankingStartedAt
    ? new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(rankingStartedAt))
    : '—';

  const creatorsById = useMemo(() => new Map(creators.map((creator) => [creator.id, creator])), [creators]);

  const payoutsByCreator = useMemo(() => {
    const grouped = new Map<string, typeof payouts>();
    payouts.forEach((payout) => {
      const current = grouped.get(payout.creator_id) || [];
      current.push(payout);
      grouped.set(payout.creator_id, current);
    });
    return grouped;
  }, [payouts]);

  const payoutStatsByCreator = useMemo(() => {
    const stats = new Map<string, { count: number; total: number }>();
    payoutsByCreator.forEach((creatorPayouts, creatorId) => {
      stats.set(creatorId, {
        count: creatorPayouts.length,
        total: creatorPayouts.reduce((sum, payout) => sum + payout.amount, 0),
      });
    });
    return stats;
  }, [payoutsByCreator]);

  const ideaFilterOptions = useMemo(() => {
    const options = new Map<string, number>();
    creators.forEach((creator) => {
      (creator.toolkits || []).forEach((toolkit) => {
        const label = (toolkit.label || 'Idea de contenido').trim();
        if (!label) return;
        options.set(label, (options.get(label) || 0) + 1);
      });
    });

    return [...options.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { numeric: true, sensitivity: 'base' }));
  }, [creators]);

  const filteredCreators = useMemo(() => {
    const query = search.trim().toLowerCase();
    return creators.filter((c) => {
      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        (c.instagram_handle || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
      const matchesStatusFilter =
        filter === 'all' ||
        (filter === 'with_balance' && (c.discount_link?.pending_balance ?? 0) > 0) ||
        (filter === 'with_link' && !!c.discount_link) ||
        (filter === 'no_link' && !c.discount_link) ||
        (filter === 'no_club' && !c.portal_link) ||
        (filter === 'no_upload' && !c.upload_token);
      if (!matchesStatusFilter) return false;

      if (ideaFilter === 'none') return (c.toolkits?.length ?? 0) === 0;
      if (ideaFilter !== 'all') {
        return (c.toolkits || []).some((toolkit) => (toolkit.label || 'Idea de contenido').trim() === ideaFilter);
      }

      return true;
    });
  }, [creators, filter, ideaFilter, search]);

  const visibleCreators = useMemo(
    () => filteredCreators.slice(0, visibleCreatorCount),
    [filteredCreators, visibleCreatorCount]
  );

  const totalPendingBalance = useMemo(() => creators.reduce(
    (sum, c) => sum + (c.discount_link?.pending_balance ?? 0),
    0
  ), [creators]);

  const creatorsWithBalance = useMemo(
    () => creators.filter((c) => (c.discount_link?.pending_balance ?? 0) > 0).length,
    [creators]
  );

  const pendingPayoutCreators = useMemo(() => [...creators]
    .filter((c) => (c.discount_link?.pending_balance ?? 0) > 0)
    .sort((a, b) => (b.discount_link?.pending_balance ?? 0) - (a.discount_link?.pending_balance ?? 0)), [creators]);

  const totalPaidHistory = useMemo(
    () => payouts.reduce((sum, payout) => sum + payout.amount, 0),
    [payouts]
  );

  const creatorsWithPayouts = useMemo(
    () => creators.filter((c) => payoutStatsByCreator.has(c.id)),
    [creators, payoutStatsByCreator]
  );

  const filteredPayouts = useMemo(() => (
    payoutsCreatorId === 'all'
      ? payouts
      : payoutsByCreator.get(payoutsCreatorId) || []
  ), [payouts, payoutsByCreator, payoutsCreatorId]);

  const visiblePayouts = useMemo(
    () => filteredPayouts.slice(0, visibleHistoryCount),
    [filteredPayouts, visibleHistoryCount]
  );

  const selectedCreator = payoutsCreatorId !== 'all'
    ? creatorsById.get(payoutsCreatorId)
    : null;

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/logo-dosmicos.png" alt="Dosmicos" className="h-7 object-contain" />
            <span className="text-gray-400 text-xs font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">

        <section className="mb-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Panel UGC</p>
            <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">Administrar creadoras</h1>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500 sm:text-sm">
                  Links de clientes separados de links Club/upload para UGC.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reiniciar ranking
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-400">
                <RotateCcw className="h-3.5 w-3.5" />
                <p className="text-[10px] font-medium uppercase tracking-wide">Ranking desde</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-gray-950">{formattedStartDate}</p>
            </div>
            {!loading && (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Users className="h-3.5 w-3.5" />
                    <p className="text-[10px] font-medium uppercase tracking-wide">Creadoras</p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-950">{creators.length}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 shadow-sm">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">Pendiente</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-800">{formatCOP(totalPendingBalance)}</p>
                  <p className="text-[11px] text-emerald-600">{creatorsWithBalance} creadora{creatorsWithBalance === 1 ? '' : 's'}</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className="mb-4 grid grid-cols-4 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          {([
            { id: 'creators', icon: Users, label: 'Creadoras' },
            { id: 'content', icon: Film, label: 'Contenido' },
            { id: 'ranking', icon: Trophy, label: 'Ranking' },
            { id: 'payouts', icon: History, label: 'Pagos' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-colors ${
                tab === id
                  ? 'bg-gray-950 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Creadoras ── */}
        {tab === 'creators' && (
          <section className="space-y-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm sm:p-3">
              <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(210px,260px)] lg:items-center">
                <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o @handle..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0">
                  {([
                    { id: 'all', label: 'Todas' },
                    { id: 'with_link', label: 'Con descuento' },
                    { id: 'with_balance', label: 'Con saldo' },
                    { id: 'no_link', label: 'Sin descuento' },
                    { id: 'no_club', label: 'Sin Club' },
                    { id: 'no_upload', label: 'Sin upload' },
                  ] as const).map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFilter(id)}
                      className={`h-8 shrink-0 rounded-xl border px-2.5 text-[11px] font-medium transition-all ${
                        filter === id
                          ? 'border-gray-950 bg-gray-950 text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-amber-900">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
                  <select
                    value={ideaFilter}
                    onChange={(event) => setIdeaFilter(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
                    title="Filtrar por idea asignada"
                  >
                    <option value="all">Todas las ideas</option>
                    <option value="none">Sin ideas asignadas</option>
                    {ideaFilterOptions.map(({ label, count }) => (
                      <option key={label} value={label}>{label} ({count})</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-3 text-xs font-medium text-gray-400">
                Mostrando {filteredCreators.length} de {creators.length} creadora{creators.length === 1 ? '' : 's'}.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-semibold text-sm">Error al cargar datos</p>
                  <p className="text-red-500 text-xs mt-0.5">{error}</p>
                  <button onClick={handleRefresh} className="text-red-500 text-xs mt-2 underline">
                    Reintentar
                  </button>
                </div>
              </div>
            ) : filteredCreators.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {search || filter !== 'all' || ideaFilter !== 'all' ? 'Sin resultados.' : 'No hay creadoras registradas.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleCreators.map((creator) => (
                  <AdminCreatorCard
                    key={creator.id}
                    creator={creator}
                    creatorPayouts={payoutsByCreator.get(creator.id) || []}
                    onRegisterPayout={registerPayout}
                    onCreateLink={createDiscountLink}
                    onDeleteLink={deleteDiscountLink}
                    onUpdateCommission={updateCommissionRate}
                    onGenerateClubLink={generateClubPortalLink}
                    onRevokeClubLink={revokeClubPortalLink}
                    onGenerateUploadLink={generateUploadToken}
                    onDeactivateUploadLink={deactivateUploadToken}
                    onAddToolkit={addToolkitAssignment}
                    onDeactivateToolkit={deactivateToolkitAssignment}
                    contentAssets={contentByCreator.get(creator.id) || []}
                    contentTags={contentLibrary.tags}
                    contentLoading={contentLibrary.loading}
                    contentError={contentLibrary.error}
                    onCreateContentTag={contentLibrary.createTag}
                    onDeleteContentTag={contentLibrary.deleteTag}
                    onAssignContentTag={contentLibrary.assignTag}
                    onRemoveContentTag={contentLibrary.removeTag}
                    onDownloadContentAsset={contentLibrary.downloadAsset}
                  />
                ))}
                {visibleCreatorCount < filteredCreators.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleCreatorCount((count) => count + CREATOR_PAGE_SIZE)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
                  >
                    Mostrar {Math.min(CREATOR_PAGE_SIZE, filteredCreators.length - visibleCreatorCount)} más · {visibleCreatorCount} de {filteredCreators.length}
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Contenido ── */}
        {tab === 'content' && <UgcContentLibrary library={contentLibrary} />}

        {/* ── Tab: Ranking ── */}
        {tab === 'ranking' && (
          <section>
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Período actual</p>
              <h2 className="text-gray-900 text-xl font-semibold">Ranking de comisiones</h2>
            </div>
            {rankingLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
              </div>
            ) : (
              <RankingSection ranking={rankingByCommission} />
            )}
          </section>
        )}

        {/* ── Tab: Pagos ── */}
        {tab === 'payouts' && (
          <section className="space-y-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Pagos UGC</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-950">Saldos e historial</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Revisa quién tiene saldo pendiente y consulta todos los pagos registrados.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Pendiente</p>
                    <p className="mt-1 truncate text-sm font-semibold text-emerald-800">{formatCOP(totalPendingBalance)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Con saldo</p>
                    <p className="mt-1 text-sm font-semibold text-gray-950">{creatorsWithBalance}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Pagado</p>
                    <p className="mt-1 truncate text-sm font-semibold text-gray-950">{formatCOP(totalPaidHistory)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Registros</p>
                    <p className="mt-1 text-sm font-semibold text-gray-950">{payouts.length}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
                {([
                  { id: 'pending', label: 'Saldos pendientes', count: creatorsWithBalance },
                  { id: 'history', label: 'Historial de pagos', count: payouts.length },
                ] as const).map(({ id, label, count }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPayoutsSubtab(id)}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition ${
                      payoutsSubtab === id
                        ? 'bg-white text-gray-950 shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {id === 'pending' ? <Wallet className="h-3.5 w-3.5" /> : <History className="h-3.5 w-3.5" />}
                    <span className="truncate">{label}</span>
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {payoutsSubtab === 'pending' && (
              <div className="space-y-2">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
                  </div>
                ) : pendingPayoutCreators.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center shadow-sm">
                    <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-200" />
                    <p className="text-sm font-medium text-gray-500">No hay saldos pendientes.</p>
                    <p className="mt-1 text-xs text-gray-400">Cuando una UGC acumule comisión, aparecerá aquí.</p>
                  </div>
                ) : (
                  pendingPayoutCreators.map((creator) => {
                    const link = creator.discount_link;
                    const creatorPayouts = payoutsByCreator.get(creator.id) || [];
                    return (
                      <article
                        key={creator.id}
                        className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:grid-cols-[minmax(220px,1fr)_minmax(280px,1.1fr)_auto] lg:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          {creator.avatar_url ? (
                            <img src={creator.avatar_url} alt={creator.name} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gray-200" />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 ring-1 ring-gray-200">
                              {creator.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-950">{creator.name}</p>
                            {creator.instagram_handle && (
                              <p className="truncate text-xs text-gray-400">@{creator.instagram_handle}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="rounded-xl bg-emerald-50 px-2.5 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600">Saldo</p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-emerald-800">{formatCOP(link?.pending_balance ?? 0)}</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 px-2.5 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Comisión</p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-gray-900">{formatCOP(link?.total_commission ?? 0)}</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 px-2.5 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Pagado</p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-gray-900">{formatCOP(link?.total_paid_out ?? 0)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setPayoutsCreatorId(creator.id);
                              setPayoutsSubtab('history');
                            }}
                            className="h-9 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 lg:flex-none"
                          >
                            Historial {creatorPayouts.length > 0 ? `(${creatorPayouts.length})` : ''}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPayoutCreator(creator)}
                            disabled={!link || (link.pending_balance ?? 0) <= 0}
                            className="h-9 flex-1 rounded-xl bg-gray-950 px-3 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 lg:flex-none"
                          >
                            Registrar pago
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {payoutsSubtab === 'history' && (
              <div className="space-y-3">
                {/* Creator picker */}
                <div className="relative rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowCreatorPicker((v) => !v)}
                    className="flex h-10 w-full items-center justify-between rounded-xl border border-gray-200 px-3 text-sm text-gray-900 transition-colors hover:border-gray-300"
                  >
                    <span>
                      {selectedCreator ? (
                        <span className="font-medium">{selectedCreator.name}</span>
                      ) : (
                        <span className="text-gray-500">Todas las creadoras</span>
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showCreatorPicker ? 'rotate-180' : ''}`} />
                  </button>

                  {showCreatorPicker && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={() => { setPayoutsCreatorId('all'); setShowCreatorPicker(false); }}
                        className={`w-full border-b border-gray-50 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 ${
                          payoutsCreatorId === 'all' ? 'font-semibold text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        Todas las creadoras
                        <span className="ml-2 text-xs text-gray-400">({payouts.length} pagos)</span>
                      </button>
                      {creatorsWithPayouts.map((c) => {
                        const stats = payoutStatsByCreator.get(c.id) || { count: 0, total: 0 };
                        const count = stats.count;
                        const total = stats.total;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setPayoutsCreatorId(c.id); setShowCreatorPicker(false); }}
                            className={`flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-gray-50 ${
                              payoutsCreatorId === c.id ? 'font-semibold text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="truncate">{c.name}</span>
                              {c.instagram_handle && (
                                <span className="ml-1 text-xs text-gray-400">@{c.instagram_handle}</span>
                              )}
                            </div>
                            <div className="ml-3 shrink-0 text-right">
                              <span className="text-xs font-medium text-green-600">{formatCOP(total)}</span>
                              <span className="ml-1 text-xs text-gray-400">· {count}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payout total for selected creator */}
                {selectedCreator && filteredPayouts.length > 0 && (
                  <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      {selectedCreator.avatar_url ? (
                        <img src={selectedCreator.avatar_url} alt={selectedCreator.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                          {selectedCreator.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{selectedCreator.name}</p>
                        <p className="text-xs text-gray-400">{filteredPayouts.length} pagos realizados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCOP(filteredPayouts.reduce((s, p) => s + p.amount, 0))}
                      </p>
                      <p className="text-xs text-gray-400">total pagado</p>
                    </div>
                  </div>
                )}

                {/* Payments list */}
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
                  </div>
                ) : filteredPayouts.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center shadow-sm">
                    <History className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                    <p className="text-sm text-gray-400">
                      {selectedCreator ? 'Sin pagos para esta creadora.' : 'No hay pagos registrados aún.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visiblePayouts.map((payout) => {
                      const creator = creatorsById.get(payout.creator_id);
                      return (
                        <div
                          key={payout.id}
                          className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                        >
                          {!selectedCreator && (
                            creator?.avatar_url ? (
                              <img src={creator.avatar_url} alt={creator.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                                {(creator?.name ?? '?')[0].toUpperCase()}
                              </div>
                            )
                          )}
                          <div className="min-w-0 flex-1">
                            {!selectedCreator && (
                              <p className="truncate text-sm font-medium text-gray-900">
                                {creator?.name ?? 'Desconocida'}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {new Date(payout.created_at).toLocaleDateString('es-CO', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                              <span className="ml-1 capitalize">· {payout.payout_type}</span>
                              {payout.notes ? ` · ${payout.notes}` : ''}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-green-600">
                            {formatCOP(payout.amount)}
                          </p>
                        </div>
                      );
                    })}
                    {visibleHistoryCount < filteredPayouts.length && (
                      <button
                        type="button"
                        onClick={() => setVisibleHistoryCount((count) => count + HISTORY_PAGE_SIZE)}
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
                      >
                        Mostrar {Math.min(HISTORY_PAGE_SIZE, filteredPayouts.length - visibleHistoryCount)} pagos más · {visibleHistoryCount} de {filteredPayouts.length}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}


        <div className="pb-8" />
      </main>

      {selectedPayoutCreator?.discount_link && (
        <PayoutModal
          creatorName={selectedPayoutCreator.name}
          pendingBalance={selectedPayoutCreator.discount_link.pending_balance}
          linkId={selectedPayoutCreator.discount_link.id}
          onClose={() => setSelectedPayoutCreator(null)}
          onConfirm={registerPayout}
        />
      )}

      {showResetModal && (
        <ResetPeriodModal
          currentStartDate={rankingStartedAt}
          onClose={() => setShowResetModal(false)}
          onConfirm={resetRankingPeriod}
        />
      )}
    </div>
  );
}
