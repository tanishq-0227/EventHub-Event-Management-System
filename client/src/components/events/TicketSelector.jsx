import { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { MinusIcon, PlusIcon, TicketIcon } from '@heroicons/react/24/outline';

export default function TicketSelector({ ticketTypes = [], onChange }) {
  const [selections, setSelections] = useState(
    () => Object.fromEntries(ticketTypes.map((t) => [t._id, 0])),
  );

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange?.(selections);
  }, [selections, onChange]);

  const update = (id, delta) => {
    setSelections((prev) => {
      const ticket = ticketTypes.find((t) => t._id === id);
      const remaining = (ticket?.totalQuantity ?? 0) - (ticket?.soldQuantity ?? 0);
      const next = Math.max(0, Math.min((prev[id] ?? 0) + delta, remaining, 10));
      return { ...prev, [id]: next };
    });
  };

  const total = ticketTypes.reduce(
    (sum, t) => sum + (selections[t._id] ?? 0) * Number(t.price ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      {ticketTypes.map((ticket) => {
        const qty = selections[ticket._id] ?? 0;
        const remaining = (ticket.totalQuantity ?? 0) - (ticket.soldQuantity ?? 0);
        const soldOut = remaining <= 0;
        const selected = qty > 0;

        return (
          <div
            key={ticket._id}
            className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
              soldOut
                ? 'border-white/5 bg-white/[0.025] opacity-50'
                : selected
                ? 'border-cyan-400/50 bg-cyan-400/[0.08] shadow-[0_0_35px_rgba(6,182,212,0.22)]'
                : 'border-white/10 bg-white/[0.035] hover:-translate-y-1 hover:border-cyan-400/35 hover:bg-white/[0.06] hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]'
            }`}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-500/15 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-blue-500/12 blur-2xl" />
            </div>

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 gap-3">
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition ${
                    selected
                      ? 'bg-cyan-400/15 text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                      : 'bg-white/5 text-slate-300 group-hover:text-cyan-300'
                  }`}
                >
                  <TicketIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white">{ticket.name}</p>

                  {ticket.description && (
                    <p className="mt-0.5 truncate text-xs font-medium uppercase tracking-wide text-slate-400">
                      {ticket.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-black text-cyan-200">
                      {Number(ticket.price) === 0 ? 'Free' : formatCurrency(ticket.price)}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        soldOut
                          ? 'bg-red-500/10 text-red-300'
                          : remaining < 10
                          ? 'bg-amber-400/10 text-amber-300'
                          : 'bg-emerald-400/10 text-emerald-300'
                      }`}
                    >
                      {soldOut ? 'Sold out' : `${remaining} left`}
                    </span>
                  </div>
                </div>
              </div>

              {!soldOut && (
                <div className="flex flex-shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => update(ticket._id, -1)}
                    disabled={qty === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>

                  <span
                    className={`w-7 text-center font-display text-lg font-black transition ${
                      selected ? 'text-cyan-200' : 'text-white'
                    }`}
                  >
                    {qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => update(ticket._id, 1)}
                    disabled={qty >= remaining || qty >= 10}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm font-medium text-slate-400">Subtotal</span>
          <span className="font-display text-xl font-black text-white">
            {formatCurrency(total)}
          </span>
        </div>
      )}
    </div>
  );
}