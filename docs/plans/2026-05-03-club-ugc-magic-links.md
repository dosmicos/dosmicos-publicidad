# Club UGC Magic Links Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Convert `club.dosmicos.com` into the creator-facing UGC portal where each creator enters with a unique link, without password/código, while preserving the existing Admin area and all working UGC/discount/upload functionality.

**Architecture:** Supabase stays as the shared source of truth between Sewdle and Club. Sewdle remains the admin/control panel for UGC creators. Club becomes the creator portal. Access uses secure unique links (`https://club.dosmicos.com/c/:token`). Discount links are generated only from Sewdle because the admin must define discount % and commission %. Upload links are auto-created for new UGC creators and can be deactivated/deleted from Sewdle. Toolkits are assigned mainly by campaign, with support for extra standalone toolkits.

**Tech Stack:** React/Vite apps in `dosmicos-ugc`, Sewdle React app, Supabase Postgres/RPC/RLS/Edge Functions, Shopify discount generation via existing `create-ugc-discount`, existing upload portal from `jdcastro2/dosmicos-upload-portal` integrated under Club.

---

## Non-negotiables from Julian

1. **Do not break existing discount links.**
   - Keep the existing discount link format/domain already in use.
   - Do **not** switch old links to `club.dosmicos.com/ugc/:token` if current production is `ads.dosmicos.com/ugc/:token`.
   - Existing `/ugc/:token` redirect must keep working.

2. **Creators must NOT generate their own discount link from Club.**
   - Discount % for community and commission % for UGC are assigned in Sewdle.
   - Club only shows/copies the discount link after Sewdle has generated it.

3. **Upload links should be automatic for new UGC creators.**
   - When a new UGC creator is created in Sewdle, an active upload token/link should be created automatically.
   - Sewdle must still have options to deactivate/delete/regenerate the upload link.
   - If a UGC is deleted/deactivated, link should be disabled or removed according to admin action.

4. **Toolkits are primarily campaign-based.**
   - Each campaign can have a toolkit URL.
   - It must also be possible to assign extra toolkits without creating a new campaign.
   - Creator only sees a simple button like “Idea de contenido”.

5. **Root page behavior.**
   - `club.dosmicos.com/` should show the ranking.
   - It should also show a suggestion: “Entra con tu link único. Si no lo tienes, comunícate con Dosmicos para ayudarte.”

6. **Preserve Admin.**
   - Keep `/admin` in Club.
   - Admin continues logging in with credentials as it does now.
   - Admin can edit Club/UGC data, and changes must sync with Sewdle and vice versa.
   - Do not remove any feature that already works.

---

## Current state found

### Club/publicidad app

Repo path:

- `/Users/juliancastro/.hermes/workspace/ugc-repo-merge/dosmicos-ugc/apps/publicidad`

Relevant files:

- `src/components/ugc/CreatorBalanceGate.tsx`
  - Current creator access uses short access code.
  - Calls RPC `get_creator_balance_by_code`.
- `src/hooks/useAdminDashboard.ts`
  - Reads `ugc_creators`, `ugc_discount_links`, payouts.
  - Uses Edge Function `create-ugc-discount`.
- `src/App.tsx`
  - Current routes include `/`, `/login`, `/admin`, `/ugc/:token` redirect.

### Upload portal app

Repo path:

- `/Users/juliancastro/.hermes/workspace/ugc-repo-merge/dosmicos-ugc/apps/upload-portal`

Relevant files:

- `src/main.tsx`
  - Route: `/upload/:token`.
- `src/pages/UploadFlowPage.tsx`
  - Validates upload token using RPC `validate_ugc_upload_token`.
- `src/pages/UgcUploadPage.tsx`
  - Uploads to Supabase Storage bucket `ugc-videos`.
  - Calls RPC `ugc_submit_video`.

### Sewdle app

Repo path:

- `/Users/juliancastro/Desktop/sewdle-co`

Relevant files:

- `src/pages/UgcCreatorsPage.tsx`
  - Main UGC creators page.
- `src/components/ugc/UgcCreatorDetailModal.tsx`
  - Creator detail modal.
  - Already imports `GenerateUploadLinkButton` and `DiscountLinkButton`.
- `src/hooks/useUgcUploadTokens.ts`
  - Current table: `ugc_upload_tokens`.
  - Current URL builder uses `https://upload.dosmicos.com/upload/${token}`.
- `src/hooks/useUgcDiscountLinks.ts`
  - Current table: `ugc_discount_links`.
  - Current Edge Function: `create-ugc-discount`.
