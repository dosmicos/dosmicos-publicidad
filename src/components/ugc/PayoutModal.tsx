import { useState } from 'react';
import { X, Wallet } from 'lucide-react';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

interface PayoutModalProps {
  creatorName: string;
  pendingBalance: number;
  linkId: string;
  onClose: () => void;
  onConfirm: (linkId: string, amount: number) => Promise<void>;
}

export default function PayoutModal({
  creatorName,
  pendingBalance,
  linkId,
  onClose,
  onConfirm,
}: PayoutModalProps) {
  const [amount, setAmount] = useState(pendingBalance.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!parsed || parsed <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    if (parsed > pendingBalance) {
      setError(`El monto no puede ser mayor al saldo disponible (${formatCOP(pendingBalance)})`);
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
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 z-10"
        style={{ background: 'rgba(20,20,26,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(34,197,94,0.12)' }}
          >
            <Wallet className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Registrar Pago</h3>
            <p className="text-gray-500 text-sm">{creatorName}</p>
          </div>
        </div>

        <div className="rounded-xl px-4 py-3 mb-4 border border-green-400/20" style={{ background: 'rgba(34,197,94,0.05)' }}>
          <p className="text-gray-500 text-xs mb-0.5">Saldo disponible</p>
          <p className="text-green-400 text-xl font-bold">{formatCOP(pendingBalance)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Monto a registrar</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1"
              className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
              style={{
                background: '#1a1a22',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: loading ? '#16a34a99' : '#16a34a' }}
            >
              {loading ? 'Guardando…' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
