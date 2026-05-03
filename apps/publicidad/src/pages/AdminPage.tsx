import { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { usePublicRanking } from '@/hooks/usePublicRanking';
import AdminCreatorCard from '@/components/ugc/AdminCreatorCard';
import ResetPeriodModal from '@/components/ugc/ResetPeriodModal';
import RankingSection from '@/components/ugc/RankingSection';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

type Tab = 'creators' | 'ranking' | 'payouts';
type CreatorFilter = 'all' | 'with_balance' | 'with_link' | 'no_link' | 'no_club' | 'no_upload';

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
  const [payoutsCreatorId, setPayoutsCreatorId] = useState<string>('all');
  const [showCreatorPicker, setShowCreatorPicker] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formattedStartDate = rankingStartedAt
    ? new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(rankingStartedAt))
    : '—';

  const filteredCreators = creators.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.instagram_handle || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'with_balance') return (c.discount_link?.pending_balance ?? 0) > 0;
    if (filter === 'with_link') return !!c.discount_link;
    if (filter === 'no_link') return !c.discount_link;
    if (filter === 'no_club') return !c.portal_link;
    if (filter === 'no_upload') return !c.upload_token;
    return true;
  });

  const totalPendingBalance = creators.reduce(
    (sum, c) => sum + (c.discount_link?.pending_balance ?? 0),
    0
  );
  const creatorsWithBalance = creators.filter((c) => (c.discount_link?.pending_balance ?? 0) > 0).length;

  // Payouts tab: filtered by selected creator
  const creatorsWithPayouts = creators.filter((c) => payouts.some((p) => p.creator_id === c.id));
  const filteredPayouts = payoutsCreatorId === 'all'
    ? payouts
    : payouts.filter((p) => p.creator_id === payoutsCreatorId);
  const selectedCreator = payoutsCreatorId !== 'all'
    ? creators.find((c) => c.id === payoutsCreatorId)
    : null;

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">

        <section className="mb-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Panel UGC</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">Administrar creadoras</h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
                  Crea links de descuento para clientes y links Club/upload para las UGC sin confundirte.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reiniciar ranking
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <RotateCcw className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-wide">Ranking desde</p>
              </div>
              <p className="mt-2 text-lg font-black text-gray-950">{formattedStartDate}</p>
            </div>
            {!loading && (
              <>
                <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase tracking-wide">Creadoras</p>
                  </div>
                  <p className="mt-2 text-lg font-black text-gray-950">{creators.length}</p>
                </div>
                <div className="rounded-[24px] border border-green-100 bg-green-50 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-green-600">Pendiente por pagar</p>
                  <p className="mt-2 text-lg font-black text-green-800">{formatCOP(totalPendingBalance)}</p>
                  <p className="text-xs font-medium text-green-600">{creatorsWithBalance} creadora{creatorsWithBalance === 1 ? '' : 's'}</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className="mb-5 grid grid-cols-3 rounded-3xl border border-gray-200 bg-white p-1 shadow-sm">
          {([
            { id: 'creators', icon: Users, label: 'Creadoras' },
            { id: 'ranking', icon: Trophy, label: 'Ranking' },
            { id: 'payouts', icon: History, label: 'Pagos' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-2xl text-sm font-black transition-colors ${
                tab === id
                  ? 'bg-gray-950 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Creadoras ── */}
        {tab === 'creators' && (
          <section className="space-y-4">
            <div className="rounded-[28px] border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center">
                <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5">
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
                      className={`min-h-10 shrink-0 rounded-2xl border px-3 py-2 text-xs font-black transition-all ${
                        filter === id
                          ? 'border-gray-950 bg-gray-950 text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
                  {search || filter !== 'all' ? 'Sin resultados.' : 'No hay creadoras registradas.'}
                </p>
              </div>
            ) : (
              <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCreators.map((creator) => (
                  <AdminCreatorCard
                    key={creator.id}
                    creator={creator}
                    creatorPayouts={payouts.filter((p) => p.creator_id === creator.id)}
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
                  />
                ))}
              </div>
            )}
          </section>
        )}

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
          <section className="space-y-4">
            {/* Creator picker */}
            <div className="relative">
              <button
                onClick={() => setShowCreatorPicker((v) => !v)}
                className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 hover:border-gray-300 transition-colors"
              >
                <span>
                  {selectedCreator ? (
                    <span className="font-medium">{selectedCreator.name}</span>
                  ) : (
                    <span className="text-gray-500">Todas las creadoras</span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCreatorPicker ? 'rotate-180' : ''}`} />
              </button>

              {showCreatorPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-lg z-10 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setPayoutsCreatorId('all'); setShowCreatorPicker(false); }}
                    className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      payoutsCreatorId === 'all' ? 'font-semibold text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    Todas las creadoras
                    <span className="ml-2 text-xs text-gray-400">({payouts.length} pagos)</span>
                  </button>
                  {creatorsWithPayouts.map((c) => {
                    const count = payouts.filter((p) => p.creator_id === c.id).length;
                    const total = payouts
                      .filter((p) => p.creator_id === c.id)
                      .reduce((sum, p) => sum + p.amount, 0);
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setPayoutsCreatorId(c.id); setShowCreatorPicker(false); }}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          payoutsCreatorId === c.id ? 'font-semibold text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        <div>
                          <span>{c.name}</span>
                          {c.instagram_handle && (
                            <span className="text-gray-400 text-xs ml-1">@{c.instagram_handle}</span>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-green-600 text-xs font-medium">{formatCOP(total)}</span>
                          <span className="text-gray-400 text-xs ml-1">· {count}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payout total for selected creator */}
            {selectedCreator && filteredPayouts.length > 0 && (
              <div className="rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedCreator.avatar_url ? (
                    <img src={selectedCreator.avatar_url} alt={selectedCreator.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                      {selectedCreator.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">{selectedCreator.name}</p>
                    <p className="text-gray-400 text-xs">{filteredPayouts.length} pagos realizados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-semibold text-sm">
                    {formatCOP(filteredPayouts.reduce((s, p) => s + p.amount, 0))}
                  </p>
                  <p className="text-gray-400 text-xs">total pagado</p>
                </div>
              </div>
            )}

            {/* Payments list */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
              </div>
            ) : filteredPayouts.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {selectedCreator ? 'Sin pagos para esta creadora.' : 'No hay pagos registrados aún.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPayouts.map((payout) => {
                  const creator = creators.find((c) => c.id === payout.creator_id);
                  return (
                    <div
                      key={payout.id}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3"
                    >
                      {!selectedCreator && (
                        <>
                          {creator?.avatar_url ? (
                            <img src={creator.avatar_url} alt={creator.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                              {(creator?.name ?? '?')[0].toUpperCase()}
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex-1 min-w-0">
                        {!selectedCreator && (
                          <p className="text-gray-900 text-sm font-medium truncate">
                            {creator?.name ?? 'Desconocida'}
                          </p>
                        )}
                        <p className={`text-gray-400 text-xs ${selectedCreator ? '' : ''}`}>
                          {new Date(payout.created_at).toLocaleDateString('es-CO', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          <span className="capitalize ml-1">· {payout.payout_type}</span>
                          {payout.notes ? ` · ${payout.notes}` : ''}
                        </p>
                      </div>
                      <p className="text-green-600 text-sm font-semibold shrink-0">
                        {formatCOP(payout.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="pb-8" />
      </main>

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
