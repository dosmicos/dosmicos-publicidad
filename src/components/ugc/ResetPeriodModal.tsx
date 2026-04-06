import { useState } from 'react';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';

interface ResetPeriodModalProps {
  currentStartDate: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ResetPeriodModal({
  currentStartDate,
  onClose,
  onConfirm,
}: ResetPeriodModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al reiniciar período');
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = currentStartDate
    ? new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(currentStartDate))
    : 'No definido';

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
            style={{ background: 'rgba(251,146,60,0.12)' }}
          >
            <RotateCcw className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Reiniciar Ranking</h3>
            <p className="text-gray-500 text-sm">Nuevo período de comisiones</p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 mb-4 border border-orange-400/20 space-y-1"
          style={{ background: 'rgba(251,146,60,0.05)' }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-orange-300 text-sm">
              El ranking del período actual se reiniciará a cero. Los datos históricos se conservan.
            </p>
          </div>
        </div>

        <p className="text-gray-500 text-xs mb-4">
          Período actual desde: <span className="text-gray-300">{formattedDate}</span>
        </p>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: loading ? '#c2410c99' : '#c2410c' }}
          >
            {loading ? 'Reiniciando…' : 'Reiniciar Período'}
          </button>
        </div>
      </div>
    </div>
  );
}
