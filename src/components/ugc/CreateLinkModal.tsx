import { useState } from 'react';
import { X, Link2 } from 'lucide-react';

interface CreateLinkModalProps {
  creatorName: string;
  creatorId: string;
  onClose: () => void;
  onConfirm: (creatorId: string, discountValue: number, commissionRate: number) => Promise<void>;
}

export default function CreateLinkModal({
  creatorName,
  creatorId,
  onClose,
  onConfirm,
}: CreateLinkModalProps) {
  const [discountValue, setDiscountValue] = useState('10');
  const [commissionRate, setCommissionRate] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const discount = parseFloat(discountValue);
    const commission = parseFloat(commissionRate);
    if (!discount || discount <= 0 || discount > 100) {
      setError('El descuento debe estar entre 1 y 100');
      return;
    }
    if (!commission || commission <= 0 || commission > 100) {
      setError('La comisión debe estar entre 1 y 100');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(creatorId, discount, commission);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear link');
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
            style={{ background: 'rgba(255,92,2,0.12)' }}
          >
            <Link2 className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Crear Link de Descuento</h3>
            <p className="text-gray-500 text-sm">{creatorName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">% Descuento para el cliente</label>
            <div className="relative">
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                min="1"
                max="100"
                step="1"
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none"
                style={{ background: '#1a1a22', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">% Comisión para la creadora</label>
            <div className="relative">
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                min="1"
                max="100"
                step="0.5"
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none"
                style={{ background: '#1a1a22', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
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
              style={{
                background: loading
                  ? '#cc4a02'
                  : 'linear-gradient(135deg, #ff5c02 0%, #ff7a2e 100%)',
              }}
            >
              {loading ? 'Creando…' : 'Crear Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
