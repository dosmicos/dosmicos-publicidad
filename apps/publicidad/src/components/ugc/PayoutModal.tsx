import { useState } from 'react';
import { X, Wallet, Copy, Check, KeyRound } from 'lucide-react';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.ceil(n || 0));

const roundedCOP = (n: number) => Math.ceil(Math.max(n || 0, 0));

interface PayoutModalProps {
  creatorName: string;
  pendingBalance: number;
  linkId: string;
  breB?: string | null;
  onClose: () => void;
  onConfirm: (linkId: string, amount: number) => Promise<void>;
}

export default function PayoutModal({
  creatorName,
  pendingBalance,
  linkId,
  breB,
  onClose,
  onConfirm,
}: PayoutModalProps) {
  const payableBalance = roundedCOP(pendingBalance);
  const [amount, setAmount] = useState(payableBalance.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedBreB, setCopiedBreB] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const trimmedBreB = breB?.trim() ?? '';
  const hasBreB = trimmedBreB.length > 0;

  const handleCopyBreB = async () => {
    if (!hasBreB) return;
    try {
      await navigator.clipboard.writeText(trimmedBreB);
      setCopiedBreB(true);
      setCopyError(false);
      setTimeout(() => setCopiedBreB(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Math.ceil(parseFloat(amount.replace(/[^0-9.,]/g, '').replace(',', '.')));
    if (!parsed || parsed <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    if (parsed > payableBalance) {
      setError(`El monto no puede ser mayor al saldo disponible (${formatCOP(payableBalance)})`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(linkId, parsed);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white border border-gray-200 p-6 z-10 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-bold">Registrar Pago</h3>
            <p className="text-gray-500 text-sm">{creatorName}</p>
          </div>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 mb-4">
          <p className="text-gray-500 text-xs mb-0.5">Saldo disponible</p>
          <p className="text-green-700 text-xl font-bold">{formatCOP(payableBalance)}</p>
        </div>

        {/* Llave Bre-B */}
        {hasBreB ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
              <KeyRound className="h-4 w-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-[10px] uppercase tracking-wide leading-tight">Llave Bre-B</p>
                <p className="text-gray-900 text-sm font-mono truncate">{trimmedBreB}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyBreB}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copiar llave Bre-B"
              >
                {copiedBreB ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            {copyError && (
              <p className="text-amber-600 text-xs mt-1.5">
                No se pudo copiar — selecciona el texto manualmente.
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
            <KeyRound className="h-4 w-4 text-gray-300 shrink-0" />
            <p className="text-gray-400 text-xs">Sin llave Bre-B registrada</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-1.5">Monto a registrar</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              min="0"
              step="1"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
