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
type CreatorFilter = 'all' | 'with_balance' | 'no_link';

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
    if (filter === 'no_link') return !c.discount_link;
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
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

      <main className="max-w-lg mx-auto px-5 py-6 space-y-5">

        {/* Período de ranking */}
        <div className="rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">Período de Ranking</p>
                <p className="text-gray-400 text-xs">Desde: {formattedStartDate}</p>
              </div>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Reiniciar
            </button>
          </div>
        </div>

        {/* Summary chips */}
        {!loading && (
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 bg-gray-50 border border-gray-100 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />
              {creators.length} creadoras
            </div>
            {creatorsWithBalance > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 bg-green-50 border border-green-100 text-xs">
                <span className="text-green-700 font-semibold">{formatCOP(totalPendingBalance)}</span>
                <span className="text-green-500">pendiente · {creatorsWithBalance} creadoras</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([
            { id: 'creators', icon: Users, label: 'Creadoras' },
            { id: 'ranking', icon: Trophy, label: 'Ranking' },
            { id: 'payouts', icon: History, label: 'Pagos' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                tab === id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Creadoras ── */}
        {tab === 'creators' && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o @handle..."
                className="flex-1 bg-transparent text-gray-900 text-sm placeholder-gray-400 outline-none"
              />
            </div>
            <div className="flex gap-2">
              {([
                { id: 'all', label: 'Todas' },
                { id: 'with_balance', label: 'Con saldo' },
                { id: 'no_link', label: 'Sin link' },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filter === id
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
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
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredCreators.map((creator) => (
                  <AdminCreatorCard
                    key={creator.id}
                    creator={creator}
                    creatorPayouts={payouts.filter((p) => p.creator_id === creator.id)}
                    onRegisterPayout={registerPayout}
                    onCreateLink={createDiscountLink}
                    onDeleteLink={deleteDiscountLink}
                    onUpdateCommission={updateCommissionRate}
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
