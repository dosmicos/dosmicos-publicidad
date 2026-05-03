import { useState, type ReactNode } from 'react';
import {
  Copy,
  Check,
  Link2,
  Trash2,
  Wallet,
  ShoppingBag,
  TrendingUp,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  History,
  BadgePercent,
} from 'lucide-react';
import type { CreatorWithLink, PayoutRecord } from '@/hooks/useAdminDashboard';
import PayoutModal from './PayoutModal';
import CreateLinkModal from './CreateLinkModal';
import AdminCreatorClubTools from './AdminCreatorClubTools';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }
};

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt={name} className="h-12 w-12 rounded-2xl border border-gray-100 object-cover shadow-sm" />;
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-base font-black text-gray-600 shadow-sm">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function StatusBadge({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
      {children}
    </span>
  );
}

function MetricCard({ icon, label, value, tone = 'gray' }: { icon: ReactNode; label: string; value: string | number; tone?: 'gray' | 'green' }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-gray-400">
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className={`truncate text-sm font-black ${tone === 'green' ? 'text-green-700' : 'text-gray-950'}`}>{value}</p>
    </div>
  );
}

interface AdminCreatorCardProps {
  creator: CreatorWithLink;
  creatorPayouts: PayoutRecord[];
  onRegisterPayout: (linkId: string, amount: number) => Promise<void>;
  onCreateLink: (creatorId: string, discountValue: number, commissionRate: number) => Promise<void>;
  onDeleteLink: (linkId: string) => Promise<void>;
  onUpdateCommission: (linkId: string, rate: number) => Promise<void>;
  onGenerateClubLink: (creatorId: string) => Promise<string | undefined>;
  onRevokeClubLink: (creatorId: string) => Promise<void>;
  onGenerateUploadLink: (creatorId: string) => Promise<string | undefined>;
  onDeactivateUploadLink: (tokenId: string) => Promise<void>;
  onAddToolkit: (creatorId: string, toolkitUrl: string, label?: string) => Promise<void>;
  onDeactivateToolkit: (toolkitId: string) => Promise<void>;
}

