import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RotateCcw, Users, Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import AdminCreatorCard from '@/components/ugc/AdminCreatorCard';
import ResetPeriodModal from '@/components/ugc/ResetPeriodModal';

export default function AdminPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const {
    creators,
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

  const [showResetModal, setShowResetModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* ── Control de período ── */}
        <section>
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(20,20,26,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
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
        </section>

        {/* ── Lista de creators ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-500" />
            <h2 className="text-white font-semibold">Creadoras de Contenido</h2>
            {!loading && (
              <span
                className="text-xs px-2 py-0.5 rounded-full text-gray-500"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {creators.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
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
                <button
                  onClick={handleRefresh}
                  className="text-red-400 text-xs mt-2 hover:text-red-300 underline"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay creadoras registradas.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {creators.map((creator) => (
                <AdminCreatorCard
                  key={creator.id}
                  creator={creator}
                  onRegisterPayout={registerPayout}
                  onCreateLink={createDiscountLink}
                  onDeleteLink={deleteDiscountLink}
                  onUpdateCommission={updateCommissionRate}
                />
              ))}
            </div>
          )}
        </section>
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
