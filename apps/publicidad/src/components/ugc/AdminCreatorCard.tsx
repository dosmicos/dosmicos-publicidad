import { useState } from 'react';
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
} from 'lucide-react';
import type { CreatorWithLink, PayoutRecord } from '@/hooks/useAdminDashboard';
import PayoutModal from './PayoutModal';
import CreateLinkModal from './CreateLinkModal';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
      {name?.[0]?.toUpperCase() ?? '?'}
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
}

export default function AdminCreatorCard({
  creator,
  creatorPayouts,
  onRegisterPayout,
  onCreateLink,
  onDeleteLink,
  onUpdateCommission,
}: AdminCreatorCardProps) {
  const [copied, setCopied] = useState(false);
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

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    } catch (err: any) {
      setActionError(err.message || 'Error al actualizar comisión');
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
    } catch (err: any) {
      setActionError(err.message || 'Error al eliminar link');
    } finally {
      setDeletingLink(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
        {/* Creator header */}
        <div className="flex items-center gap-3">
          <Avatar url={creator.avatar_url} name={creator.name} />
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-semibold text-sm truncate">{creator.name}</p>
            {creator.instagram_handle && (
              <p className="text-gray-400 text-xs">@{creator.instagram_handle}</p>
            )}
          </div>
          {link && link.pending_balance > 0 && (
            <div className="px-2 py-1 rounded-lg text-xs font-semibold text-green-700 bg-green-50 border border-green-100 shrink-0">
              {formatCOP(link.pending_balance)}
            </div>
          )}
        </div>

        {link ? (
          <>
            {/* Link URL */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <Link2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-600 text-xs truncate flex-1">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center rounded-xl py-2 bg-gray-50 border border-gray-100">
                <ShoppingBag className="h-3 w-3 text-gray-400 mx-auto mb-1" />
                <p className="text-gray-900 text-sm font-bold">{link.total_orders}</p>
                <p className="text-gray-400 text-xs">pedidos</p>
              </div>
              <div className="text-center rounded-xl py-2 bg-gray-50 border border-gray-100">
                <TrendingUp className="h-3 w-3 text-gray-400 mx-auto mb-1" />
                <p className="text-gray-900 text-xs font-bold leading-tight">{formatCOP(link.total_commission)}</p>
                <p className="text-gray-400 text-xs">comisión</p>
              </div>
              <div className="text-center rounded-xl py-2 bg-gray-50 border border-gray-100">
                <Wallet className="h-3 w-3 text-gray-400 mx-auto mb-1" />
                <p className="text-green-600 text-xs font-bold leading-tight">{formatCOP(link.pending_balance)}</p>
                <p className="text-gray-400 text-xs">pendiente</p>
              </div>
            </div>

            {/* Commission rate */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs shrink-0">
                Descuento: {link.discount_value}% · Comisión:
              </span>
              {editingRate ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    value={rateValue}
                    onChange={(e) => setRateValue(e.target.value)}
                    min="1" max="100" step="0.5"
                    className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-gray-900 text-xs focus:outline-none focus:border-gray-400"
                    autoFocus
                  />
                  <span className="text-gray-400 text-xs">%</span>
                  <button
                    onClick={handleSaveRate}
                    disabled={savingRate}
                    className="text-xs px-2 py-1 rounded-lg bg-gray-900 text-white disabled:opacity-50 min-w-[32px]"
                  >
                    {savingRate ? '…' : 'OK'}
                  </button>
                  <button
                    onClick={() => { setEditingRate(false); setRateValue(link.commission_rate.toString()); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingRate(true)}
                  className="flex items-center gap-1 text-gray-700 text-xs hover:text-gray-900 transition-colors"
                >
                  <span className="font-semibold">{link.commission_rate}%</span>
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={link.pending_balance <= 0}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={link.pending_balance <= 0 ? 'Sin saldo pendiente' : 'Registrar pago'}
              >
                Registrar Pago
              </button>
              <button
                onClick={() => setShowPayouts((v) => !v)}
                className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs text-gray-500 hover:text-gray-700 border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <History className="h-3.5 w-3.5" />
                {creatorPayouts.length > 0 && (
                  <span className="text-gray-400">{creatorPayouts.length}</span>
                )}
                {showPayouts ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button
                onClick={handleDeleteLink}
                disabled={deletingLink}
                className="py-2 px-3 rounded-xl text-xs text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
              >
                {deletingLink ? '…' : <Trash2 className="h-4 w-4" />}
              </button>
            </div>

            {/* Payout history (expandable) */}
            {showPayouts && (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                {creatorPayouts.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-3">Sin pagos registrados</p>
                ) : (
                  creatorPayouts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-gray-600 text-xs">
                          {new Date(p.created_at).toLocaleDateString('es-CO', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                        {p.notes && <p className="text-gray-400 text-xs">{p.notes}</p>}
                      </div>
                      <p className="text-green-600 text-xs font-semibold">{formatCOP(p.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors"
          >
            Crear Link de Descuento
          </button>
        )}

        {actionError && (
          <p className="text-red-500 text-xs">{actionError}</p>
        )}
      </div>

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
