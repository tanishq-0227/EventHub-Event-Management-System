import { Link, useLocation } from 'react-router-dom';
import { useGetBookingByIdQuery } from '../features/bookings/bookingsApi';

import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

import { formatDateTime } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';

import {
  CheckCircleIcon,
  QrCodeIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';

import { XCircleIcon } from '@heroicons/react/24/outline';

export default function PaymentSuccess() {
  const { state } = useLocation();

  const bookingId = state?.bookingId;

  const { data: booking, isLoading } = useGetBookingByIdQuery(bookingId, {
  skip: !bookingId,
  refetchOnMountOrArgChange: true,
  pollingInterval: 2000,
});

  const tickets =
    booking?.issuedTickets?.length > 0
      ? booking.issuedTickets
      : booking?.issuedTicket
      ? [booking.issuedTicket]
      : booking?.qrCode
      ? [
          {
            ticketCode: booking.bookingRef,
            qrImage: booking.qrCode,
            tierName: 'General',
            seatNumber: null,
          },
        ]
      : [];

  const downloadQR = (ticket, index) => {
    if (!ticket?.qrImage) return;

    const a = document.createElement('a');

    a.href = ticket.qrImage;

    a.download = `ticket-${
      ticket.ticketCode || booking?.bookingRef || index + 1
    }.png`;

    a.click();
  };

  if (!bookingId) {
    return (
      <div className="container-app py-24 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.05] p-10 backdrop-blur-2xl">
          <XCircleIcon className="mx-auto mb-4 h-14 w-14 text-red-400" />

          <h2 className="mb-2 text-2xl font-black text-white">
            Booking not found
          </h2>

          <p className="mb-6 text-slate-400">
            No booking information was provided.
          </p>

          <Link to="/events" className="btn-lg btn-primary">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-app relative max-w-6xl py-14">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_60px_rgba(16,185,129,0.35)]">
            <CheckCircleIcon className="h-14 w-14 text-emerald-400" />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            <SparklesIcon className="h-4 w-4" />
            Payment Successful
          </div>

          <h1 className="bg-gradient-to-r from-white via-emerald-100 to-cyan-300 bg-clip-text text-5xl font-black tracking-tight text-transparent">
            Booking Confirmed
          </h1>

          <p className="mt-4 max-w-2xl text-slate-400">
            Your tickets are now ready. Show these QR codes at the venue
            entrance for quick verification.
          </p>
        </div>

        {booking && (
          <div className="mb-8 rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Event Details
                </p>

                <h2 className="text-3xl font-black text-white">
                  {booking.event?.title}
                </h2>

                {booking.event?.startDate && (
                  <p className="mt-2 text-slate-400">
                    {formatDateTime(booking.event.startDate)}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Amount Paid
                </p>

                <p className="mt-1 text-3xl font-black text-white">
                  {formatCurrency(booking.totalAmount)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Booking Ref
                </p>

                <p className="mt-2 font-mono text-lg font-black text-cyan-300">
                  {booking.bookingRef}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total Tickets
                </p>

                <p className="mt-2 text-2xl font-black text-white">
                  {tickets.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Status
                </p>

                <p className="mt-2 text-lg font-black text-emerald-400">
                  Confirmed
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-white">
                Your QR Tickets
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Each QR is valid for one entry only.
              </p>
            </div>

            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300">
              {tickets.length} Ticket(s)
            </div>
          </div>

          {tickets.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tickets.map((ticket, index) => (
                <div
                  key={ticket._id || ticket.ticketCode || index}
                  className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.05] shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition hover:-translate-y-1 hover:border-cyan-400/20"
                >
                  <div className="relative h-24 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_40%)]" />
                  </div>

                  <div className="relative px-5 pb-5">
                    <div className="-mt-10 flex justify-center">
                      <div className="rounded-3xl bg-white p-3 shadow-2xl">
                        {ticket.qrImage ? (
                          <img
                            src={ticket.qrImage}
                            alt="QR Code"
                            className="h-[180px] w-[180px] object-contain"
                          />
                        ) : (
                          <div className="flex h-[180px] w-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300">
                            <QrCodeIcon className="h-12 w-12 text-slate-400" />
                            <p className="mt-2 text-xs text-slate-500">
                              Generating...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 text-center">
                      <p className="font-mono text-sm font-black tracking-widest text-cyan-300">
                        {ticket.ticketCode}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                          {ticket.tierName || 'General'}
                        </span>

                        {ticket.seatNumber && (
                          <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-300">
                            Seat {ticket.seatNumber}
                          </span>
                        )}
                      </div>

                      <p className="mt-4 text-xs font-semibold text-red-400">
                        ⚠️ Do not share this QR code
                      </p>
                    </div>

                    {ticket.qrImage && (
                      <Button
                        onClick={() => downloadQR(ticket, index)}
                        variant="secondary"
                        className="mt-5 w-full"
                      >
                        ⬇ Download Ticket
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-14 text-center backdrop-blur-2xl">
              <QrCodeIcon className="mx-auto mb-4 h-16 w-16 text-slate-600" />

              <p className="text-lg font-bold text-white">
                Generating your QR tickets...
              </p>

              <p className="mt-2 text-slate-400">
                Your QR codes will appear here shortly and will also be emailed
                to you.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <Link to="/profile" className="flex-1">
            <Button className="w-full" size="lg">
              View My Bookings
            </Button>
          </Link>

          <Link to="/events" className="flex-1">
            <Button
              variant="ghost"
              size="lg"
              className="w-full border border-white/10"
            >
              Browse More Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}