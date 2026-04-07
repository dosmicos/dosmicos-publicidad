import type { RankingEntry } from '@/hooks/usePublicRanking';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

const MEDALS = ['🥇', '🥈', '🥉'];

function Avatar({ url, name, size = 'sm' }: { url: string | null; name: string; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  if (url) {
    return <img src={url} alt={name} className={`${dim} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-medium shrink-0 bg-gray-100 text-gray-600`}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function RankingSection({ ranking }: { ranking: RankingEntry[] }) {
  if (ranking.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-2xl mb-3">🏁</p>
        <p className="text-gray-900 font-medium text-sm">Sin datos aún</p>
        <p className="text-gray-400 text-xs mt-1">El ranking se actualizará con las primeras compras.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ranking.map((entry, i) => {
        const isTop3 = entry.rank <= 3;
        const medal = MEDALS[entry.rank - 1];

        return (
          <div
            key={entry.instagram_handle || entry.creator_name}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
              entry.rank === 1
                ? 'bg-gray-50 border border-gray-200'
                : 'border border-gray-100'
            }`}
          >
            {/* Position */}
            <div className="w-7 text-center shrink-0">
              {isTop3 ? (
                <span className="text-lg leading-none">{medal}</span>
              ) : (
                <span className="text-xs font-medium text-gray-400">#{entry.rank}</span>
              )}
            </div>

            <Avatar url={entry.avatar_url} name={entry.creator_name} size={entry.rank === 1 ? 'md' : 'sm'} />

            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-medium truncate">{entry.creator_name}</p>
              {entry.instagram_handle && (
                <p className="text-gray-400 text-xs truncate">@{entry.instagram_handle}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-gray-900 text-sm font-semibold">
                {formatCOP(entry.commission_in_period)}
              </p>
              <p className="text-gray-400 text-xs">{entry.orders_in_period} pedidos</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
