import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award, Copy, Check, Share2, Wallet } from 'lucide-react';

interface RankingEntry {
  creator_name: string;
  instagram_handle: string;
  avatar_url: string;
  orders_in_period: number;
  commission_in_period: number;
  pending_balance: number;
  rank: number;
}

const ORG_SLUG = 'dosmicos'; // slug de la organización en Supabase

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze
const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="h-5 w-5" style={{ color: rankColors[0] }} />;
  if (rank === 2) return <Medal className="h-5 w-5" style={{ color: rankColors[1] }} />;
  if (rank === 3) return <Award className="h-5 w-5" style={{ color: rankColors[2] }} />;
  return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
};

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const { data, error } = await (supabase as any).rpc('get_ugc_public_ranking', { p_org_slug: ORG_SLUG });
        if (error) throw error;
        setRanking(data || []);
      } catch (err) {
        console.error('Error loading ranking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  const handleShare = (entry: RankingEntry) => {
    const text = `¡Estoy en el puesto #${entry.rank} del ranking de Dosmicos con ${formatCOP(entry.commission_in_period)} en comisiones! 🏆 @dosmicos_co`;
    if (navigator.share) {
      navigator.share({ text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      setCopiedHandle(entry.instagram_handle);
      setTimeout(() => setCopiedHandle(null), 2000);
    }
  };

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="text-center pt-12 pb-8 px-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Ranking de Creators</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Comisiones acumuladas del período actual · Dosmicos
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-yellow-400/60" />
            </div>
            <p className="text-white font-semibold text-lg mb-1">El ranking está vacío</p>
            <p className="text-gray-400 text-sm">Aún no hay comisiones registradas para este período.</p>
            <p className="text-gray-600 text-xs mt-3">Las posiciones aparecerán aquí cuando haya compras con link de creator.</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-4">
                {/* 2nd place */}
                {top3[1] && (
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                    <div className="relative">
                      {top3[1].avatar_url ? (
                        <img src={top3[1].avatar_url} alt={top3[1].creator_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-400" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-300 border-2 border-gray-400">
                          {top3[1].creator_name[0]}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                        <Medal className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-t-lg pt-4 pb-3 px-2 text-center"
                      style={{ height: '80px' }}>
                      <p className="text-white text-xs font-semibold truncate">{top3[1].creator_name}</p>
                      <p className="text-yellow-400 text-xs font-bold">{formatCOP(top3[1].commission_in_period)}</p>
                    </div>
                  </div>
                )}

                {/* 1st place */}
                {top3[0] && (
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                    <div className="relative">
                      {top3[0].avatar_url ? (
                        <img src={top3[0].avatar_url} alt={top3[0].creator_name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400 ring-2 ring-yellow-400/30" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-yellow-400 border-4 border-yellow-400">
                          {top3[0].creator_name[0]}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                      </div>
                    </div>
                    <div className="w-full bg-yellow-400/10 border border-yellow-400/30 rounded-t-lg pt-4 pb-3 px-2 text-center"
                      style={{ height: '100px' }}>
                      <p className="text-white text-sm font-bold truncate">{top3[0].creator_name}</p>
                      <p className="text-yellow-400 text-sm font-bold">{formatCOP(top3[0].commission_in_period)}</p>
                      <p className="text-gray-500 text-xs">{top3[0].orders_in_period} pedidos</p>
                    </div>
                  </div>
                )}

                {/* 3rd place */}
                {top3[2] && (
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
                    <div className="relative">
                      {top3[2].avatar_url ? (
                        <img src={top3[2].avatar_url} alt={top3[2].creator_name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-amber-700" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-amber-700 border-2 border-amber-700">
                          {top3[2].creator_name[0]}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                        <Award className="h-3 w-3 text-amber-700" />
                      </div>
                    </div>
                    <div className="w-full bg-gray-800 rounded-t-lg pt-4 pb-3 px-2 text-center"
                      style={{ height: '65px' }}>
                      <p className="text-white text-xs font-semibold truncate">{top3[2].creator_name}</p>
                      <p className="text-yellow-400 text-xs font-bold">{formatCOP(top3[2].commission_in_period)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Full list */}
            <div className="space-y-2">
              {ranking.map((entry) => (
                <div key={entry.instagram_handle || entry.creator_name}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    entry.rank === 1
                      ? 'bg-yellow-400/10 border border-yellow-400/30'
                      : entry.rank <= 3
                        ? 'bg-gray-800/80 border border-gray-700'
                        : 'bg-gray-800/50 border border-gray-800'
                  }`}>
                  <div className="w-8 flex justify-center">
                    <RankIcon rank={entry.rank} />
                  </div>

                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt={entry.creator_name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-400">
                      {entry.creator_name[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{entry.creator_name}</p>
                    {entry.instagram_handle && (
                      <p className="text-gray-500 text-xs">@{entry.instagram_handle}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-yellow-400 text-sm font-bold">{formatCOP(entry.commission_in_period)}</p>
                    <p className="text-gray-600 text-xs">{entry.orders_in_period} pedidos</p>
                    {entry.pending_balance > 0 && (
                      <p className="text-green-400 text-xs flex items-center justify-end gap-0.5 mt-0.5">
                        <Wallet className="h-3 w-3" /> {formatCOP(entry.pending_balance)}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleShare(entry)}
                    className="ml-1 p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-500 hover:text-gray-300"
                    title="Compartir posición"
                  >
                    {copiedHandle === entry.instagram_handle ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-center space-y-1 pt-4">
          <p className="text-gray-700 text-xs">
            Dosmicos · Las comisiones se actualizan en tiempo real con cada compra
          </p>
          <p className="text-gray-700 text-xs flex items-center justify-center gap-1">
            <Wallet className="h-3 w-3 text-green-400" />
            <span className="text-green-500">Saldo disponible</span>
            <span className="text-gray-600">· Acumulado pendiente de pago</span>
          </p>
        </div>
      </div>
    </div>
  );
}
