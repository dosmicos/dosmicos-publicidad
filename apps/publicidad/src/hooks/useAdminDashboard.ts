import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AttributedOrder {
  id: string;
  discount_link_id: string;
  shopify_order_number: string | null;
  order_total: number;
  discount_amount: number;
  commission_amount: number;
  order_date: string;
}

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
  attributed_orders: AttributedOrder[];
}

export interface CreatorPortalLinkMeta {
  id: string;
  token_last4: string;
  portal_url: string | null;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string | null;
}

export interface CreatorUploadTokenMeta {
  id: string;
  token: string;
  is_active: boolean;
  expires_at: string | null;
  upload_count: number | null;
  max_uploads: number | null;
  created_at: string | null;
}

export interface CreatorToolkitAssignment {
  id: string;
  label: string;
  toolkit_url: string;
  is_active: boolean;
  campaign_id: string | null;
  created_at: string;
}

export interface CreatorWithLink {
  id: string;
  name: string;
  instagram_handle: string;
  avatar_url: string | null;
  bre_b: string | null;
  discount_link: DiscountLink | null;
  portal_link?: CreatorPortalLinkMeta | null;
  upload_token?: CreatorUploadTokenMeta | null;
  toolkits?: CreatorToolkitAssignment[];
}

export interface PayoutRecord {
  id: string;
  creator_id: string;
  amount: number;
  payout_type: string;
  notes: string | null;
  created_at: string;
}

export type RankingResetMode = 'off' | 'once' | 'monthly';

export interface RankingSchedule {
  mode: RankingResetMode;
  day: number | null;
  nextResetAt: string | null;
}

const EMPTY_SCHEDULE: RankingSchedule = { mode: 'off', day: null, nextResetAt: null };

interface RpcError { message: string }
const rpcClient = supabase as unknown as {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ error: RpcError | null }>;
};

