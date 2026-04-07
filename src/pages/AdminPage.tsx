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
  Medal,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { usePublicRanking } from '@/hooks/usePublicRanking';
import AdminCreatorCard from '@/components/ugc/AdminCreatorCard';
import ResetPeriodModal from '@/components/ugc/ResetPeriodModal';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

const MEDALS = ['🥇', '🥈', '🥉'];

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
    ? new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(rankingStartedAt))
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

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0a0a0f 0%, #0f0f16 50%, #0a0a0f 100%)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 border-b border-white/5"
        style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff5c02 0%, #ff8a3d 100%)' }}
            >
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">DosmiAds · Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Período de ranking ── */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(20,20,26,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(251,146,60,0.1)' }}
              >
                <RotateCcw className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Período de Ranking</p>
                <p className="text-gray-500 text-xs">Desde: {formattedStartDate}</p>
              </div>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              style={{ border: '1px solid rgba(251,146,60,0.25)' }}
            >
              Reiniciar Ranking
            </button>
          </div>
        </div>

        {/* ── Summary chips ── */}
        {!loading && (
          <div className="flex gap-3 flex-wrap">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-400">{creators.length} creadoras</span>
            </div>
            {creatorsWithBalance > 0 && (
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
              >
                <span className="text-green-400 font-semibold">
                  {formatCOP(totalPendingBalance)}
                </span>
                <span className="text-green-500/60">pendiente en {creatorsWithBalance} creadoras</span>
              </div>
            )}
          </div>
        )}

        {/* ── Tabs ── */}
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {([
            { id: 'creators', icon: Users, label: 'Creadoras' },
            { id: 'ranking', icon: Medal, label: 'Ranking' },
            { id: 'payouts', icon: History, label: 'Pagos' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={tab === id ? { background: 'rgba(255,92,2,0.15)', color: '#ff7a3d' } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Creadoras ── */}
        {tab === 'creators' && (
          <section className="space-y-4">
            {/* Search + filter */}
            <div className="space-y-2">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Search className="w-4 h-4 text-gray-600 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o @handle..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
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
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={
                      filter === id
                        ? { background: 'rgba(255,92,2,0.15)', color: '#ff7a3d', border: '1px solid rgba(255,92,2,0.25)' }
                        : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.06)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div
                  className="w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#ff5c02', borderTopColor: 'transparent' }}
                />
              </div>
            ) : error ? (
              <div
                className="rounded-2xl p-5 flex items-start gap-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-semibold text-sm">Error al cargar datos</p>
                  <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                  <button onClick={handleRefresh} className="text-red-400 text-xs mt-2 hover:text-red-300 underline">
                    Reintentar
                  </button>
                </div>
              </div>
            ) : filteredCreators.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {search || filter !== 'all' ? 'No hay resultados.' : 'No hay creadoras registradas.'}
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
            {rankingLoading ? (
              <div className="flex justify-center py-20">
                <div
                  className="w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#ff5c02', borderTopColor: 'transparent' }}
                />
              </div>
            ) : rankingByCommission.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aún no hay creadoras con link activo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankingByCommission.map((entry) => {
                  const hasActivity = entry.commission_in_period > 0;
                  const isTop3 = hasActivity && entry.rank <= 3;
                  return (
                    <div
                      key={entry.instagram_handle || entry.creator_name}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3"
                      style={{
                        background: entry.rank === 1 && hasActivity
                          ? 'rgba(255,92,2,0.06)'
                          : 'rgba(255,255,255,0.03)',
                        border: entry.rank === 1 && hasActivity
                          ? '1px solid rgba(255,92,2,0.15)'
                          : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {/* Position */}
                      <div className="w-7 text-center shrink-0">
                        {isTop3 ? (
                          <span className="text-lg leading-none">{MEDALS[entry.rank - 1]}</span>
                        ) : hasActivity ? (
                          <span className="text-xs font-medium text-gray-500">#{entry.rank}</span>
                        ) : (
                          <span className="text-xs text-gray-700">—</span>
                        )}
                      </div>

                      {/* Avatar */}
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.creator_name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: 'rgba(255,92,2,0.1)', color: '#ff5c02' }}
                        >
                          {entry.creator_name?.[0]?.toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{entry.creator_name}</p>
                        {entry.instagram_handle && (
                          <p className="text-gray-600 text-xs truncate">@{entry.instagram_handle}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {hasActivity ? (
                          <>
                            <p className="text-orange-400 text-sm font-semibold">
                              {formatCOP(entry.commission_in_period)}
                            </p>
                            <p className="text-gray-600 text-xs">{entry.orders_in_period} compras</p>
                          </>
                        ) : (
                          <p className="text-gray-700 text-xs">0 compras</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Pagos ── */}
        {tab === 'payouts' && (
          <section>
            {loading ? (
              <div className="flex justify-center py-20">
                <div
                  className="w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#ff5c02', borderTopColor: 'transparent' }}
                />
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No hay pagos registrados aún.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payouts.map((payout) => {
                  const creator = creators.find((c) => c.id === payout.creator_id);
                  return (
                    <div
                      key={payout.id}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3"
                      style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}
                    >
                      {creator?.avatar_url ? (
                        <img
                          src={creator.avatar_url}
                          alt={creator.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: 'rgba(255,92,2,0.1)', color: '#ff5c02' }}
                        >
                          {(creator?.name ?? '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {creator?.name ?? 'Desconocida'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {new Date(payout.created_at).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {payout.notes ? ` · ${payout.notes}` : ''}
                        </p>
                      </div>
                      <p className="text-green-400 text-sm font-semibold shrink-0">
                        {formatCOP(payout.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
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
