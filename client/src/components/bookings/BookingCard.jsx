import { useMemo, useState } from 'react';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { canCancelBooking, getRefundAmount } from '../../utils/cancellationPolicy';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  QrCodeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const statusVariant = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'danger',
  refunded: 'neutral',
};

export default function BookingCard({ booking, onRequestCancel, onDirectCancel, onViewQr }) {
  const [cancellingLocal, setCancellingLocal] = useState(false);
  const event = booking?.event || {};

  const isPending = booking?.status === 'pending';
  const isConfirmed = booking?.status === 'confirmed';
  const isCancelled = booking?.status === 'cancelled';

  const isCancelRequested = booking?.cancellationStatus === 'requested';
  const isCancelApproved = booking?.cancellationStatus === 'approved';

  const totalTickets =
    booking?.issuedTickets?.length ||
    booking?.tickets?.reduce((sum, t) => sum + Number(t.quantity || 0), 0) ||
    1;

  const seatPreview = useMemo(() => {
    const seats =
      booking?.issuedTickets
        ?.map((ticket) => ticket.seatNumber)
        .filter(Boolean) || [];

    if (seats.length === 0) return null;
    if (seats.length <= 4) return seats.join(', ');
    return `${seats.slice(0, 4).join(', ')} +${seats.length - 4} more`;
  }, [booking]);

  const tierPreview = useMemo(() => {
    const tiers =
      booking?.issuedTickets
        ?.map((ticket) => ticket.tierName)
        .filter(Boolean) || [];

    return [...new Set(tiers)].slice(0, 3);
  }, [booking]);

  const policy = canCancelBooking(event.startDate, booking?.status);
  const refundInfo = policy.canCancel
    ? getRefundAmount(booking?.totalAmount ?? 0, policy.hoursUntilEvent)
    : null;

  const handleDirectCancel = async () => {
    if (!confirm('Cancel this booking? (No payment was taken for pending bookings.)')) return;
    setCancellingLocal(true);
    try {
      await onDirectCancel?.(booking._id);
    } finally {
      setCancellingLocal(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:border-cyan-400/25 hover:shadow-[0_25px_90px_rgba(6,182,212,0.16)]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -bottom-24 left-20 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row">
        {event.bannerImage ? (
          <div className="relative h-32 w-full overflow-hidden rounded-2xl sm:h-28 sm:w-36">
            <img
              src={event.bannerImage}
              alt={event.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 sm:h-28 sm:w-36">
            <CalendarDaysIcon className="h-10 w-10 text-cyan-300/40" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-black text-white">
                {event.title || 'Event'}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant[booking?.status] ?? 'neutral'}>
                  {booking?.status}
                </Badge>

                {booking?.bookingRef && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-slate-400">
                    #{booking.bookingRef}
                  </span>
                )}

                {isConfirmed && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    QR Ready
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                Total
              </p>
              <p className="font-display text-lg font-black text-white">
                {formatCurrency(booking?.totalAmount ?? 0)}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <CalendarDaysIcon className="h-3.5 w-3.5 text-cyan-300" />
              {event.startDate ? formatDate(event.startDate) : 'Date TBD'}
            </div>

            {(event.venue?.city || event.venue?.name) && (
              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <MapPinIcon className="h-3.5 w-3.5 text-blue-300" />
                <span className="truncate">{event.venue?.city || event.venue?.name}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <TicketIcon className="h-3.5 w-3.5 text-emerald-300" />
              <span className="font-semibold text-slate-200">{totalTickets} ticket(s)</span>
            </div>

            {seatPreview && (
              <div className="flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
                <SparklesIcon className="h-3.5 w-3.5 text-cyan-300" />
                <span className="truncate font-semibold text-cyan-100">Seats: {seatPreview}</span>
              </div>
            )}
          </div>

          {tierPreview.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tierPreview.map((tier) => (
                <span
                  key={tier}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-slate-300"
                >
                  {tier}
                </span>
              ))}
            </div>
          )}

          {isPending && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
              <ClockIcon className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">
                Payment not yet verified. Complete payment or cancel this reservation.
              </span>
            </div>
          )}

          {isConfirmed && !isCancelRequested && (
            <>
              {policy.canCancel && refundInfo && (
                <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <CheckCircleIcon className="h-4 w-4" />
                  {refundInfo.label} eligible if cancelled now
                </p>
              )}

              {!policy.canCancel && policy.reason === 'within_48_hours' && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-400/10 bg-amber-400/5 p-3 text-xs text-amber-300">
                  <XCircleIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Cancellation locked — event starts in less than 48 hours</span>
                </div>
              )}
            </>
          )}

          {isCancelRequested && (
            <div className="mt-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <ArrowPathIcon className="h-4 w-4 animate-spin-slow" />
                Cancellation request is being reviewed by admin
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onViewQr?.(booking)}
              className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
            >
              <QrCodeIcon className="mr-1 h-4 w-4" />
              View QR
            </Button>

            {isCancelled ? (
              <Badge variant="danger" className="px-3 py-1">
                {isCancelApproved ? 'Cancelled (Refund Pending)' : 'Cancelled'}
              </Badge>
            ) : isCancelRequested ? (
              <Badge variant="ghost" className="border-indigo-500/30 text-indigo-400">
                Awaiting Admin Review
              </Badge>
            ) : isPending ? (
              <Button
                size="sm"
                variant="danger"
                loading={cancellingLocal}
                onClick={handleDirectCancel}
                className="px-4 text-xs"
              >
                Cancel Reservation
              </Button>
            ) : policy.canCancel ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRequestCancel?.(booking)}
                className="border border-red-500/20 px-4 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                Request Cancellation
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}