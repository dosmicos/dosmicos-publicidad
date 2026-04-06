import { Trophy, Medal, Award, Share2, Check, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import type { RankingEntry } from '@/hooks/usePublicRanking';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
};

function Avatar({
  url,
  name,
  size = 'md',
  borderColor,
}: {
  url: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  borderColor?: string;
}) {
  const dim = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'md' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
  const border = borderColor ? `border-2` : '';
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${dim} rounded-full object-cover ${border}`}
        style={borderColor ? { borderColor } : undefined}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold ${border}`}
      style={{
        background: 'rgba(255,92,2,0.1)',
        color: '#ff5c02',
        ...(borderColor ? { borderColor } : {}),
      }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function RankingSection({ ranking }: { ranking: RankingEntry[] }) {
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  const handleShare = (entry: RankingEntry) => {
    const text = `¡Estoy en el puesto #${entry.rank} del ranking de Dosmicos con ${formatCOP(entry.commission_in_period)} en comisiones! 🏆`;
    if (navigator.share) {
      navigator.share({ text, url: window.location.href }).catch(() => null);
    } else {
      navigator.clipboard.writeText(text);
      setCopiedHandle(entry.instagram_handle);
      setTimeout(() => setCopiedHandle(null), 2000);
    }
  };

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  if (ranking.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-8 w-8 text-yellow-400/50" />
        </div>
        <p className="text-white font-semibold text-lg mb-1">El ranking está vacío</p>
        <p className="text-gray-500 text-sm">Aún no hay comisiones registradas para este período.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3">
          {/* 2nd */}
          {top3[1] && (
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[130px]">
              <div className="relative">
                <Avatar url={top3[1].avatar_url} name={top3[1].creator_name} size="md" borderColor="#9ca3af" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                  <Medal className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
              <div className="w-full bg-gray-700/60 rounded-t-lg pt-3 pb-2 px-2 text-center" style={{ height: 80 }}>
                <p className="text-white text-xs font-semibold truncate">{top3[1].creator_name}</p>
                <p className="text-yellow-400 text-xs font-bold">{formatCOP(top3[1].commission_in_period)}</p>
              </div>
            </div>
          )}

          {/* 1st */}
          {top3[0] && (
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[150px]">
              <div className="relative">
                <Avatar url={top3[0].avatar_url} name={top3[0].creator_name} size="lg" borderColor="#facc15" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                </div>
              </div>
              <div
                className="w-full rounded-t-lg pt-3 pb-2 px-2 text-center border border-yellow-400/30"
                style={{ height: 100, background: 'rgba(250,204,21,0.06)' }}
              >
                <p className="text-white text-sm font-bold truncate">{top3[0].creator_name}</p>
                <p className="text-yellow-400 text-sm font-bold">{formatCOP(top3[0].commission_in_period)}</p>
                <p className="text-gray-500 text-xs">{top3[0].orders_in_period} pedidos</p>
              </div>
            </div>
          )}

          {/* 3rd */}
          {top3[2] && (
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[130px]">
              <div className="relative">
                <Avatar url={top3[2].avatar_url} name={top3[2].creator_name} size="sm" borderColor="#b45309" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                  <Award className="h-3 w-3 text-amber-700" />
                </div>
              </div>
              <div className="w-full bg-gray-800/60 rounded-t-lg pt-3 pb-2 px-2 text-center" style={{ height: 65 }}>
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
          <div
            key={entry.instagram_handle || entry.creator_name}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              entry.rank === 1
                ? 'border border-yellow-400/30'
                : entry.rank <= 3
                ? 'border border-gray-700'
                : 'border border-gray-800/50'
            }`}
            style={{
              background:
                entry.rank === 1
                  ? 'rgba(250,204,21,0.05)'
                  : entry.rank <= 3
                  ? 'rgba(30,30,35,0.8)'
                  : 'rgba(20,20,24,0.5)',
            }}
          >
            <div className="w-8 flex justify-center shrink-0">
              <RankIcon rank={entry.rank} />
            </div>

            <Avatar url={entry.avatar_url} name={entry.creator_name} size="sm" />

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{entry.creator_name}</p>
              {entry.instagram_handle && (
                <p className="text-gray-500 text-xs">@{entry.instagram_handle}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-yellow-400 text-sm font-bold">{formatCOP(entry.commission_in_period)}</p>
              <p className="text-gray-600 text-xs flex items-center justify-end gap-1">
                <ShoppingBag className="h-3 w-3" />
                {entry.orders_in_period}
              </p>
            </div>

            <button
              onClick={() => handleShare(entry)}
              className="ml-1 p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-600 hover:text-gray-300 shrink-0"
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
    </div>
  );
}
