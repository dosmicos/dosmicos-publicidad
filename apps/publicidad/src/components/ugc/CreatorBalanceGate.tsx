import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RankingEntry } from '@/hooks/usePublicRanking';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

interface BalanceResult {
  creator_name: string;
  instagram_handle: string;
  avatar_url: string | null;
  pending_balance: number;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt={name} className="w-14 h-14 rounded-full object-cover" />;
  }
  return (
    <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium bg-gray-100 text-gray-600">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

/** Full admin view — all balances */
function AdminBalances({ balances }: { balances: RankingEntry[] }) {
  const withBalance = balances.filter((e) => e.pending_balance > 0);

  if (withBalance.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-2xl mb-3">✅</p>
        <p className="text-gray-900 font-medium text-sm">Sin saldos pendientes</p>
        <p className="text-gray-400 text-xs mt-1">Todas las comisiones han sido pagadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {withBalance.map((entry) => (
        <div
          key={entry.instagram_handle || entry.creator_name}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-gray-100"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-gray-100 text-gray-600 shrink-0">
            {entry.creator_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-sm font-medium truncate">{entry.creator_name}</p>
            {entry.instagram_handle && (
              <p className="text-gray-400 text-xs">@{entry.instagram_handle}</p>
            )}
          </div>
          <p className="text-gray-900 text-sm font-semibold shrink-0">
            {formatCOP(entry.pending_balance)}
          </p>
        </div>
      ))}
    </div>
  );
}

interface Props {
  isAdmin: boolean;
  adminBalances?: RankingEntry[];
}

export default function CreatorBalanceGate({ isAdmin, adminBalances = [] }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAdmin) {
    return <AdminBalances balances={adminBalances} />;
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-gray-100 p-6 text-center">
        <Avatar url={result.avatar_url} name={result.creator_name} />
        <div className="mt-4">
          <p className="text-gray-900 font-semibold">{result.creator_name}</p>
          {result.instagram_handle && (
            <p className="text-gray-400 text-xs mt-0.5">@{result.instagram_handle}</p>
          )}
        </div>
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Saldo acumulado pendiente</p>
          {result.pending_balance > 0 ? (
            <p className="text-3xl font-semibold text-gray-900">
              {formatCOP(result.pending_balance)}
            </p>
          ) : (
            <p className="text-gray-500 text-sm mt-2">Sin saldo pendiente por el momento.</p>
          )}
        </div>
        <button
          onClick={() => { setResult(null); setCode(''); setNotFound(false); }}
          className="mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Consultar otro código
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const { data, error: rpcError } = await (supabase as any).rpc(
        'get_creator_balance_by_code',
        { p_code: code.trim().toUpperCase() }
      );
      if (rpcError) throw rpcError;
      if (!data || data.length === 0) {
        setNotFound(true);
      } else {
        setResult(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al consultar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 p-6">
      <div className="text-center mb-6">
        <p className="text-2xl mb-3">🔒</p>
        <p className="text-gray-900 font-medium text-sm">Ingresa tu código de acceso</p>
        <p className="text-gray-400 text-xs mt-1">
          Tu código es único. Pídelo a tu admin de Dosmicos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setNotFound(false);
            setError(null);
          }}
          placeholder="Ej: AB12CD"
          maxLength={6}
          className={`w-full text-center text-xl font-mono tracking-widest border rounded-xl px-4 py-3 outline-none transition-colors bg-white ${
            notFound
              ? 'border-red-200 focus:border-red-300'
              : 'border-gray-200 focus:border-gray-400'
          }`}
          autoComplete="off"
          spellCheck={false}
        />

        {notFound && (
          <p className="text-red-400 text-xs text-center">
            Código no encontrado. Verifica e intenta de nuevo.
          </p>
        )}
        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || code.length < 2}
          className="w-full bg-gray-900 text-white text-sm font-medium rounded-xl py-3 hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Consultando...
            </span>
          ) : (
            'Ver mi saldo'
          )}
        </button>
      </form>
    </div>
  );
}
