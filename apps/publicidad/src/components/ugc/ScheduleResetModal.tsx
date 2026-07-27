import { useState } from 'react';
import { X, CalendarClock, AlertTriangle } from 'lucide-react';
import type { RankingResetMode, RankingSchedule } from '@/hooks/useAdminDashboard';

interface ScheduleResetModalProps {
  schedule: RankingSchedule;
  onClose: () => void;
  onConfirm: (mode: RankingResetMode, day: number | null, at: string | null) => Promise<void>;
}

const formatFull = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(iso));

/** Valor para <input type="datetime-local"> a partir de ahora + N días, en hora local. */
const defaultLocalDateTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(0, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function ScheduleResetModal({ schedule, onClose, onConfirm }: ScheduleResetModalProps) {
  const [mode, setMode] = useState<RankingResetMode>(schedule.mode);
  const [day, setDay] = useState<number>(schedule.day ?? 1);
  const [at, setAt] = useState<string>(
    schedule.mode === 'once' && schedule.nextResetAt
      ? (() => {
          const d = new Date(schedule.nextResetAt);
          const pad = (n: number) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        })()
      : defaultLocalDateTime()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'once') {
        const parsed = new Date(at);
        if (Number.isNaN(parsed.getTime())) throw new Error('Fecha inválida');
        if (parsed.getTime() <= Date.now()) throw new Error('La fecha debe ser futura');
        await onConfirm('once', null, parsed.toISOString());
      } else if (mode === 'monthly') {
        await onConfirm('monthly', day, null);
      } else {
        await onConfirm('off', null, null);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la programación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50">
            <CalendarClock className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Programar reinicio</h3>
            <p className="text-sm text-gray-500">El ranking se reinicia solo</p>
          </div>
        </div>

        {schedule.mode !== 'off' && schedule.nextResetAt && (
          <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">Programado ahora</p>
            <p className="mt-0.5 text-sm font-medium text-indigo-900">{formatFull(schedule.nextResetAt)}</p>
            <p className="text-[11px] text-indigo-600">
              {schedule.mode === 'monthly' ? `Cada mes el día ${schedule.day}` : 'Una sola vez'}
            </p>
          </div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {([
            { id: 'off', label: 'Ninguno' },
            { id: 'monthly', label: 'Mensual' },
            { id: 'once', label: 'Una vez' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`h-9 rounded-lg text-xs font-semibold transition ${
                mode === id ? 'bg-white text-gray-950 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'monthly' && (
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-gray-600">Día del mes</span>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>Día {d}</option>
              ))}
            </select>
            <span className="mt-1.5 block text-[11px] text-gray-400">
              A las 00:00 hora Colombia. Máximo 28 para que exista en todos los meses.
            </span>
          </label>
        )}

        {mode === 'once' && (
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-gray-600">Fecha y hora</span>
            <input
              type="datetime-local"
              value={at}
              onChange={(e) => setAt(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-400"
            />
            <span className="mt-1.5 block text-[11px] text-gray-400">
              Se reinicia una sola vez y queda desprogramado.
            </span>
          </label>
        )}

        {mode === 'off' && (
          <p className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[11px] text-gray-500">
            Sin reinicio automático. El ranking solo se reinicia si presionas «Reiniciar ranking» a mano.
          </p>
        )}

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11px] text-amber-800">
            Al reiniciar, el período actual se cierra y queda guardado en el historial. No se borra ningún dato.
          </p>
        </div>

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-500 transition-colors hover:border-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