export default function AdminCreatorCard({
  creator,
  creatorPayouts,
  onRegisterPayout,
  onCreateLink,
  onDeleteLink,
  onUpdateCommission,
  onGenerateClubLink,
  onRevokeClubLink,
  onGenerateUploadLink,
  onDeactivateUploadLink,
  onAddToolkit,
  onDeactivateToolkit,
}: AdminCreatorCardProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [rateValue, setRateValue] = useState(
    creator.discount_link?.commission_rate?.toString() ?? '10'
  );
  const [deletingLink, setDeletingLink] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showPayouts, setShowPayouts] = useState(false);

  const link = creator.discount_link;
  const shareUrl = link ? `https://ads.dosmicos.com/ugc/${link.redirect_token}` : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    setCopyError('');
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError('No pude copiar automáticamente. Selecciona el link y cópialo manualmente.');
    }
  };

  const handleSaveRate = async () => {
    if (!link) return;
    const rate = parseFloat(rateValue);
    if (!rate || rate <= 0) {
      setActionError('Ingresa una comisión válida mayor a 0');
      return;
    }
    setSavingRate(true);
    setActionError('');
    try {
      await onUpdateCommission(link.id, rate);
      setEditingRate(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al actualizar comisión');
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!link) return;
    if (!window.confirm(`¿Eliminar el link de ${creator.name}? Esto también eliminará el descuento en Shopify.`)) return;
    setDeletingLink(true);
    setActionError('');
    try {
      await onDeleteLink(link.id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al eliminar link');
    } finally {
      setDeletingLink(false);
    }
  };

  return (
    <>
      <article className="flex h-full flex-col gap-4 rounded-[30px] border border-gray-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5">
        <header className="flex items-start gap-3">
          <Avatar url={creator.avatar_url} name={creator.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black tracking-tight text-gray-950">{creator.name}</h3>
                {creator.instagram_handle && (
                  <p className="truncate text-sm font-medium text-gray-400">@{creator.instagram_handle}</p>
                )}
              </div>
              {link && link.pending_balance > 0 && (
                <div className="shrink-0 rounded-2xl border border-green-100 bg-green-50 px-2.5 py-1 text-xs font-black text-green-700">
                  {formatCOP(link.pending_balance)}
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge active={!!link}>Descuento</StatusBadge>
              <StatusBadge active={!!creator.portal_link}>Club</StatusBadge>
              <StatusBadge active={!!creator.upload_token}>Upload</StatusBadge>
              <StatusBadge active={(creator.toolkits?.length ?? 0) > 0}>{creator.toolkits?.length ?? 0} ideas</StatusBadge>
            </div>
          </div>
        </header>

        {link ? (
          <>
            <section className="rounded-[24px] border border-gray-200 bg-white p-3.5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gray-100 text-gray-700">
                    <BadgePercent className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-950">Link descuento clientes</p>
                    <p className="text-xs text-gray-500">Este sí va para compradores.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteLink}
                  disabled={deletingLink}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Eliminar link de descuento"
                >
                  {deletingLink ? '…' : <Trash2 className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <Link2 className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700">{shareUrl}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-gray-500 shadow-sm transition hover:text-gray-900"
                  title="Copiar link de descuento"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              {copyError && <p className="mt-2 text-xs text-red-500">{copyError}</p>}

              <div className="mt-3 grid grid-cols-3 gap-2">
                <MetricCard icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Pedidos" value={link.total_orders} />
                <MetricCard icon={<TrendingUp className="h-3.5 w-3.5" />} label="Comisión" value={formatCOP(link.total_commission)} />
                <MetricCard icon={<Wallet className="h-3.5 w-3.5" />} label="Pendiente" value={formatCOP(link.pending_balance)} tone="green" />
              </div>

              <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-gray-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-gray-500">
                  Descuento <span className="font-black text-gray-900">{link.discount_value}%</span> · Comisión
                </p>
                {editingRate ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={rateValue}
                      onChange={(e) => setRateValue(e.target.value)}
                      min="1"
                      max="100"
                      step="0.5"
                      className="h-9 w-16 rounded-xl border border-gray-200 bg-white px-2 text-sm font-bold text-gray-900 outline-none focus:border-gray-400"
                      autoFocus
                    />
                    <span className="text-xs text-gray-400">%</span>
                    <button
                      type="button"
                      onClick={handleSaveRate}
                      disabled={savingRate}
                      className="h-9 rounded-xl bg-gray-950 px-3 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {savingRate ? '…' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingRate(false); setRateValue(link.commission_rate.toString()); }}
                      className="grid h-9 w-9 place-items-center rounded-xl text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingRate(true)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-black text-gray-800 transition hover:border-gray-300"
                  >
                    {link.commission_rate}%
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </section>

            <section className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <button
                type="button"
                onClick={() => setShowPayoutModal(true)}
                disabled={link.pending_balance <= 0}
                className="min-h-11 rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
                title={link.pending_balance <= 0 ? 'Sin saldo pendiente' : 'Registrar pago'}
              >
                Registrar pago
              </button>
              <button
                type="button"
                onClick={() => setShowPayouts((v) => !v)}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
              >
                <History className="h-4 w-4" />
                Historial {creatorPayouts.length > 0 ? `(${creatorPayouts.length})` : ''}
                {showPayouts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </section>

            {showPayouts && (
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                {creatorPayouts.length === 0 ? (
                  <p className="py-3 text-center text-xs text-gray-400">Sin pagos registrados</p>
                ) : (
                  creatorPayouts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2.5 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-700">
                          {new Date(p.created_at).toLocaleDateString('es-CO', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                        {p.notes && <p className="truncate text-xs text-gray-400">{p.notes}</p>}
                      </div>
                      <p className="shrink-0 text-xs font-black text-green-600">{formatCOP(p.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <section className="rounded-[24px] border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
            <BadgePercent className="mx-auto mb-2 h-6 w-6 text-gray-400" />
            <p className="text-sm font-black text-gray-950">No tiene link de descuento</p>
            <p className="mt-1 text-xs text-gray-500">Créalo solo si esta creadora va a vender con código/link para clientes.</p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-3 min-h-11 w-full rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-gray-800"
            >
              Crear link descuento clientes
            </button>
          </section>
        )}

        <AdminCreatorClubTools
          creator={creator}
          onGenerateClubLink={onGenerateClubLink}
          onRevokeClubLink={onRevokeClubLink}
          onGenerateUploadLink={onGenerateUploadLink}
          onDeactivateUploadLink={onDeactivateUploadLink}
          onAddToolkit={onAddToolkit}
          onDeactivateToolkit={onDeactivateToolkit}
        />

        {actionError && (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{actionError}</p>
        )}
      </article>

      {showPayoutModal && link && (
        <PayoutModal
          creatorName={creator.name}
          pendingBalance={link.pending_balance}
          linkId={link.id}
          onClose={() => setShowPayoutModal(false)}
          onConfirm={onRegisterPayout}
        />
      )}

      {showCreateModal && (
        <CreateLinkModal
          creatorName={creator.name}
          creatorId={creator.id}
          onClose={() => setShowCreateModal(false)}
          onConfirm={onCreateLink}
        />
      )}
    </>
  );
}
