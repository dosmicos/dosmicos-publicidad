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

export function usePublicRanking(orgSlug = 'dosmicos-org') {
  const [data, setData] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: rpcError } = await publicSupabase.rpc<RankingEntry[]>(
        'get_ugc_public_content_ranking',
        { p_org_slug: orgSlug }
      );
      if (rpcError) throw rpcError;
      setData(rows || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar ranking');
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const rankingByCommission = [...data].sort(
    (a, b) => b.commission_in_period - a.commission_in_period
  );

  const rankingByContent = [...data].sort(
    (a, b) => b.content_points - a.content_points || a.rank - b.rank
  );

  return {
    data,
    rankingByContent,
    rankingByCommission,
    loading,
    error,
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
