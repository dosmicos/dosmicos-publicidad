import { usePublicRanking } from '@/hooks/usePublicRanking';
import RankingSection from '@/components/ugc/RankingSection';
import CreatorBalanceGate from '@/components/ugc/CreatorBalanceGate';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function UgcDashboardPage() {
  const { rankingByCommission, balancesByAmount, loading, error } = usePublicRanking('dosmicos');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-center relative">
          <img
            src="/logo-dosmicos.png"
            alt="Dosmicos"
            className="h-8 object-contain"
          />
          <Link
            to="/login"
            className="absolute right-5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
        </div>
      ) : error ? (
        <div className="max-w-lg mx-auto px-5 py-20 text-center">
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-5">
          {/* Ranking section */}
          <section className="pt-8 pb-10">
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                Período actual
              </p>
              <h2 className="text-gray-900 text-xl font-semibold">Ranking de comisiones</h2>
            </div>
            <RankingSection ranking={rankingByCommission} />
          </section>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Balances section — gated by access code (or shown to admins) */}
          <section className="pt-8 pb-16">
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                Privado
              </p>
              <h2 className="text-gray-900 text-xl font-semibold">Mi saldo acumulado</h2>
            </div>
            <CreatorBalanceGate isAdmin={!!user} adminBalances={balancesByAmount} />
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center pb-10">
        <p className="text-xs text-gray-300">Powered by Dosmicos</p>
      </footer>
    </div>
  );
}
