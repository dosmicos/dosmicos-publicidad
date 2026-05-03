import { Wallet } from 'lucide-react';
import type { RankingEntry } from '@/hooks/usePublicRanking';

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
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border border-gray-700"
      style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80' }}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function BalancesSection({ balances }: { balances: RankingEntry[] }) {
  if (balances.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-3">
          <Wallet className="h-7 w-7 text-green-400/50" />
        </div>
        <p className="text-white font-semibold mb-1">Sin saldos pendientes</p>
        <p className="text-gray-500 text-sm">Todas las comisiones han sido pagadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {balances.map((entry) => (
        <div
          key={entry.instagram_handle || entry.creator_name}
          className="flex items-center gap-3 rounded-xl px-4 py-3 border border-green-400/15"
          style={{ background: 'rgba(34,197,94,0.04)' }}
        >
          <Avatar url={entry.avatar_url} name={entry.creator_name} />

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{entry.creator_name}</p>
            {entry.instagram_handle && (
              <p className="text-gray-500 text-xs">@{entry.instagram_handle}</p>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="text-green-400 text-sm font-bold">{formatCOP(entry.pending_balance)}</p>
            <p className="text-gray-600 text-xs flex items-center justify-end gap-0.5">
              <Wallet className="h-3 w-3" /> pendiente
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
