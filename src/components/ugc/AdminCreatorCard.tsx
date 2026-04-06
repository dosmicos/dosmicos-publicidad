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
} from 'lucide-react';
import type { CreatorWithLink } from '@/hooks/useAdminDashboard';
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
    return (
      <img
        src={url}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border border-gray-700 shrink-0"
      />
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
      style={{ background: 'rgba(255,92,2,0.1)', color: '#ff5c02' }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

interface AdminCreatorCardProps {
  creator: CreatorWithLink;
  onRegisterPayout: (linkId: string, amount: number) => Promise<void>;
  onCreateLink: (creatorId: string, discountValue: number, commissionRate: number) => Promise<void>;
  onDeleteLink: (linkId: string) => Promise<void>;
  onUpdateCommission: (linkId: string, rate: number) => Promise<void>;
}

export default function AdminCreatorCard({
  creator,
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
  const [actionError, setActionError] = useState('');

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
    if (!rate || rate <= 0) return;
    try {
      await onUpdateCommission(link.id, rate);
      setEditingRate(false);
    } catch (err: any) {
      setActionError(err.message || 'Error al actualizar comisión');
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
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(20,20,26,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Creator header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar url={creator.avatar_url} name={creator.name} />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{creator.name}</p>
            {creator.instagram_handle && (
              <p className="text-gray-500 text-xs">@{creator.instagram_handle}</p>
            )}
          </div>
          {/* Pending balance badge */}
          {link && link.pending_balance > 0 && (
            <div
              className="px-2 py-1 rounded-lg text-xs font-semibold text-green-400 shrink-0"
              style={{ background: 'rgba(34,197,94,0.1)' }}
            >
              {formatCOP(link.pending_balance)}
            </div>
          )}
        </div>

        {link ? (
          <>
            {/* Link URL */}
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
              style={{ background: 'rgba(255,92,2,0.06)', border: '1px solid rgba(255,92,2,0.15)' }}
            >
              <Link2 className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              <span className="text-orange-300 text-xs truncate flex-1">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 text-orange-400/70 hover:text-orange-400 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-gray-500 text-xs flex items-center justify-center gap-1 mb-0.5">
                  <ShoppingBag className="h-3 w-3" />
                </p>
                <p className="text-white text-sm font-bold">{link.total_orders}</p>
                <p className="text-gray-600 text-xs">pedidos</p>
              </div>
              <div className="text-center rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-gray-500 text-xs flex items-center justify-center gap-1 mb-0.5">
                  <TrendingUp className="h-3 w-3" />
                </p>
                <p className="text-yellow-400 text-sm font-bold">{formatCOP(link.total_commission)}</p>
                <p className="text-gray-600 text-xs">comisión total</p>
              </div>
              <div className="text-center rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-gray-500 text-xs flex items-center justify-center gap-1 mb-0.5">
                  <Wallet className="h-3 w-3" />
                </p>
                <p className="text-green-400 text-sm font-bold">{formatCOP(link.pending_balance)}</p>
                <p className="text-gray-600 text-xs">pendiente</p>
              </div>
            </div>

            {/* Commission rate */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gray-500 text-xs shrink-0">Comisión:</span>
              {editingRate ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    value={rateValue}
                    onChange={(e) => setRateValue(e.target.value)}
                    min="1"
                    max="100"
                    step="0.5"
                    className="w-16 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                    style={{ background: '#1a1a22', border: '1px solid rgba(255,255,255,0.1)' }}
                    autoFocus
                  />
                  <span className="text-gray-500 text-xs">%</span>
                  <button
                    onClick={handleSaveRate}
                    className="text-xs px-2 py-1 rounded-lg text-white"
                    style={{ background: '#ff5c02' }}
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => { setEditingRate(false); setRateValue(link.commission_rate.toString()); }}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingRate(true)}
                  className="flex items-center gap-1 text-orange-400 text-xs hover:text-orange-300 transition-colors"
                >
                  <span className="font-semibold">{link.commission_rate}%</span>
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {link.pending_balance > 0 && (
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: '#15803d' }}
                >
                  Registrar Pago
                </button>
              )}
              <button
                onClick={handleDeleteLink}
                disabled={deletingLink}
                className="py-2 px-3 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors disabled:opacity-50"
              >
                {deletingLink ? '…' : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #ff5c02 0%, #ff7a2e 100%)' }}
          >
            Crear Link de Descuento
          </button>
        )}

        {actionError && (
          <p className="text-red-400 text-xs mt-2">{actionError}</p>
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
