import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Wallet, ShoppingBag, TrendingUp, Search, Link2, Copy, Check } from 'lucide-react';

interface CreatorStats {
  creator_name: string;
  instagram_handle: string;
  avatar_url: string;
  orders_in_period: number;
  commission_in_period: number;
  pending_balance: number;
  rank: number;
}

const ORG_SLUG = 'dosmicos';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

export default function CreatorPortalPage() {
  const [handle, setHandle] = useState('');
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;
    setLoading(true);
    setError('');
    setStats(null);

    try {
      const clean = handle.replace('@', '').trim().toLowerCase();
      const { data, error: rpcError } = await (supabase as any).rpc('get_ugc_public_ranking', { p_org_slug: ORG_SLUG });
      if (rpcError) throw rpcError;

      const all: CreatorStats[] = data || [];
      const found = all.find(
        (c) => c.instagram_handle?.toLowerCase() === clean || c.creator_name?.toLowerCase() === clean
      );

      if (!found) {
        setError(`No encontramos un creator con el handle @${clean}. Verifica que sea correcto.`);
      } else {
        setStats(found);
      }
    } catch (err: any) {
      setError('Error al buscar. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const creatorLink = stats ? `https://ads.dosmicos.com/ugc/` : '';

  const handleCopyLink = () => {
    if (creatorLink) {
      navigator.clipboard.writeText(creatorLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const rankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-12">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #ff5c02 0%, #ff8a3d 100%)' }}>
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Mi Portal Creator</h1>
          <p className="text-gray-400 text-sm">Consulta tus comisiones y estadísticas</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="space-y-3 mb-8">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="tu_instagram"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !handle.trim()}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #ff5c02 0%, #ff7a2e 100%)' }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Search className="w-4 h-4" /> Ver mis stats</>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                {stats.avatar_url ? (
                  <img src={stats.avatar_url} alt={stats.creator_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-orange-500" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-orange-400 border-2 border-orange-500"
                    style={{ background: 'rgba(255,92,2,0.1)' }}>
                    {stats.creator_name?.[0]}
                  </div>
                )}
                <div>
                  <p className="text-white font-bold">{stats.creator_name}</p>
                  <p className="text-gray-400 text-sm">@{stats.instagram_handle}</p>
                </div>
                <div className="ml-auto text-2xl font-bold">
                  {typeof stats.rank === 'number' ? rankEmoji(stats.rank) : ''}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/60 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs flex items-center justify-center gap-1 mb-1">
                    <ShoppingBag className="w-3 h-3" /> Pedidos
                  </p>
                  <p className="text-white text-xl font-bold">{stats.orders_in_period}</p>
                </div>
                <div className="bg-gray-900/60 rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs flex items-center justify-center gap-1 mb-1">
                    <Trophy className="w-3 h-3 text-yellow-400" /> Posición
                  </p>
                  <p className="text-white text-xl font-bold">#{stats.rank}</p>
                </div>
              </div>
            </div>

            {/* Commission card */}
            <div className="rounded-2xl p-5 border border-yellow-400/20"
              style={{ background: 'rgba(255,196,0,0.05)' }}>
              <p className="text-yellow-400/70 text-xs font-medium mb-1">Comisiones del período</p>
              <p className="text-yellow-400 text-3xl font-bold">{formatCOP(stats.commission_in_period)}</p>
            </div>

            {/* Balance card */}
            {stats.pending_balance > 0 && (
              <div className="rounded-2xl p-5 border border-green-400/20"
                style={{ background: 'rgba(34,197,94,0.05)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <p className="text-green-400/70 text-xs font-medium">Saldo disponible para cobro</p>
                </div>
                <p className="text-green-400 text-2xl font-bold">{formatCOP(stats.pending_balance)}</p>
                <p className="text-gray-600 text-xs mt-1">Habla con el equipo de Dosmicos para hacer efectivo tu pago</p>
              </div>
            )}

            {/* Share */}
            <div className="text-center pt-2">
              <a href="/ranking" className="text-orange-400 text-sm hover:text-orange-300 transition-colors">
                Ver ranking completo →
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs mt-10">Dosmicos · Portal de Creators</p>
      </div>
    </div>
  );
}
