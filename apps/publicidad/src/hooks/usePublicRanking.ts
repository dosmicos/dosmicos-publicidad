import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RankingEntry {
  creator_name: string;
  instagram_handle: string;
  avatar_url: string | null;
  orders_in_period: number;
  commission_in_period: number;
  eligible_content_count: number;
  reviewed_content_count: number;
  content_points: number;
  pending_balance: number;
  metric: 'commission' | 'content';
  rank: number;
}

export interface PrivateBalanceEntry {
  creator_name: string;
  instagram_handle: string;
  avatar_url: string | null;
  pending_balance: number;
}

interface SupabaseRpcError { message: string }
interface PublicSupabaseClient {
  rpc<T>(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: T | null; error: SupabaseRpcError | null }>;
}

const publicSupabase = supabase as unknown as PublicSupabaseClient;

/** Fila de get_ugc_public_commission_ranking: el ranking de comisiones original, sin saldos. */
interface CommissionRankingRow {
  creator_name: string;
  instagram_handle: string;
  avatar_url: string | null;
  orders_in_period: number | string;
  commission_in_period: number | string;
  rank: number | string;
}

const toCommissionEntry = (row: CommissionRankingRow): RankingEntry => ({
  creator_name: row.creator_name,
  instagram_handle: row.instagram_handle,
  avatar_url: row.avatar_url,
  orders_in_period: Number(row.orders_in_period) || 0,
  commission_in_period: Number(row.commission_in_period) || 0,
  eligible_content_count: 0,
  reviewed_content_count: 0,
  content_points: 0,
  pending_balance: 0,
  metric: 'commission',
  rank: Number(row.rank) || 0,
});

const rpcErrorMessage = (err: unknown, fallback: string) => (
  err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
    ? err.message
    : fallback
);

/**
 * Los dos rankings públicos del período actual:
 * - Comisiones: el ranking original del Club (comisión y compras con el link).
 * - Contenido: puntos por fotos (1) y videos (3) que clasifican.
 * Se cargan por separado: si uno falla, el otro se sigue mostrando.
 */
export function usePublicRanking(orgSlug = 'dosmicos-org') {
  const [data, setData] = useState<RankingEntry[]>([]);
  const [commissionData, setCommissionData] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissionError, setCommissionError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCommissionError(null);
    try {
      const [contentResult, commissionResult] = await Promise.allSettled([
        publicSupabase.rpc<RankingEntry[]>('get_ugc_public_content_ranking', { p_org_slug: orgSlug }),
        publicSupabase.rpc<CommissionRankingRow[]>('get_ugc_public_commission_ranking', { p_org_slug: orgSlug }),
      ]);

      if (contentResult.status === 'fulfilled' && !contentResult.value.error) {
        setData(contentResult.value.data || []);
      } else {
        setData([]);
        setError(rpcErrorMessage(
          contentResult.status === 'fulfilled' ? contentResult.value.error : contentResult.reason,
          'Error al cargar el ranking de contenido',
        ));
      }

      if (commissionResult.status === 'fulfilled' && !commissionResult.value.error) {
        setCommissionData((commissionResult.value.data || []).map(toCommissionEntry));
      } else {
        setCommissionData([]);
        setCommissionError(rpcErrorMessage(
          commissionResult.status === 'fulfilled' ? commissionResult.value.error : commissionResult.reason,
          'Error al cargar el ranking de comisiones',
        ));
      }
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Ya viene ordenado como el ranking original (comisión y, en empate, saldo); se respeta ese orden.
  const rankingByCommission = commissionData;

  const rankingByContent = [...data].sort(
    (a, b) => b.content_points - a.content_points || a.rank - b.rank
  );

  return {
    data,
    rankingByContent,
    rankingByCommission,
    loading,
    error,
    commissionError,
    refetch: fetch,
  };
}

export function usePrivateRankingBalances(enabled: boolean, orgSlug = 'dosmicos-org') {
  const [data, setData] = useState<PrivateBalanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: rpcError } = await publicSupabase.rpc<PrivateBalanceEntry[]>(
        'get_ugc_private_balance_summary',
        { p_org_slug: orgSlug }
      );
      if (rpcError) throw rpcError;
      setData((rows || []).filter((entry) => entry.pending_balance > 0));
    } catch (err: unknown) {
      setData([]);
      setError(err instanceof Error ? err.message : 'Error al cargar saldos');
    } finally {
      setLoading(false);
    }
  }, [enabled, orgSlug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
