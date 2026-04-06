import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RankingEntry {
  creator_name: string;
  instagram_handle: string;
  avatar_url: string | null;
  orders_in_period: number;
  commission_in_period: number;
  pending_balance: number;
  rank: number;
}

export function usePublicRanking(orgSlug = 'dosmicos') {
  const [data, setData] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: rpcError } = await (supabase as any).rpc(
        'get_ugc_public_ranking',
        { p_org_slug: orgSlug }
      );
      if (rpcError) throw rpcError;
      setData(rows || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar ranking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [orgSlug]);

  const rankingByCommission = [...data].sort(
    (a, b) => b.commission_in_period - a.commission_in_period
  );

  const balancesByAmount = [...data]
    .filter((e) => e.pending_balance > 0)
    .sort((a, b) => b.pending_balance - a.pending_balance);

  return { data, rankingByCommission, balancesByAmount, loading, error, refetch: fetch };
}