- `src/types/ugc.ts`
  - `UgcCreator` currently has `access_code`.

---

## Final route design

### Creator-facing

- `https://club.dosmicos.com/`
  - Ranking page.
  - Add message: “Para ver tus ganancias entra con tu link único. Si no lo tienes, escríbenos a Dosmicos.”

- `https://club.dosmicos.com/c/:portal_token`
  - Creator private dashboard without password/código.

- `https://club.dosmicos.com/upload/:upload_token`
  - Existing upload portal.

### Discount links

- Keep existing discount URL/domain.
- If current live URL is `https://ads.dosmicos.com/ugc/:token`, keep that.
- Club can display/copy the existing link, but must not change its format.

### Admin

- `https://club.dosmicos.com/admin`
  - Keep existing admin login with credentials.
  - Keep existing admin features.
  - Admin changes read/write the same Supabase data as Sewdle, so data syncs both ways.

---

## Creator dashboard UX

When a UGC opens `club.dosmicos.com/c/:token`, show:

1. **Header**
   - “Hola, {name} 👋”
   - Instagram/TikTok handle
   - Avatar if available

2. **Ganancias**
   - Ventas generadas
   - Comisión total
   - Pagado
   - Saldo pendiente
   - Últimas órdenes atribuidas, without customer PII

3. **Link de descuento**
   - If link exists: button “Copiar mi link de descuento”.
   - If no link exists: message “Tu link de descuento aún no ha sido asignado. Escríbenos a Dosmicos.”
   - No generation button in Club.

4. **Subir contenido**
   - Button “Subir contenido”.
   - Opens `club.dosmicos.com/upload/:upload_token`.
   - Upload token should already exist because it is auto-created when creator is created.
   - If missing for legacy creator, show admin-safe fallback: “Solicita tu link de subida a Dosmicos” or call a secure backfill only if approved.

5. **Ideas de contenido**
   - Button(s): “Idea de contenido”.
   - If multiple toolkits exist, show multiple simple cards/buttons:
     - “Idea de contenido — Campaña Ruana Vaca”
     - “Idea de contenido — Extra”
   - Creator should not see all toolkits, only assigned ones.

---

## Data model plan

### Task 1: Add creator portal magic links table

**Objective:** Replace creator password/code flow with secure, revocable unique links.

**Create migration:**

- Sewdle repo: `supabase/migrations/YYYYMMDDHHMMSS_ugc_creator_portal_links.sql`

