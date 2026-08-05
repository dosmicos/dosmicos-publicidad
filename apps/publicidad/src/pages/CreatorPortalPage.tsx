import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RankingSection from '@/components/ugc/RankingSection';
import { usePublicRanking } from '@/hooks/usePublicRanking';
import { supabase } from '@/integrations/supabase/client';

const formatCOP = (n?: number | null) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.ceil(Number(n || 0)));

interface PortalCreator {
  id: string;
  name: string;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  avatar_url: string | null;
}

interface PortalDiscountLink {
  id: string;
  public_url: string;
  discount_value: number;
  commission_rate: number;
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  total_paid_out: number;
  pending_balance: number;
}

interface PortalUpload {
  upload_url: string | null;
  is_active: boolean;
  expires_at?: string | null;
  upload_count?: number | null;
  max_uploads?: number | null;
}

type PortalAssignmentStatus =
  | 'assigned'
  | 'viewed'
  | 'accepted'
  | 'submitted'
  | 'approved'
  | 'tested'
  | 'completed'
  | 'cancelled';

const assignmentStatusLabel: Partial<Record<PortalAssignmentStatus, string>> = {
  accepted: 'Aceptada ✓',
  submitted: 'Entregada',
  approved: 'Aprobada',
  tested: 'Usada en ads',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

interface PortalToolkit {
  id: string;
  label: string;
  url: string;
  campaign_id: string | null;
  sort_order: number;
  week_start?: string | null;
  status?: PortalAssignmentStatus | null;
  due_at?: string | null;
  slot?: 'primary' | 'secondary' | null;
  brief?: {
    id: string;
    title: string;
    hook: string;
    proof: string;
    format: string;
    cta: string | null;
    guardrails: string[];
    scene_plan?: string[];
    talking_points?: string[];
    required_shots?: string[];
    script_example?: string;
  } | null;
}

interface PortalOrder {
  shopify_order_number: string | null;
  order_total: number | null;
  commission_amount: number | null;
  order_date: string | null;
}

interface CreatorPortalPayload {
  valid: boolean;
  error?: string;
  creator?: PortalCreator;
  discount_link?: PortalDiscountLink | null;
  upload?: PortalUpload | null;
  toolkits?: PortalToolkit[];
  recent_orders?: PortalOrder[];
}

interface RpcError { message: string }
interface PublicSupabaseClient {
  rpc<T>(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: T | null; error: RpcError | null }>;
}

const publicSupabase = supabase as unknown as PublicSupabaseClient;

function CopyButton({ value, label = 'Copiar' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      {copied ? 'Copiado ✓' : label}
    </button>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-4 bg-white">
      <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="text-gray-900 text-lg font-semibold leading-tight">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

function CreatorAvatar({ url, name }: { url: string | null; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const cleanName = name?.trim() || '?';
  const initial = cleanName[0]?.toUpperCase() || '?';
  const palette = [
    'from-orange-500 to-amber-300 text-white',
    'from-slate-900 to-slate-600 text-white',
    'from-rose-500 to-orange-400 text-white',
    'from-violet-500 to-fuchsia-400 text-white',
    'from-sky-500 to-cyan-400 text-white',
  ];
  const color = palette[cleanName.charCodeAt(0) % palette.length];

  if (url && !imageFailed) {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white bg-white shadow-sm ring-1 ring-orange-100">
        <img
          src={url}
          alt={cleanName}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-xl font-semibold tracking-tight shadow-sm ring-1 ring-orange-100`}>
      {initial}
    </div>
  );
}

function InvalidPortalState() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-center">
          <img src="/logo-dosmicos.png" alt="Dosmicos" className="h-8 object-contain" />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-5 py-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-gray-900 text-lg font-semibold mb-2">Link no válido</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Este link Club no existe, fue revocado o expiró. Pídele al equipo de Dosmicos que te genere uno nuevo.
        </p>
        <Link to="/" className="inline-flex rounded-xl bg-gray-900 text-white text-sm font-medium px-4 py-3">
          Ver ranking público
        </Link>
      </main>
    </div>
  );
}

export default function CreatorPortalPage() {
  const { token = '' } = useParams();
  const { rankingByContent } = usePublicRanking('dosmicos-org');
  const [portal, setPortal] = useState<CreatorPortalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [ideaError, setIdeaError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPortal = async () => {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await publicSupabase.rpc<CreatorPortalPayload>('get_ugc_creator_portal_by_token', {
        p_token: token,
      });

      if (cancelled) return;
      if (rpcError) {
        setError(rpcError.message || 'No se pudo cargar tu portal');
        setPortal(null);
      } else {
        setPortal(data as CreatorPortalPayload);
      }
      setLoading(false);
    };

    loadPortal();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const creator = portal?.creator;
  const discount = portal?.discount_link || null;
  const upload = portal?.upload || null;
  const toolkits = portal?.toolkits || [];
  const recentOrders = portal?.recent_orders || [];

  const acceptIdea = async (assignmentId: string) => {
    setAcceptingId(assignmentId);
    setIdeaError(null);
    try {
      const { data, error: rpcError } = await publicSupabase.rpc<boolean>('track_ugc_toolkit_assignment_event', {
        p_token: token,
        p_assignment_id: assignmentId,
        p_event_type: 'accepted',
      });
      if (rpcError || data !== true) {
        setIdeaError('No pudimos guardar la confirmación. Inténtalo de nuevo.');
        return;
      }
      setPortal((current) => current ? {
        ...current,
        toolkits: (current.toolkits || []).map((toolkit) => toolkit.id === assignmentId ? { ...toolkit, status: 'accepted' } : toolkit),
      } : current);
    } catch {
      setIdeaError('No pudimos guardar la confirmación. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setAcceptingId(null);
    }
  };

  const creatorRankingEntry = useMemo(() => {
    if (!creator) return null;
    const normalizedHandle = creator.instagram_handle?.replace('@', '').toLowerCase();
    return rankingByContent.find((entry) => {
      const entryHandle = entry.instagram_handle?.replace('@', '').toLowerCase();
      return entryHandle && normalizedHandle && entryHandle === normalizedHandle;
    }) ?? null;
  }, [creator, rankingByContent]);

  const creatorRanking = creatorRankingEntry && creatorRankingEntry.content_points > 0
    ? creatorRankingEntry.rank
    : null;
  const creatorContentCount = creatorRankingEntry?.eligible_content_count ?? 0;
  const creatorContentPoints = creatorRankingEntry?.content_points ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  if (error || !portal?.valid || !creator) {
    return <InvalidPortalState />;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-center relative">
          <img src="/logo-dosmicos.png" alt="Dosmicos" className="h-8 object-contain" />
          <Link to="/login" className="absolute right-5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Admin
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-7 pb-16">
        <section className="rounded-3xl border border-gray-100 p-5 bg-gradient-to-b from-orange-50 to-white mb-5">
          <div className="flex items-center gap-3">
            <CreatorAvatar url={creator.avatar_url} name={creator.name} />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-widest text-orange-500 font-medium mb-1">Club Dosmicos</p>
              <h1 className="text-gray-900 font-semibold text-lg truncate">Hola, {creator.name}</h1>
              <p className="text-gray-500 text-sm truncate">
                {[creator.instagram_handle && `@${creator.instagram_handle.replace('@', '')}`, creator.tiktok_handle && `TikTok: @${creator.tiktok_handle.replace('@', '')}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard label="Ventas" value={discount?.total_orders ?? 0} hint="Compras atribuidas a tu link" />
          <MetricCard label="Comisiones" value={formatCOP(discount?.total_commission)} hint="Ganancias acumuladas" />
          <MetricCard label="Saldo" value={formatCOP(discount?.pending_balance)} hint="Pendiente por pagar" />
          <MetricCard
            label="Ranking contenido"
            value={creatorRanking ? `#${creatorRanking}` : '—'}
            hint={`${creatorContentPoints} ${creatorContentPoints === 1 ? 'punto' : 'puntos'} · ${creatorContentCount} ${creatorContentCount === 1 ? 'pieza' : 'piezas'}`}
          />
        </section>

        <section className="rounded-2xl border border-gray-100 p-5 mb-5">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">Mi link de descuento</p>
          {discount?.public_url ? (
            <div className="space-y-3">
              <p className="text-gray-600 text-sm leading-relaxed">
                Compártelo con tu comunidad. Tu descuento es de <strong className="text-gray-900">{discount.discount_value}%</strong> y tu comisión es <strong className="text-gray-900">{discount.commission_rate}%</strong>.
              </p>
              <div className="flex items-center gap-2">
                <input readOnly value={discount.public_url} className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 bg-gray-50" />
                <CopyButton value={discount.public_url} />
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Todavía no tienes link de descuento activo. Escríbele al equipo de Dosmicos.</p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 p-5 mb-5">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">Subir contenido</p>
          {upload?.is_active && upload?.upload_url ? (
            <div className="space-y-3">
              <p className="text-gray-600 text-sm leading-relaxed">
                Puedes subir fotos y videos. Comparte las fotos que tomes con los productos y los videos que hagas: videos verticales de 15–30 segundos y buena calidad.
              </p>
              <a href={upload.upload_url} className="block w-full rounded-xl bg-gray-900 text-white text-sm font-medium text-center py-3.5 hover:bg-gray-700 transition-colors">
                Subir contenido
              </a>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No hay link de subida activo en este momento.</p>
          )}
        </section>

        <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5 mb-5">
          <p className="text-xs uppercase tracking-widest text-orange-500 font-medium mb-2">Idea de contenido</p>
          {toolkits.length > 0 ? (
            <div className="space-y-3">
              {toolkits.map((toolkit) => toolkit.brief ? (
                <article key={toolkit.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-orange-700">
                        {toolkit.slot === 'secondary' ? 'Riff adicional' : 'Idea principal'}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-gray-900">{toolkit.brief.title}</h3>
                      {toolkit.week_start && (
                        <p className="mt-1 text-xs text-gray-600">
                          Semana del {new Date(`${toolkit.week_start}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                        </p>
                      )}
                    </div>
                    {toolkit.status && assignmentStatusLabel[toolkit.status] && (
                      <span role="status" aria-live="polite" className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {assignmentStatusLabel[toolkit.status]}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600">
                    <div className="rounded-xl bg-orange-50 px-3 py-2.5">
                      <p className="text-xs font-medium uppercase tracking-widest text-orange-700">Hook sugerido</p>
                      <p className="mt-1 font-medium text-gray-900">“{toolkit.brief.hook}”</p>
                    </div>
                    <p><strong className="text-gray-900">Qué demostrar:</strong> {toolkit.brief.proof}</p>
                    <p><strong className="text-gray-900">Formato:</strong> {toolkit.brief.format}</p>
                    {toolkit.brief.scene_plan && toolkit.brief.scene_plan.length > 0 && (
                      <div className="rounded-xl border border-orange-100 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">Guía de grabación</p>
                        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-gray-700">
                          {toolkit.brief.scene_plan.map((scene, index) => <li key={`${scene}-${index}`}>{scene}</li>)}
                        </ol>
                      </div>
                    )}
                    {toolkit.brief.talking_points && toolkit.brief.talking_points.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Puntos que debes comunicar</p>
                        <ul className="mt-1.5 list-disc space-y-1 pl-5">
                          {toolkit.brief.talking_points.map((point, index) => <li key={`${point}-${index}`}>{point}</li>)}
                        </ul>
                      </div>
                    )}
                    {toolkit.brief.required_shots && toolkit.brief.required_shots.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Tomas que no pueden faltar</p>
                        <ul className="mt-1.5 list-disc space-y-1 pl-5">
                          {toolkit.brief.required_shots.map((shot, index) => <li key={`${shot}-${index}`}>{shot}</li>)}
                        </ul>
                      </div>
                    )}
                    {toolkit.brief.script_example && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Ejemplo de libreto</p>
                        <p className="mt-2 whitespace-pre-line font-medium text-gray-900">“{toolkit.brief.script_example}”</p>
                        <p className="mt-2 text-xs text-gray-500">Úsalo como guía y dilo con tus propias palabras; no necesitas memorizarlo.</p>
                      </div>
                    )}
                    {toolkit.brief.cta && <p><strong className="text-gray-900">Cierre:</strong> {toolkit.brief.cta}</p>}
                    {toolkit.brief.guardrails?.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-semibold text-gray-900">Cuidados importantes</p>
                        <ul className="flex flex-wrap gap-1.5" aria-label="Cuidados importantes">
                          {toolkit.brief.guardrails.map((guardrail, index) => (
                            <li key={`${guardrail}-${index}`} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">{guardrail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {toolkit.due_at && (
                      <p className="text-xs text-gray-600">Entrega sugerida: {new Date(toolkit.due_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}</p>
                    )}
                  </div>
                  {(toolkit.status === 'assigned' || toolkit.status === 'viewed') && (
                    <button
                      type="button"
                      onClick={() => acceptIdea(toolkit.id)}
                      disabled={acceptingId !== null}
                      aria-busy={acceptingId === toolkit.id}
                      className="mt-4 w-full rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
                    >
                      {acceptingId === toolkit.id ? 'Guardando…' : 'Entendido, haré esta idea'}
                    </button>
                  )}
                  {upload?.is_active && upload.upload_url
                    && toolkit.status
                    && !['assigned', 'viewed', 'cancelled'].includes(toolkit.status) && (
                    <a
                      href={`${upload.upload_url}${upload.upload_url.includes('?') ? '&' : '?'}assignment=${encodeURIComponent(toolkit.id)}${toolkit.campaign_id ? `&campaign=${encodeURIComponent(toolkit.campaign_id)}` : ''}`}
                      className="mt-3 block w-full rounded-xl border border-gray-900 py-3 text-center text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                    >
                      Subir contenido de esta idea
                    </a>
                  )}
                </article>
              ) : (
                <a
                  key={toolkit.id}
                  href={toolkit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-orange-200"
                >
                  {toolkit.label || 'Idea de contenido'} →
                </a>
              ))}
              {ideaError && (
                <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{ideaError}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Aún no tienes toolkit asignado. Mientras tanto, enfócate en mostrar uso real del producto y cerrar con tu link.</p>
          )}
        </section>

        {recentOrders.length > 0 && (
          <section className="rounded-2xl border border-gray-100 p-5 mb-6">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">Ventas recientes</p>
            <div className="space-y-2">
              {recentOrders.map((order, index) => (
                <div key={`${order.shopify_order_number || 'orden'}-${index}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.shopify_order_number || 'Orden'}</p>
                    <p className="text-xs text-gray-400">
                      {order.order_date ? new Date(order.order_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCOP(order.commission_amount)}</p>
                    <p className="text-xs text-gray-400">comisión</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pt-3 border-t border-gray-100">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">Ranking público</p>
            <h2 className="text-gray-900 text-xl font-semibold">Ranking de contenido</h2>
          </div>
          <RankingSection ranking={rankingByContent} metric="content" />
        </section>
      </main>

      <footer className="text-center pb-10">
        <p className="text-xs text-gray-300">Powered by Dosmicos</p>
      </footer>
    </div>
  );
}
