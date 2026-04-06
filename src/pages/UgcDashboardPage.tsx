import { Trophy, Wallet, Settings } from 'lucide-react';
import { usePublicRanking } from '@/hooks/usePublicRanking';
import RankingSection from '@/components/ugc/RankingSection';
import BalancesSection from '@/components/ugc/BalancesSection';
import { Link } from 'react-router-dom';

export default function UgcDashboardPage() {
  const { rankingByCommission, balancesByAmount, loading, error } = usePublicRanking('dosmicos');

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0a0a0f 0%, #0f0f16 50%, #0a0a0f 100%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5" style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff5c02 0%, #ff8a3d 100%)' }}
            >
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">DosmiAds · UGC</span>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            Admin
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#ff5c02', borderTopColor: 'transparent' }}
          />
        </div>
      ) : error ? (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : (
        <>
          {/* ── Sección 1: Ranking del período ── */}
          <section className="max-w-2xl mx-auto px-4 pt-10 pb-16">
            <div className="flex items-center gap-3 mb-7">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(250,204,21,0.1)' }}
              >
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-white text-lg font-bold leading-tight">Ranking del Período</h2>
                <p className="text-gray-500 text-xs">Comisiones acumuladas · período actual</p>
              </div>
            </div>
            <RankingSection ranking={rankingByCommission} />
          </section>

          {/* Divider */}
          <div className="max-w-2xl mx-auto px-4">
            <div className="border-t border-white/5" />
          </div>

          {/* ── Sección 2: Saldos acumulados ── */}
          <section className="max-w-2xl mx-auto px-4 pt-10 pb-20">
            <div className="flex items-center gap-3 mb-7">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(34,197,94,0.1)' }}
              >
                <Wallet className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-white text-lg font-bold leading-tight">Saldos Acumulados</h2>
                <p className="text-gray-500 text-xs">Comisiones pendientes de pago</p>
              </div>
            </div>
            <BalancesSection balances={balancesByAmount} />
          </section>
        </>
      )}

      <footer className="text-center pb-8">
        <p className="text-gray-700 text-xs">Dosmicos · Las comisiones se actualizan con cada compra</p>
      </footer>
    </div>
  );
}