**SQL draft:**

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.ugc_creator_portal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.ugc_creators(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  token_last4 text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  last_accessed_at timestamptz NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ugc_creator_portal_links_creator
  ON public.ugc_creator_portal_links(creator_id);

CREATE INDEX IF NOT EXISTS idx_ugc_creator_portal_links_org
  ON public.ugc_creator_portal_links(organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ugc_creator_portal_links_one_active_per_creator
  ON public.ugc_creator_portal_links(creator_id)
  WHERE is_active = true;

ALTER TABLE public.ugc_creator_portal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugc_creator_portal_links_org_access"
ON public.ugc_creator_portal_links
FOR ALL
USING (organization_id = get_current_organization_safe());
```

**Security rule:** store only `token_hash` + `token_last4`, never plaintext token.

---

### Task 2: Add campaign and extra toolkit assignments

**Objective:** Toolkits are primarily by campaign, but admin can add extra toolkit links without creating a new campaign.

**Recommended table:**

```sql
CREATE TABLE IF NOT EXISTS public.ugc_toolkit_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.ugc_creators(id) ON DELETE CASCADE,
  campaign_id uuid NULL REFERENCES public.ugc_campaigns(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Idea de contenido',
  toolkit_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ugc_toolkit_assignments_url_https CHECK (toolkit_url ~* '^https://')
);

CREATE INDEX IF NOT EXISTS idx_ugc_toolkit_assignments_creator
  ON public.ugc_toolkit_assignments(creator_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ugc_toolkit_assignments_campaign
  ON public.ugc_toolkit_assignments(campaign_id);

ALTER TABLE public.ugc_toolkit_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ugc_toolkit_assignments_org_access"
ON public.ugc_toolkit_assignments
FOR ALL
USING (organization_id = get_current_organization_safe());
```

**How to use:**

- Campaign toolkit: `campaign_id` set.
- Extra toolkit without campaign: `campaign_id = null`.
- Club shows all active assignments for the creator.

---

### Task 3: Ensure upload token lifecycle

**Objective:** Every new UGC creator gets an upload link automatically, and admin can deactivate/delete/regenerate it.

Use existing table:

- `ugc_upload_tokens`

Add one of these mechanisms:

#### Option A — DB trigger, recommended for consistency

Create trigger after insert on `ugc_creators`:

```sql
CREATE OR REPLACE FUNCTION public.create_default_ugc_upload_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ugc_upload_tokens (
    organization_id,
    creator_id,
    is_active,
    expires_at,
    max_uploads
  ) VALUES (
    NEW.organization_id,
    NEW.id,
    true,
    NULL,
    NULL
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_default_ugc_upload_token ON public.ugc_creators;

CREATE TRIGGER trg_create_default_ugc_upload_token
AFTER INSERT ON public.ugc_creators
FOR EACH ROW
EXECUTE FUNCTION public.create_default_ugc_upload_token();
```

#### Option B — Sewdle app-level creation

After creating a creator in `useUgcCreators.ts`, call existing token generation hook/API.

**Recommendation:** Option A is safer because it guarantees token creation no matter where creator is inserted from.

**Deletion/deactivation:**

- If creator is soft-deactivated: deactivate active upload tokens.
- If creator is hard-deleted: FK cascade should remove tokens if FK has `ON DELETE CASCADE`; verify constraint.
- Sewdle UI should still expose buttons:
  - “Copiar link de subida”
  - “Regenerar link de subida”
  - “Desactivar link de subida”
  - “Eliminar link de subida” if hard delete is safe

---

### Task 4: Add RPCs for portal links

**Objective:** Sewdle can generate/revoke unique Club links.

Create:

- `generate_ugc_creator_portal_link(p_creator_id uuid)`
- `revoke_ugc_creator_portal_link(p_creator_id uuid)`

**Behavior:**

- Only authenticated Sewdle/admin users in the org can call.
- Regenerating invalidates previous active token.
- Return plaintext URL only at generation time.
- Store only hash.

**URL returned:**

```txt
https://club.dosmicos.com/c/:token
```

---

### Task 5: Add public RPC for Creator Portal data

**Objective:** Club loads dashboard from `:portal_token` without auth.

Create:

- `get_ugc_creator_portal_by_token(p_token text)`

**Returns safe payload:**

```ts
type CreatorPortalPayload = {
  creator: {
    id: string;
    name: string;
    instagram_handle: string | null;
    tiktok_handle: string | null;
    avatar_url: string | null;
  };
  discount_link: {
    public_url: string;
    discount_value: number;
    commission_rate: number;
    total_orders: number;
    total_revenue: number;
    total_commission: number;
    total_paid_out: number;
    pending_balance: number;
  } | null;
  upload: {
    upload_url: string | null;
    is_active: boolean;
  };
  toolkits: Array<{
    label: string;
    url: string;
    campaign_id: string | null;
  }>;
  recent_orders: Array<{
    shopify_order_number: string | null;
    order_total: number;
    commission_amount: number;
    order_date: string;
  }>;
};
```

**Do not return:**

- customer name
- customer phone/email/address
- raw Shopify discount code unless approved later
- internal notes

**Important discount URL rule:**

- Build `public_url` using the existing discount domain already used in production, e.g. `https://ads.dosmicos.com/ugc/:redirect_token` if that is current.

---

## Sewdle implementation plan

### Task 6: Add `useUgcCreatorPortalLink` hook

**Create:**

- `/Users/juliancastro/Desktop/sewdle-co/src/hooks/useUgcCreatorPortalLink.ts`

**Hook returns:**

```ts
{
  activeLinkMeta,
  isLoading,
  generateLink,
  revokeLink,
  lastGeneratedUrl
}
```

**Rules:**

- Query active token metadata: `id`, `token_last4`, `created_at`, `last_accessed_at`.
- Generate via RPC.
- Show/copy full link only after generation.
- If lost, regenerate.

---

### Task 7: Add `CreatorPortalLinkButton` component

**Create:**

- `/Users/juliancastro/Desktop/sewdle-co/src/components/ugc/CreatorPortalLinkButton.tsx`

**UI:**

- No active link: “Generar link Club”
- Active link: “Link Club activo · termina en XXXX”
- Actions:
  - copiar link recién generado
  - regenerar
  - revocar

---

### Task 8: Update upload token UI and creation behavior

**Modify:**

- `/Users/juliancastro/Desktop/sewdle-co/src/hooks/useUgcUploadTokens.ts`
- `GenerateUploadLinkButton` component, if present

Change URL builder from:

```ts
return `https://upload.dosmicos.com/upload/${token}`;
```

to:

```ts
return `https://club.dosmicos.com/upload/${token}`;
```

Keep old `upload.dosmicos.com` as redirect if already used externally.

Add UI actions:

- copy upload link
- regenerate upload link
- deactivate upload link
- delete upload link if safe

---

### Task 9: Add toolkit assignment UI

**Create/modify:**

- `/Users/juliancastro/Desktop/sewdle-co/src/components/ugc/UgcToolkitAssignmentsManager.tsx`
- `/Users/juliancastro/Desktop/sewdle-co/src/components/ugc/UgcCreatorDetailModal.tsx`
- `/Users/juliancastro/Desktop/sewdle-co/src/types/ugc.ts`

**UI behavior:**

- In each campaign card: field/button to assign toolkit URL.
- Extra section: “Toolkits adicionales” for links not tied to campaign.
- Fields:
  - label, default `Idea de contenido`
  - toolkit URL
  - campaign optional
  - active/inactive
- Club only shows active assignments.

---

### Task 10: Keep Sewdle and Club Admin synced

**Objective:** Admin edits in either platform should update the same Supabase records.

**Rule:** Do not create duplicate admin-only tables for Club.

Admin should read/write the same tables used by Sewdle:

- `ugc_creators`
- `ugc_campaigns`
- `ugc_videos`
- `ugc_discount_links`
- `ugc_commission_payouts`
- `ugc_upload_tokens`
- `ugc_toolkit_assignments`
- `ugc_creator_portal_links`

**Important:** Existing Sewdle admin remains the primary operations UI. Club Admin can exist, but should not fork data logic.

---

## Club app implementation plan

### Task 11: Preserve existing `/admin` route

**Modify carefully:**

- `/Users/juliancastro/.hermes/workspace/ugc-repo-merge/dosmicos-ugc/apps/publicidad/src/App.tsx`

Do not remove:

- `/admin`
- `/login`
- auth context
- admin dashboard functionality
- existing discount link creation for admins
- existing payout/edit flows

Admin should continue with credentials.

---

### Task 12: Add creator portal route

**Modify:**

- `apps/publicidad/src/App.tsx`

Add:

```tsx
<Route path="/c/:token" element={<CreatorPortalPage />} />
```

---

### Task 13: Create `useCreatorPortal` hook

**Create:**

- `apps/publicidad/src/hooks/useCreatorPortal.ts`

**Behavior:**

- Reads `token` from route.
- Calls `get_ugc_creator_portal_by_token`.
- Returns loading/error/data.
- Does not generate discount links.
- May refresh upload/toolkit data by re-calling the RPC.

---

### Task 14: Create `CreatorPortalPage`

**Create:**

- `apps/publicidad/src/pages/CreatorPortalPage.tsx`

**Sections:**

- greeting/header
- earnings
- discount link copy card
- upload content card
- toolkit cards/buttons
- recent attributed orders
- invalid/revoked link state

**If no discount link:**

Show:

```txt
Tu link de descuento aún no ha sido asignado. Escríbenos a Dosmicos para activarlo.
```

No “generar descuento” button.

---

### Task 15: Update root ranking page messaging

**Modify:**

- `apps/publicidad/src/pages/UgcDashboardPage.tsx`
- possibly `CreatorBalanceGate.tsx`

Root `/` should continue showing ranking.

Add message/card:

```txt
¿Eres creadora Dosmicos?
Entra con tu link único para ver tus ganancias, subir contenido y ver tus ideas de contenido.
Si no tienes tu link, escríbenos a Dosmicos y te ayudamos.
```

Remove or de-emphasize old code/password entry for creators. Keep only if needed as temporary fallback.

---

### Task 16: Keep upload portal integrated under Club

The merged project already supports:

- `/upload/:token` → upload portal app.

Ensure root `vercel.json` keeps rewrites in this order:

```json
{
  "rewrites": [
    { "source": "/upload/:path*", "destination": "/upload/index.html" },
    { "source": "/ugc/:token", "destination": "https://ysdcsqsfnckeuafjyrbc.supabase.co/functions/v1/ugc-redirect/:token" },
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

If the existing discount URL is on `ads.dosmicos.com`, keep that deployment/domain alive or redirect it without changing token behavior.

---

## Sync rules

| Feature | Source of truth | Admin/generated from | Creator-facing from |
|---|---|---|---|
| Creator profile | `ugc_creators` | Sewdle + Club Admin | Club |
| Club magic link | `ugc_creator_portal_links` | Sewdle + Club Admin | Club validates |
| Discount link | `ugc_discount_links` | Sewdle + Club Admin only | Club displays/copies |
| Discount % | `ugc_discount_links.discount_value` | Sewdle + Club Admin only | Club displays |
| Commission % | `ugc_discount_links.commission_rate` | Sewdle + Club Admin only | Club displays if desired |
| Earnings/orders | `ugc_discount_links`, `ugc_attributed_orders`, `ugc_commission_payouts` | Shopify webhook/Sewdle/Admin | Club |
| Upload link | `ugc_upload_tokens` | Auto on creator creation + Sewdle/Admin | Club opens |
| Uploaded content | `ugc_videos`, Storage `ugc-videos` | Upload portal | Sewdle + Club Admin |
| Toolkits | `ugc_toolkit_assignments` | Sewdle + Club Admin | Club buttons |

---

## Rollout plan

### Phase 1 — No-risk foundations

- Add new tables/RPCs.
- Add toolkit assignment table.
- Add upload token auto-create trigger.
- Do not change existing Club UI yet.

### Phase 2 — Sewdle controls

- Add Club link button.
- Add toolkit assignments manager.
- Update upload link domain to Club.
- Confirm discount link generation remains admin-only.

### Phase 3 — Club creator portal

- Add `/c/:token`.
- Add creator dashboard.
- Keep `/admin` untouched.
- Keep `/` ranking.

### Phase 4 — QA with test creators

Test:

- existing discount links still work
- admin login still works
- Sewdle edit appears in Club
- Club Admin edit appears in Sewdle
- new creator auto-gets upload token
- deactivated upload token stops working
- campaign toolkit appears in Club
- extra toolkit appears in Club
- creator without discount link cannot generate one herself

### Phase 5 — Production migration

- Deploy preview.
- Test with 1–3 real/internal creators.
- Point `club.dosmicos.com` to new project.
- Keep old `ads.dosmicos.com/ugc/:token` alive.
- Redirect old `upload.dosmicos.com/upload/:token` to `club.dosmicos.com/upload/:token` if needed.

---

## Testing checklist

### Existing functions must still work

- `/admin` login works with credentials.
- Existing admin dashboard loads.
- Existing discount link creation from admin/Sewdle works.
- Existing payout registration works.
- Existing `/ugc/:token` links redirect.
- Existing upload flow validates token and uploads content.

### New portal tests

- Generate Club link in Sewdle.
- Open `club.dosmicos.com/c/:token`.
- Invalid token shows safe error.
- Revoked token stops working.
- Creator sees earnings.
- Creator sees discount link only if admin generated it.
- Creator cannot create discount link herself.
- Creator sees upload button.
- Creator sees campaign toolkit buttons.
- Creator sees extra toolkit buttons.

### Sync tests

- Edit discount % in Sewdle → Club updates.
- Edit commission % in Sewdle → Club/Admin updates.
- Edit creator info in Club Admin → Sewdle updates.
- Edit creator info in Sewdle → Club Admin updates.
- Add uploaded content → Sewdle shows video.
- Add toolkit in Sewdle → Club shows button.

---

## Implementation order

1. Migration: `ugc_creator_portal_links`.
2. Migration: `ugc_toolkit_assignments`.
3. Migration/trigger: auto-create `ugc_upload_tokens` on new creator.
4. RPC: generate/revoke portal links.
5. RPC: get creator portal payload by token.
6. Sewdle hook/component for Club link.
7. Sewdle toolkit assignment UI.
8. Sewdle upload token UI improvements.
9. Club `/c/:token` page.
10. Root ranking page message.
11. QA existing Admin + existing discount links.
12. Preview deploy.
13. Production deploy.

---

## Final decisions recorded

- Discount link domain: keep existing domain/link behavior to avoid interfering with already created links.
- Discount generation: only from Sewdle/Admin, not from creator portal.
- Upload link: auto-create when a new UGC creator is created; Sewdle/Admin can deactivate/delete/regenerate.
- Toolkit: campaign-level first, plus extra toolkit assignments without campaign.
- Root page: ranking + prompt to use unique link/contact Dosmicos.
- Admin: must remain intact with credential login and full existing functionality.
- Sync: all data must use shared Supabase tables; no duplicated/separate state between Sewdle and Club.
