import { useState } from 'react';

import RankingSection from '@/components/ugc/RankingSection';
import type { RankingEntry } from '@/hooks/usePublicRanking';
import type { RankingMetric } from '@/hooks/useRankingPeriods';

const RANKINGS: { metric: RankingMetric; tab: string; title: string; hint: string }[] = [
  {
    metric: 'commission',
    tab: 'Comisiones',
    title: 'Ranking de comisiones',
    hint: 'Comisión de las compras hechas con tu link en el período.',
  },
  {
    metric: 'content',
    tab: 'Contenido',
    title: 'Ranking de contenido',
    hint: 'Foto que clasifica: 1 punto · video que clasifica: 3 puntos.',
  },
];

/** Filas mínimas de cada ranking cuando van uno debajo del otro (antes de "Ver las N participantes"). */
const STACKED_COLLAPSED_LIMIT = 10;

interface DualRankingSectionProps {
  rankingByCommission: RankingEntry[];
  rankingByContent: RankingEntry[];
  loading?: boolean;
  commissionError?: string | null;
  contentError?: string | null;
  /** Texto pequeño sobre los títulos (p. ej. "Período actual"). */
  eyebrow?: string;
  /**
   * 'side-by-side': en pantallas anchas los dos rankings van lado a lado (en el celular, pestañas).
   * 'stacked': los dos siempre visibles, uno debajo del otro, sin pestañas (para contenedores angostos).
   */
  layout?: 'side-by-side' | 'stacked';
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
    </div>
  );
}

/** Los dos rankings públicos del Club: comisiones y contenido. */
export default function DualRankingSection({
  rankingByCommission,
  rankingByContent,
  loading = false,
  commissionError = null,
  contentError = null,
  eyebrow = 'Período actual',
  layout = 'side-by-side',
}: DualRankingSectionProps) {
  const [active, setActive] = useState<RankingMetric>('commission');
  const stacked = layout === 'stacked';

  const rows = { commission: rankingByCommission, content: rankingByContent };
  const errors = { commission: commissionError, content: contentError };

  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">{eyebrow}</p>

      {!stacked && (
        <div
          role="tablist"
          aria-label="Elegir ranking"
          className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 mb-6 md:hidden"
        >
          {RANKINGS.map((ranking) => (
            <button
              key={ranking.metric}
              type="button"
              role="tab"
              aria-selected={active === ranking.metric}
              onClick={() => setActive(ranking.metric)}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                active === ranking.metric
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {ranking.tab}
            </button>
          ))}
        </div>
      )}

      <div className={stacked ? 'space-y-10' : 'grid gap-8 md:grid-cols-2 md:gap-6'}>
        {RANKINGS.map((ranking) => {
          const isActive = active === ranking.metric;
          const visibility = stacked || isActive ? '' : 'hidden md:block';

          return (
            <section key={ranking.metric} className={`min-w-0 ${visibility}`}>
              <div className="mb-5">
                <h2 className="text-gray-900 text-xl font-semibold">{ranking.title}</h2>
                <p className="text-gray-400 text-xs mt-1">{ranking.hint}</p>
              </div>
              {loading ? (
                <Spinner />
              ) : errors[ranking.metric] ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  No pudimos cargar este ranking. Intenta de nuevo en un momento.
                </p>
              ) : (
                <RankingSection
                  ranking={rows[ranking.metric]}
                  metric={ranking.metric}
                  // Uno debajo del otro: listas recogidas para que el segundo ranking no quede al fondo.
                  collapsedLimit={stacked ? STACKED_COLLAPSED_LIMIT : undefined}
                />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
