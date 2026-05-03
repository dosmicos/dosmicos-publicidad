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
    maximumFractionDigits: 0,
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
    return <img src={url} alt={name} className="h-10 w-10 rounded-xl border border-gray-100 object-cover" />;
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-sm font-semibold text-gray-600">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function StatusBadge({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      {children}
    </span>
  );
}

function Metric({ icon, label, value, tone = 'gray' }: { icon: ReactNode; label: string; value: string | number; tone?: 'gray' | 'green' }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2">
      <div className="mb-0.5 flex items-center gap-1 text-gray-400">
        {icon}
        <p className="truncate text-[9px] font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className={`truncate text-xs font-semibold ${tone === 'green' ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</p>
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
      setTimeout(() => setCopied(false), 1800);
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
      <article className="rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm transition hover:border-gray-300 sm:p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(220px,0.7fr)_minmax(360px,1.25fr)_minmax(300px,1fr)] lg:items-start">
          <header className="flex min-w-0 items-start gap-2 lg:pt-1">
            <Avatar url={creator.avatar_url} name={creator.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-gray-950">{creator.name}</h3>
                  {creator.instagram_handle && (
                    <p className="truncate text-xs text-gray-400">@{creator.instagram_handle}</p>
                  )}
                </div>
                {link && link.pending_balance > 0 && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {formatCOP(link.pending_balance)}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <StatusBadge active={!!link}>Descuento</StatusBadge>
                <StatusBadge active={!!creator.portal_link}>Club</StatusBadge>
                <StatusBadge active={!!creator.upload_token}>Upload</StatusBadge>
                <StatusBadge active={(creator.toolkits?.length ?? 0) > 0}>{creator.toolkits?.length ?? 0} ideas</StatusBadge>
              </div>
            </div>
          </header>

          <div className="min-w-0 space-y-2">
            {link ? (
              <>
                <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                        <BadgePercent className="h-3.5 w-3.5 text-gray-500" /> Descuento clientes
                      </p>
                      <p className="text-[10px] text-gray-400">Para compradores</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteLink}
                      disabled={deletingLink}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Eliminar link de descuento"
                    >
                      {deletingLink ? '…' : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-gray-600">{shareUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gray-50 text-gray-500 transition hover:text-gray-900"
                      title="Copiar link de descuento"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {copyError && <p className="mt-1.5 text-[11px] text-red-500">{copyError}</p>}

                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    <Metric icon={<ShoppingBag className="h-3 w-3" />} label="Pedidos" value={link.total_orders} />
                    <Metric icon={<TrendingUp className="h-3 w-3" />} label="Comisión" value={formatCOP(link.total_commission)} />
                    <Metric icon={<Wallet className="h-3 w-3" />} label="Pendiente" value={formatCOP(link.pending_balance)} tone="green" />
                  </div>

                  <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 sm:flex-1">
                      <p className="truncate text-[11px] text-gray-500">
                        Desc. <span className="font-semibold text-gray-900">{link.discount_value}%</span> · Comisión
                      </p>
                      {editingRate ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <input
                            type="number"
                            value={rateValue}
                            onChange={(e) => setRateValue(e.target.value)}
                            min="1"
                            max="100"
                            step="0.5"
                            className="h-7 w-14 rounded-lg border border-gray-200 bg-white px-1.5 text-xs font-semibold text-gray-900 outline-none focus:border-gray-400"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveRate}
                            disabled={savingRate}
                            className="h-7 rounded-lg bg-gray-950 px-2 text-[11px] font-semibold text-white disabled:opacity-50"
                          >
                            {savingRate ? '…' : 'OK'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingRate(false); setRateValue(link.commission_rate.toString()); }}
                            className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:text-gray-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingRate(true)}
                          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-800 hover:border-gray-300"
                        >
                          {link.commission_rate}%
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:w-56">
                      <button
                        type="button"
                        onClick={() => setShowPayoutModal(true)}
                        disabled={link.pending_balance <= 0}
                        className="h-8 rounded-lg bg-gray-950 px-2 text-[11px] font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white"
                        title={link.pending_balance <= 0 ? 'Sin saldo pendiente' : 'Registrar pago'}
                      >
                        Pagar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPayouts((v) => !v)}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900"
                      >
                        <History className="h-3.5 w-3.5" />
                        {creatorPayouts.length > 0 ? `(${creatorPayouts.length})` : 'Hist.'}
                        {showPayouts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </section>

                {showPayouts && (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    {creatorPayouts.length === 0 ? (
                      <p className="py-2.5 text-center text-[11px] text-gray-400">Sin pagos registrados</p>
                    ) : (
                      creatorPayouts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-2 border-b border-gray-100 px-2.5 py-2 last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-gray-700">
                              {new Date(p.created_at).toLocaleDateString('es-CO', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </p>
                            {p.notes && <p className="truncate text-[11px] text-gray-400">{p.notes}</p>}
                          </div>
                          <p className="shrink-0 text-[11px] font-semibold text-emerald-600">{formatCOP(p.amount)}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <section className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-2.5 text-center lg:text-left">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">Sin descuento clientes</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">Solo si venderá con link/código.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="h-8 rounded-lg bg-gray-950 px-3 text-[11px] font-semibold text-white hover:bg-gray-800 sm:w-auto"
                  >
                    Crear descuento
                  </button>
                </div>
              </section>
            )}

            {actionError && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">{actionError}</p>
            )}
          </div>

          <div className="min-w-0">
            <AdminCreatorClubTools
              creator={creator}
              onGenerateClubLink={onGenerateClubLink}
              onRevokeClubLink={onRevokeClubLink}
              onGenerateUploadLink={onGenerateUploadLink}
              onDeactivateUploadLink={onDeactivateUploadLink}
              onAddToolkit={onAddToolkit}
              onDeactivateToolkit={onDeactivateToolkit}
            />
          </div>
        </div>
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
