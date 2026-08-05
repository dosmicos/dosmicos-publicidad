import { useState } from 'react';

import type { RankingEntry } from '@/hooks/usePublicRanking';
import type { RankingMetric } from '@/hooks/useRankingPeriods';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

const MEDALS = ['🥇', '🥈', '🥉'];

function Avatar({ url, name, size = 'sm' }: { url: string | null; name: string; size?: 'sm' | 'md' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const dim = size === 'md' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?';
  const hasValidUrl = Boolean(url?.trim()) && !imageFailed;

  if (hasValidUrl) {
    return (
      <img
        src={url ?? undefined}
        alt={name}
        className={`${dim} rounded-full object-cover shrink-0 bg-gray-100`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-medium shrink-0 bg-gray-100 text-gray-600`}>
      {initial}
    </div>
  );
}

interface RankingSectionProps {
  ranking: RankingEntry[];
  metric?: RankingMetric;
}

const pointsLabel = (points: number) =>
  `${points} ${points === 1 ? 'punto' : 'puntos'}`;

const contentLabel = (count: number) =>
  `${count} ${count === 1 ? 'pieza que clasifica' : 'piezas que clasifican'}`;

export default function RankingSection({ ranking, metric = 'commission' }: RankingSectionProps) {
  if (ranking.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-2xl mb-3">🏁</p>
        <p className="text-gray-900 font-medium text-sm">Sin datos aún</p>
        <p className="text-gray-400 text-xs mt-1">
          {metric === 'content'
            ? 'El ranking se actualizará cuando una foto o un video clasifique.'
            : 'El ranking se actualizará con las primeras compras.'}
        </p>
      </div>
    );
  }

  const getMetricValue = (entry: RankingEntry) => (
    metric === 'content' ? entry.content_points : entry.commission_in_period
  );
  const hasActivity = ranking.some((entry) => getMetricValue(entry) > 0);

  // No activity yet — show profiles without rank
  if (!hasActivity) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-400 text-center mb-4">
          {metric === 'content'
            ? 'Aún no hay puntos en este período. Foto que clasifica: 1; video que clasifica: 3.'
            : 'Aún no hay compras registradas en este período. ¡Tú puedes ser la primera! 🚀'}
        </p>
        {ranking.map((entry) => (
          <div
            key={entry.instagram_handle || entry.creator_name}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-gray-100"
          >
            <Avatar url={entry.avatar_url} name={entry.creator_name} />
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-medium truncate">{entry.creator_name}</p>
              {entry.instagram_handle && (
                <p className="text-gray-400 text-xs truncate">@{entry.instagram_handle}</p>
              )}
            </div>
            <p className="text-gray-300 text-xs shrink-0">
              {metric === 'content' ? pointsLabel(0) : '0 compras'}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Has activity — show full ranking with medals
  return (
    <div className="space-y-2">
      {ranking.map((entry) => {
        const metricValue = getMetricValue(entry);
        const isTop3 = entry.rank <= 3 && metricValue > 0;
        const medal = MEDALS[entry.rank - 1];

        return (
          <div
            key={entry.instagram_handle || entry.creator_name}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
              entry.rank === 1 && metricValue > 0
                ? 'bg-gray-50 border border-gray-200'
                : 'border border-gray-100'
            }`}
          >
            {/* Position */}
            <div className="w-7 text-center shrink-0">
              {isTop3 ? (
                <span className="text-lg leading-none">{medal}</span>
              ) : metricValue > 0 ? (
                <span className="text-xs font-medium text-gray-400">#{entry.rank}</span>
              ) : (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>

            <Avatar url={entry.avatar_url} name={entry.creator_name} size={entry.rank === 1 && metricValue > 0 ? 'md' : 'sm'} />

            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-medium truncate">{entry.creator_name}</p>
              {entry.instagram_handle && (
                <p className="text-gray-400 text-xs truncate">@{entry.instagram_handle}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              {metricValue > 0 ? (
                <>
                  <p className="text-gray-900 text-sm font-semibold">
                    {metric === 'content'
                      ? pointsLabel(entry.content_points)
                      : formatCOP(entry.commission_in_period)}
                  </p>
                  {metric === 'content' ? (
                    <p className="text-gray-400 text-xs">{contentLabel(entry.eligible_content_count)}</p>
                  ) : (
                    <p className="text-gray-400 text-xs">{entry.orders_in_period} compras</p>
                  )}
                </>
              ) : (
                <p className="text-gray-300 text-xs">
                  {metric === 'content' ? pointsLabel(0) : '0 compras'}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