export function useAdminDashboard() {
  const [creators, setCreators] = useState<CreatorWithLink[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [rankingStartedAt, setRankingStartedAt] = useState<string | null>(null);
  const [rankingSchedule, setRankingSchedule] = useState<RankingSchedule>(EMPTY_SCHEDULE);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
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
      const { data: orgData } = await (supabase as any)
        .from('organizations')
        .select('settings')
        .eq('id', currentOrgId)
        .single();
      const startedAt = orgData?.settings?.ugc_ranking_started_at ?? null;
      setRankingStartedAt(startedAt);

      const rawMode = orgData?.settings?.ugc_ranking_reset_mode;
      const rawDay = orgData?.settings?.ugc_ranking_reset_day;
      setRankingSchedule({
        mode: rawMode === 'once' || rawMode === 'monthly' ? rawMode : 'off',
        day: typeof rawDay === 'number' ? rawDay : null,
        nextResetAt: orgData?.settings?.ugc_ranking_next_reset_at ?? null,
      });

      // 3. Fetch creators with their active discount links
      const { data: creatorsData, error: creatorsError } = await (supabase as any)
        .from('ugc_creators')
        .select(`
          id,
          name,
          instagram_handle,
          avatar_url,
          bre_b,
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
          bre_b: c.bre_b ?? null,
          discount_link: activeLink
            ? {
                ...activeLink,
                pending_balance: Math.ceil(Math.max(
                  (activeLink.total_commission || 0) - (activeLink.total_paid_out || 0),
                  0
                )),
                attributed_orders: [],
              }
            : null,
          portal_link: null,
          upload_token: null,
          toolkits: [],
        };
      });

      const creatorIds = mapped.map((creator) => creator.id);
      const discountLinkIds = mapped
        .map((creator) => creator.discount_link?.id)
        .filter((id): id is string => Boolean(id));

      if (discountLinkIds.length > 0) {
        const { data: attributedOrders, error: attributedOrdersError } = await (supabase as any)
          .from('ugc_attributed_orders')
          .select('id, discount_link_id, shopify_order_number, order_total, discount_amount, commission_amount, order_date')
          .eq('organization_id', currentOrgId)
          .in('discount_link_id', discountLinkIds)
          .order('order_date', { ascending: false });

        if (attributedOrdersError) throw attributedOrdersError;

        const ordersByLink = new Map<string, AttributedOrder[]>();
        (attributedOrders || []).forEach((order: AttributedOrder) => {
          const current = ordersByLink.get(order.discount_link_id) || [];
          current.push(order);
          ordersByLink.set(order.discount_link_id, current);
        });

        mapped.forEach((creator) => {
          if (creator.discount_link) {
            creator.discount_link.attributed_orders = ordersByLink.get(creator.discount_link.id) || [];
          }
        });
      }

      // 4. Fetch optional Club portal data defensively. If the migration is not
      // applied yet, admin still loads and discount links keep working.
      if (creatorIds.length > 0) {
        try {
          const { data: portalLinks } = await (supabase as any)
            .from('ugc_creator_portal_links')
            .select('id, creator_id, token_last4, portal_url, is_active, created_at, last_accessed_at')
            .eq('organization_id', currentOrgId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          const byCreator = new Map<string, CreatorPortalLinkMeta>();
          (portalLinks || []).forEach((link: any) => {
            if (!byCreator.has(link.creator_id)) byCreator.set(link.creator_id, link);
          });
          mapped.forEach((creator) => {
            creator.portal_link = byCreator.get(creator.id) ?? null;
          });
        } catch {
          // Club migration not available yet; keep admin backwards compatible.
        }

        try {
          const { data: uploadTokens } = await (supabase as any)
            .from('ugc_upload_tokens')
            .select('id, creator_id, token, is_active, expires_at, upload_count, max_uploads, created_at')
            .eq('organization_id', currentOrgId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          const byCreator = new Map<string, CreatorUploadTokenMeta>();
          (uploadTokens || []).forEach((token: any) => {
            if (!byCreator.has(token.creator_id)) byCreator.set(token.creator_id, token);
          });
          mapped.forEach((creator) => {
            creator.upload_token = byCreator.get(creator.id) ?? null;
          });
        } catch {
          // Upload tokens table may be unavailable in older environments.
        }

        try {
          const { data: toolkitRows } = await (supabase as any)
            .from('ugc_toolkit_assignments')
            .select('id, creator_id, label, toolkit_url, is_active, campaign_id, created_at')
            .eq('organization_id', currentOrgId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          const byCreator = new Map<string, CreatorToolkitAssignment[]>();
          (toolkitRows || []).forEach((toolkit: any) => {
            const current = byCreator.get(toolkit.creator_id) || [];
            current.push(toolkit);
            byCreator.set(toolkit.creator_id, current);
          });
          mapped.forEach((creator) => {
            creator.toolkits = byCreator.get(creator.id) || [];
          });
        } catch {
          // Toolkit migration not available yet; preserve current admin.
        }
      }

      setCreators(mapped);

      // 5. Fetch all payouts for the org
      const { data: payoutsData } = await (supabase as any)
        .from('ugc_commission_payouts')
        .select('id, creator_id, amount, payout_type, notes, created_at')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });

      setPayouts(payoutsData || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset ranking period
  const resetRankingPeriod = async () => {
    if (!orgId) return;
    const { error } = await (supabase as any).rpc('reset_ugc_content_ranking_period', {
      p_org_id: orgId,
    });
    if (error) throw error;
    await fetchAll({ silent: true });
  };

  // Schedule (or clear) an automatic ranking reset
  const saveRankingSchedule = async (
    mode: RankingResetMode,
    day: number | null,
    at: string | null
  ) => {
    if (!orgId) throw new Error('Org no disponible');
    const { error } = await rpcClient.rpc('set_ugc_ranking_schedule', {
      p_org_id: orgId,
      p_mode: mode,
      p_day: mode === 'monthly' ? day : null,
      p_at: mode === 'once' ? at : null,
    });
    if (error) throw new Error(error.message);
    await fetchAll({ silent: true });
  };

  // Register payout
  const registerPayout = async (linkId: string, amount: number) => {
    if (!orgId) throw new Error('Org no disponible');
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
    await fetchAll({ silent: true });
  };

  // Update commission rate via SECURITY DEFINER RPC (bypasses RLS)
  const updateCommissionRate = async (linkId: string, rate: number) => {
    const { error } = await (supabase as any).rpc('update_ugc_commission_rate', {
      p_link_id: linkId,
      p_rate: rate,
    });
    if (error) throw error;
    await fetchAll({ silent: true });
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
    await fetchAll({ silent: true });
    return data;
  };

  // Delete / deactivate discount link via edge function
  const deleteDiscountLink = async (linkId: string) => {
    const { data, error } = await supabase.functions.invoke('delete-ugc-discount', {
      body: { discount_link_id: linkId },
    });
    if (error) throw error;
    await fetchAll({ silent: true });
    return data;
  };

  const generateClubPortalLink = async (creatorId: string) => {
    const { data, error } = await (supabase as any).rpc('generate_ugc_creator_portal_link', {
      p_creator_id: creatorId,
    });
    if (error) throw error;
    await fetchAll({ silent: true });
    const generated = Array.isArray(data) ? data[0] : data;
    return generated?.portal_url as string | undefined;
  };

  const revokeClubPortalLink = async (creatorId: string) => {
    const { error } = await (supabase as any).rpc('revoke_ugc_creator_portal_link', {
      p_creator_id: creatorId,
    });
    if (error) throw error;
    await fetchAll({ silent: true });
  };

  const generateUploadToken = async (creatorId: string) => {
    if (!orgId) throw new Error('Org no disponible');
    await (supabase as any)
      .from('ugc_upload_tokens')
      .update({ is_active: false })
      .eq('creator_id', creatorId)
      .eq('is_active', true);

    const { data, error } = await (supabase as any)
      .from('ugc_upload_tokens')
      .insert({
        organization_id: orgId,
        creator_id: creatorId,
        is_active: true,
        expires_at: null,
        max_uploads: null,
      })
      .select('token')
      .single();
    if (error) throw error;
    await fetchAll({ silent: true });
    return data?.token ? `https://club.dosmicos.com/upload/${data.token}` : undefined;
  };

  const deactivateUploadToken = async (tokenId: string) => {
    const { error } = await (supabase as any)
      .from('ugc_upload_tokens')
      .update({ is_active: false })
      .eq('id', tokenId);
    if (error) throw error;
    await fetchAll({ silent: true });
  };

  const addToolkitAssignment = async (creatorId: string, toolkitUrl: string, label = 'Idea de contenido') => {
    if (!orgId) throw new Error('Org no disponible');
    const url = toolkitUrl.trim();
    if (!url.startsWith('https://')) throw new Error('El link del toolkit debe empezar por https://');
    const { error } = await (supabase as any)
      .from('ugc_toolkit_assignments')
      .insert({
        organization_id: orgId,
        creator_id: creatorId,
        label: label.trim() || 'Idea de contenido',
        toolkit_url: url,
        is_active: true,
      });
    if (error) throw error;
    await fetchAll({ silent: true });
  };

  const deactivateToolkitAssignment = async (toolkitId: string) => {
    const { error } = await (supabase as any)
      .from('ugc_toolkit_assignments')
      .update({ is_active: false })
      .eq('id', toolkitId);
    if (error) throw error;
    await fetchAll({ silent: true });
  };

  return {
    creators,
    payouts,
    rankingStartedAt,
    rankingSchedule,
    orgId,
    loading,
    error,
    refetch: fetchAll,
    resetRankingPeriod,
    saveRankingSchedule,
    registerPayout,
    updateCommissionRate,
    createDiscountLink,
    deleteDiscountLink,
    generateClubPortalLink,
    revokeClubPortalLink,
    generateUploadToken,
    deactivateUploadToken,
    addToolkitAssignment,
    deactivateToolkitAssignment,
  };
}
