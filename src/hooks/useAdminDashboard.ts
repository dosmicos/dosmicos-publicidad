import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DiscountLink {
  id: string;
  redirect_token: string;
  discount_value: number;
  commission_rate: number;
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  total_paid_out: number;
  pending_balance: number;
  is_active: boolean;
  shopify_price_rule_id: string | null;
}

export interface CreatorWithLink {
  id: string;
  name: string;
  instagram_handle: string;
  avatar_url: string | null;
  discount_link: DiscountLink | null;
}

export function useAdminDashboard() {
  const [creators, setCreators] = useState<CreatorWithLink[]>([]);
  const [rankingStartedAt, setRankingStartedAt] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get org_id from the user's profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;

      const currentOrgId = profile.organization_id as string;
      setOrgId(currentOrgId);

      // 2. Read ugc_ranking_started_at from organizations.settings JSONB
      // (this is the same source that get_ugc_public_ranking reads from)
      const { data: orgData } = await (supabase as any)
        .from('organizations')
        .select('settings')
        .eq('id', currentOrgId)
        .single();
      const startedAt = orgData?.settings?.ugc_ranking_started_at ?? null;
      setRankingStartedAt(startedAt);

      // 3. Fetch creators with their active discount links
      const { data: creatorsData, error: creatorsError } = await (supabase as any)
        .from('ugc_creators')
        .select(`
          id,
          name,
          instagram_handle,
          avatar_url,
          ugc_discount_links!ugc_discount_links_creator_id_fkey (
            id,
            redirect_token,
            discount_value,
            commission_rate,
            total_orders,
            total_revenue,
            total_commission,
            total_paid_out,
            is_active,
            shopify_price_rule_id
          )
        `)
        .eq('organization_id', currentOrgId)
        .order('name');

      if (creatorsError) throw creatorsError;

      const mapped: CreatorWithLink[] = (creatorsData || []).map((c: any) => {
        const links: any[] = c.ugc_discount_links || [];
        const activeLink = links.find((l: any) => l.is_active) ?? null;
        return {
          id: c.id,
          name: c.name,
          instagram_handle: c.instagram_handle,
          avatar_url: c.avatar_url,
          discount_link: activeLink
            ? {
                ...activeLink,
                pending_balance: Math.max(
                  (activeLink.total_commission || 0) - (activeLink.total_paid_out || 0),
                  0
                ),
              }
            : null,
        };
      });

      setCreators(mapped);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset ranking period — updates organizations.settings.ugc_ranking_started_at
  const resetRankingPeriod = async () => {
    if (!orgId) return;
    const { error } = await (supabase as any).rpc('reset_ugc_ranking_period', {
      p_org_id: orgId,
    });
    if (error) throw error;
    await fetchAll();
  };

  // Register payout — passes all required params to the SQL function
  const registerPayout = async (linkId: string, amount: number) => {
    if (!orgId) throw new Error('Org no disponible');
    // Find the creator associated with this link to pass required SQL params
    const creator = creators.find((c) => c.discount_link?.id === linkId);
    if (!creator) throw new Error('Creadora no encontrada');

    const { error } = await (supabase as any).rpc('register_ugc_commission_payout', {
      p_link_id: linkId,
      p_amount: amount,
      p_type: 'nequi',
      p_notes: null,
      p_creator_id: creator.id,
      p_org_id: orgId,
    });
    if (error) throw error;
    await fetchAll();
  };

  // Update commission rate directly on the link
  const updateCommissionRate = async (linkId: string, rate: number) => {
    const { error } = await (supabase as any)
      .from('ugc_discount_links')
      .update({ commission_rate: rate, updated_at: new Date().toISOString() })
      .eq('id', linkId);
    if (error) throw error;
    await fetchAll();
  };

  // Create discount link via edge function
  const createDiscountLink = async (
    creatorId: string,
    discountValue: number,
    commissionRate: number
  ) => {
    const { data, error } = await supabase.functions.invoke('create-ugc-discount', {
      body: {
        creator_id: creatorId,
        discount_value: discountValue,
        commission_rate: commissionRate,
      },
    });
    if (error) throw error;
    await fetchAll();
    return data;
  };

  // Delete / deactivate discount link via edge function
  const deleteDiscountLink = async (linkId: string) => {
    const { data, error } = await supabase.functions.invoke('delete-ugc-discount', {
      body: { discount_link_id: linkId },
    });
    if (error) throw error;
    await fetchAll();
    return data;
  };

  return {
    creators,
    rankingStartedAt,
    orgId,
    loading,
    error,
    refetch: fetchAll,
    resetRankingPeriod,
    registerPayout,
    updateCommissionRate,
    createDiscountLink,
    deleteDiscountLink,
  };
}
