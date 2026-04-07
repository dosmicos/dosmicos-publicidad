import { useState } from 'react';
import { usePublicRanking } from '@/hooks/usePublicRanking';
import RankingSection from '@/components/ugc/RankingSection';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(n);

interface CreatorResult {
  creator_name: string;
  instagram_handle: string;
  avatar_url: string | null;
  pending_balance: number;
  orders_in_period: number;
  commission_in_period: number;
}

interface OrderRow {
  shopify_order_number: string | null;
  order_date: string;
  order_total: number;
  commission_amount: number;
}

interface PayoutRow {
  amount: number;
  payout_type: string;
  notes: string | null;
  created_at: string;
}

function StatTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="w-3.5 h-3.5 rounded-full border border-gray-300 text-gray-400 text-[9px] leading-none flex items-center justify-center hover:border-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Más información"
      >?</button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 z-10 pointer-events-none shadow-lg">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

export default function UgcDashboardPage() {
  const { rankingByCommission, balancesByAmount, loading: rankingLoading } = usePublicRanking('dosmicos');
  const { user } = useAuth();

  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [creator, setCreator] = useState<CreatorResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  const isUnlocked = !!user || !!creator;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
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
        setCreator(data[0]);

        // Fetch orders and payouts in parallel
        setOrdersLoading(true);
        setPayoutsLoading(true);

        const [ordersRes, payoutsRes] = await Promise.all([
          (supabase as any).rpc('get_creator_orders_by_code', { p_code: code.trim().toUpperCase() }),
          (supabase as any).rpc('get_creator_payouts_by_code', { p_code: code.trim().toUpperCase() }),
        ]);

        setOrders(ordersRes.data || []);
        setPayouts(payoutsRes.data || []);
        setOrdersLoading(false);
        setPayoutsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error al consultar');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = () => {
    setCreator(null);
    setCode('');
    setOrders([]);
    setPayouts([]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-center relative">
          <img src="/logo-dosmicos.png" alt="Dosmicos" className="h-8 object-contain" />
          <Link
            to="/login"
            className="absolute right-5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Admin
          </Link>
          {isUnlocked && !user && (
            <button
              onClick={handleSignOut}
              className="absolute left-5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      {/* Code gate */}
      {!isUnlocked && (
        <div className="max-w-lg mx-auto px-5 pt-16 pb-20">
          <div className="text-center mb-8">
            <p className="text-3xl mb-4">🔒</p>
            <h1 className="text-gray-900 text-lg font-semibold mb-1">Panel UGC · Dosmicos</h1>
            <p className="text-gray-400 text-sm">
              Ingresa tu código de acceso para ver el ranking y tu saldo acumulado.
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
              className={`w-full text-center text-2xl font-mono tracking-widest border rounded-xl px-4 py-4 outline-none transition-colors bg-white ${
                notFound
                  ? 'border-red-200 focus:border-red-300'
                  : 'border-gray-200 focus:border-gray-400'
              }`}
              autoComplete="off"
              spellCheck={false}
              autoFocus
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
              disabled={checking || code.length < 2}
              className="w-full bg-gray-900 text-white text-sm font-medium rounded-xl py-3.5 hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Verificando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-300 mt-8">
            Tu código lo asigna el equipo de Dosmicos.
          </p>
        </div>
      )}

      {/* Unlocked content */}
      {isUnlocked && (
        <>
          {rankingLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
            </div>
          ) : (
            <div className="max-w-lg mx-auto px-5">

              {/* Creator stats card */}
              {creator && (
                <section className="pt-8 pb-6">
                  <div className="rounded-2xl border border-gray-100 p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
                      Mi saldo
                    </p>
                    <div className="flex items-center gap-3 mb-4">
                      {creator.avatar_url ? (
                        <img
                          src={creator.avatar_url}
                          alt={creator.creator_name}
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                          {creator.creator_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium text-sm truncate">{creator.creator_name}</p>
                        {creator.instagram_handle && (
                          <p className="text-gray-400 text-xs">@{creator.instagram_handle}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center">
                          Compras
                          <StatTooltip text="Pedidos generados con tu link en el período actual" />
                        </p>
                        <p className="text-gray-900 font-semibold text-lg leading-tight">
                          {creator.orders_in_period}
                        </p>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center">
                          Comisiones
                          <StatTooltip text="Total ganado en el período actual. Se reinicia cuando el equipo inicia un nuevo período" />
                        </p>
                        <p className="text-gray-900 font-semibold text-sm leading-tight">
                          {creator.commission_in_period > 0
                            ? formatCOP(creator.commission_in_period)
                            : '—'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center">
                          Saldo pendiente
                          <StatTooltip text="Lo que Dosmicos te debe: comisiones acumuladas de todos los períodos menos los pagos ya realizados" />
                        </p>
                        <p className="text-gray-900 font-semibold text-sm leading-tight">
                          {creator.pending_balance > 0
                            ? formatCOP(creator.pending_balance)
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}


              {/* Payout history */}
              {creator && (
                <section className="pb-6">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
                    Mis pagos recibidos
                  </p>
                  {payoutsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
                    </div>
                  ) : payouts.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">
                      Aún no has recibido pagos.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {payouts.map((payout, i) => (
                        <div key={i} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                          <div>
                            <p className="text-gray-900 text-sm font-medium capitalize">
                              {payout.payout_type}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {new Date(payout.created_at).toLocaleDateString('es-CO', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                              {payout.notes ? ` · ${payout.notes}` : ''}
                            </p>
                          </div>
                          <p className="text-gray-900 text-sm font-semibold text-green-600">
                            {formatCOP(payout.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Admin balances */}
              {user && balancesByAmount.length > 0 && (
                <section className="pt-4 pb-8">
                  <div className="mb-5">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Admin</p>
                    <h2 className="text-gray-900 text-xl font-semibold">Saldos acumulados</h2>
                  </div>
                  <div className="space-y-2">
                    {balancesByAmount.map((entry) => (
                      <div
                        key={entry.instagram_handle || entry.creator_name}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-gray-100"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                          {entry.creator_name?.[0]?.toUpperCase()}
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
                </section>
              )}

              {(creator || (user && balancesByAmount.length > 0)) && (
                <div className="border-t border-gray-100" />
              )}

              {/* Ranking */}
              <section className="pt-8 pb-16">
                <div className="mb-6">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                    Período actual
                  </p>
                  <h2 className="text-gray-900 text-xl font-semibold">Ranking de comisiones</h2>
                </div>
                <RankingSection ranking={rankingByCommission} />
              </section>
            </div>
          )}
        </>
      )}

      <footer className="text-center pb-10">
        <p className="text-xs text-gray-300">Powered by Dosmicos</p>
      </footer>
    </div>
  );
}
