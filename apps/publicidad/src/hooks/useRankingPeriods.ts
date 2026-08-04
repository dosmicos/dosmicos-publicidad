import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RankingEntry } from '@/hooks/usePublicRanking';

export type RankingMetric = 'commission' | 'content';

export interface RankingPeriod {
  id: string;
  started_at: string;
  ended_at: string | null;
  is_current: boolean;
  metric: RankingMetric;
  orders_in_period: number;
  commission_in_period: number;
  eligible_content_count: number;
  eligible_creators_count: number;
}

interface SupabaseRpcError { message: string }
interface RpcClient {
  rpc<T>(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: T | null; error: SupabaseRpcError | null }>;
}

const rpc = supabase as unknown as RpcClient;

/**
 * Lista los períodos del ranking (cerrados + el actual) y carga el ranking
 * del período seleccionado. Por defecto selecciona el período actual.
 */
export function useRankingPeriods(orgSlug = 'dosmicos') {
  const [periods, setPeriods] = useState<RankingPeriod[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    setLoadingPeriods(true);
    setError(null);
    try {
      const { data, error: rpcError } = await rpc.rpc<RankingPeriod[]>(
        'list_ugc_content_ranking_periods',
        { p_org_slug: orgSlug }
      );
      if (rpcError) throw rpcError;
      const rows = data || [];
      setPeriods(rows);
      // Mantiene la selección si sigue existiendo; si no, cae al período actual.
      setSelectedId((current) => {
        if (current && rows.some((p) => p.id === current)) return current;
        return rows.find((p) => p.is_current)?.id ?? rows[0]?.id ?? null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los períodos');
    } finally {
      setLoadingPeriods(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  useEffect(() => {
    if (!selectedId) {
      setRanking([]);
      return;
    }
    let cancelled = false;
    setLoadingRanking(true);

    (async () => {
      try {
        const { data, error: rpcError } = await rpc.rpc<RankingEntry[]>(
          'get_ugc_content_ranking_for_period',
          { p_period_id: selectedId }
        );
        if (cancelled) return;
        if (rpcError) throw new Error(rpcError.message);
        setRanking(data || []);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        setRanking([]);
        setError(err instanceof Error ? err.message : 'Error al cargar el ranking');
      } finally {
        if (!cancelled) setLoadingRanking(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedId]);

  const selectedPeriod = periods.find((p) => p.id === selectedId) ?? null;

  const rankingByCommission = [...ranking].sort(
    (a, b) => b.commission_in_period - a.commission_in_period
  );

  const rankingByContent = [...ranking].sort(
    (a, b) => b.eligible_content_count - a.eligible_content_count || a.rank - b.rank
  );

  return {
    periods,
    selectedId,
    setSelectedId,
    selectedPeriod,
    rankingByContent,
    rankingByCommission,
    loadingPeriods,
    loadingRanking,
    error,
    refetch: fetchPeriods,
  };
}
