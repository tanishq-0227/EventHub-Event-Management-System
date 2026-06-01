import { useMemo } from 'react';

const COLORS = ['cyan', 'blue', 'emerald', 'amber', 'rose', 'violet'];

const getRowLabel = (index) => {
  let label = '';
  let n = index;

  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);

  return label;
};

export default function SeatMap({
  ticketTypes = [],
  selections = {},
  selectedSeats = [],
  bookedSeats = [],
  onSelect,
  rows = 6,
  seatsPerRow = 10,
}) {
  const rowLabels = useMemo(() => {
    return Array.from({ length: Number(rows) || 6 }, (_, index) =>
      getRowLabel(index)
    );
  }, [rows]);

  const colCount = Number(seatsPerRow) || 10;

  const seatData = useMemo(() => {
    const sortedTickets = [...ticketTypes].sort(
      (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0)
    );

    const rowToTicket = {};
    const ticketMeta = [];

    let rowIndex = 0;

    sortedTickets.forEach((ticket, index) => {
      const remainingTickets = sortedTickets.length - index;
      const remainingRows = rowLabels.length - rowIndex;
      const rowsCount = Math.max(
        1,
        Math.ceil(remainingRows / remainingTickets)
      );

      const assignedRows = rowLabels.slice(rowIndex, rowIndex + rowsCount);

      assignedRows.forEach((row) => {
        rowToTicket[row] = ticket._id;
      });

      ticketMeta.push({
        id: ticket._id,
        name: ticket.name,
        price: Number(ticket.price ?? 0),
        qty: Number(selections[ticket._id] ?? 0),
        rows: assignedRows,
        color: COLORS[index % COLORS.length],
      });

      rowIndex += rowsCount;
    });

    const totalAllowedSeats = Object.values(selections).reduce(
      (sum, qty) => sum + Number(qty || 0),
      0
    );

    return { rowToTicket, ticketMeta, totalAllowedSeats };
  }, [ticketTypes, selections, rowLabels]);

  const { rowToTicket, ticketMeta, totalAllowedSeats } = seatData;

  const getPlanBySeat = (seatId) => {
    const row = seatId.match(/^[A-Z]+/)?.[0];
    const ticketId = rowToTicket[row];

    return ticketMeta.find((p) => p.id === ticketId);
  };

  const getColorClass = (color, selected) => {
    const map = {
      cyan: selected
        ? 'border-cyan-300 bg-cyan-400/25 text-white shadow-[0_0_32px_rgba(34,211,238,0.75)] ring-2 ring-cyan-300/40 animate-pulse'
        : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:border-cyan-300/70 hover:bg-cyan-400/20 hover:shadow-[0_0_22px_rgba(34,211,238,0.38)]',
      blue: selected
        ? 'border-blue-300 bg-blue-400/25 text-white shadow-[0_0_32px_rgba(96,165,250,0.75)] ring-2 ring-blue-300/40 animate-pulse'
        : 'border-blue-400/30 bg-blue-400/10 text-blue-200 hover:border-blue-300/70 hover:bg-blue-400/20 hover:shadow-[0_0_22px_rgba(96,165,250,0.38)]',
      emerald: selected
        ? 'border-emerald-300 bg-emerald-400/25 text-white shadow-[0_0_32px_rgba(52,211,153,0.75)] ring-2 ring-emerald-300/40 animate-pulse'
        : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:border-emerald-300/70 hover:bg-emerald-400/20 hover:shadow-[0_0_22px_rgba(52,211,153,0.38)]',
      amber: selected
        ? 'border-amber-300 bg-amber-400/25 text-white shadow-[0_0_32px_rgba(251,191,36,0.75)] ring-2 ring-amber-300/40 animate-pulse'
        : 'border-amber-400/30 bg-amber-400/10 text-amber-200 hover:border-amber-300/70 hover:bg-amber-400/20 hover:shadow-[0_0_22px_rgba(251,191,36,0.38)]',
      rose: selected
        ? 'border-rose-300 bg-rose-400/25 text-white shadow-[0_0_32px_rgba(251,113,133,0.75)] ring-2 ring-rose-300/40 animate-pulse'
        : 'border-rose-400/30 bg-rose-400/10 text-rose-200 hover:border-rose-300/70 hover:bg-rose-400/20 hover:shadow-[0_0_22px_rgba(251,113,133,0.38)]',
      violet: selected
        ? 'border-violet-300 bg-violet-400/25 text-white shadow-[0_0_32px_rgba(167,139,250,0.75)] ring-2 ring-violet-300/40 animate-pulse'
        : 'border-violet-400/30 bg-violet-400/10 text-violet-200 hover:border-violet-300/70 hover:bg-violet-400/20 hover:shadow-[0_0_22px_rgba(167,139,250,0.38)]',
    };

    return map[color] || map.cyan;
  };

  const toggleSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return;

    const plan = getPlanBySeat(seatId);

    if (!plan || plan.qty <= 0) return;

    if (selectedSeats.includes(seatId)) {
      onSelect(selectedSeats.filter((s) => s !== seatId));
      return;
    }

    const selectedInPlan = selectedSeats.filter((seat) => {
      const seatPlan = getPlanBySeat(seat);
      return seatPlan?.id === plan.id;
    }).length;

    if (selectedSeats.length >= totalAllowedSeats) return;
    if (selectedInPlan >= plan.qty) return;

    onSelect([...selectedSeats, seatId]);
  };

  if (totalAllowedSeats === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-cyan-400/20 bg-white/[0.025] p-6 text-center">
        <p className="text-sm font-semibold text-slate-300">
          Select tickets first to unlock seat selection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">
          <div className="h-3 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.5)]" />
          <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-slate-500">
            Stage / Screen This Way
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
          Dynamic Seat Layout
        </p>
        <p className="mt-1 text-sm text-cyan-100">
          {rowLabels.length} rows × {colCount} seats ={' '}
          {rowLabels.length * colCount} visible seats
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {ticketMeta.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              plan.qty > 0
                ? getColorClass(plan.color, false)
                : 'border-white/10 bg-white/[0.03] text-slate-500'
            }`}
          >
            {plan.name}: Rows {plan.rows.join(', ')}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto overflow-y-hidden pb-2">
        <div className="min-w-max space-y-4">
          {rowLabels.map((row) => (
            <div key={row} className="flex items-center justify-center gap-2">
              <span className="w-8 text-sm font-bold text-slate-500">
                {row}
              </span>

              {Array.from({ length: colCount }, (_, i) => {
                const seatId = `${row}${i + 1}`;
                const booked = bookedSeats.includes(seatId);
                const selected = selectedSeats.includes(seatId);
                const plan = getPlanBySeat(seatId);
                const active = plan && plan.qty > 0;

                return (
                  <button
                    key={seatId}
                    type="button"
                    onClick={() => toggleSeat(seatId)}
                    disabled={booked || !active}
                    className={`h-10 w-10 rounded-xl border text-xs font-bold transition-all duration-300 ${
                      booked
                        ? 'cursor-not-allowed border-red-500/20 bg-red-500/10 text-red-300 opacity-40'
                        : !active
                        ? 'cursor-not-allowed border-white/5 bg-white/[0.025] text-slate-700 opacity-35'
                        : selected
                        ? `scale-110 ${getColorClass(plan.color, true)}`
                        : `${getColorClass(plan.color, false)} hover:-translate-y-1.5 hover:scale-110`
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-500 ${
          selectedSeats.length === totalAllowedSeats
            ? 'border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
            : 'border-cyan-400/20 bg-cyan-400/10'
        }`}
      >
        <div
          className={`absolute inset-0 opacity-30 blur-2xl ${
            selectedSeats.length === totalAllowedSeats
              ? 'bg-emerald-400/20'
              : 'bg-cyan-400/20'
          }`}
        />

        <div className="relative z-10">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em]">
            <span
              className={
                selectedSeats.length === totalAllowedSeats
                  ? 'text-emerald-300'
                  : 'text-cyan-300'
              }
            >
              Seat Progress
            </span>

            <span
              className={
                selectedSeats.length === totalAllowedSeats
                  ? 'text-emerald-200'
                  : 'text-cyan-100'
              }
            >
              {selectedSeats.length}/{totalAllowedSeats}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                selectedSeats.length === totalAllowedSeats
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500'
              }`}
              style={{
                width: `${(selectedSeats.length / totalAllowedSeats) * 100}%`,
              }}
            />
          </div>

          <p
            className={`mt-3 text-sm font-semibold ${
              selectedSeats.length === totalAllowedSeats
                ? 'text-emerald-100'
                : 'text-cyan-100'
            }`}
          >
            {selectedSeats.length === totalAllowedSeats
              ? `✓ ${selectedSeats.join(', ')} selected — Ready for checkout`
              : `Select ${
                  totalAllowedSeats - selectedSeats.length
                } more seat${
                  totalAllowedSeats - selectedSeats.length > 1 ? 's' : ''
                }`}
          </p>
        </div>
      </div>
    </div>
  );
}