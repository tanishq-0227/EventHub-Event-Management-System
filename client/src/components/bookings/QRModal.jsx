import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatDate';
import axiosClient from '../../api/axiosClient';

import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export default function QRModal({ isOpen, onClose, booking }) {
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
            isUsed: false,
          },
        ]
      : [];

  const downloadQR = (ticket, index) => {
    if (!ticket?.qrImage) return;

    const a = document.createElement('a');
    a.href = ticket.qrImage;
    a.download = `ticket-${ticket.ticketCode || booking?.bookingRef || index + 1}.png`;
    a.click();
  };

  const downloadPDF = async (ticket) => {
    try {
      const res = await axiosClient.get(`/api/tickets/${ticket._id}/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: 'application/pdf' })
      );

      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticket.ticketCode}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Download Error:', err);
      alert('Could not download PDF ticket');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Entry QR Codes" size="xl">
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-lg font-black text-white">{booking?.event?.title}</p>

          {booking?.event?.startDate && (
            <p className="mt-1 text-xs text-slate-400">
              {formatDate(booking.event.startDate)}
            </p>
          )}

          <p className="mt-3 font-mono text-sm font-bold tracking-widest text-cyan-300">
            Booking Ref: {booking?.bookingRef ?? '—'}
          </p>
        </div>

        {tickets.length > 0 ? (
          <div className="grid max-h-[72vh] grid-cols-1 gap-5 overflow-y-auto pr-1 md:grid-cols-2">
            {tickets.map((ticket, index) => (
              <div
                key={ticket._id || ticket.ticketCode || index}
                className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

                <div className="relative z-10">
                  <p className="font-mono text-sm font-black tracking-[0.22em] text-cyan-300">
                    {ticket.ticketCode || `Ticket ${index + 1}`}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                      {ticket.tierName || 'General'}
                    </span>

                    {ticket.seatNumber && (
                      <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-100">
                        Seat {ticket.seatNumber}
                      </span>
                    )}
                  </div>

                  {ticket.qrImage ? (
                    <div className="mx-auto mt-5 w-fit rounded-3xl bg-white p-4 shadow-[0_0_40px_rgba(255,255,255,0.12)]">
                      <img
                        src={ticket.qrImage}
                        alt="Entry QR"
                        className="h-[190px] w-[190px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mx-auto mt-5 flex h-[220px] w-[220px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.03] p-4 text-center">
                      <XCircleIcon className="h-8 w-8 text-slate-500" />
                      <p className="mt-2 text-sm text-slate-400">QR unavailable</p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-center text-xs font-bold">
                    {ticket.isUsed ? (
                      <span className="flex items-center gap-1 text-amber-400">
                        <XCircleIcon className="h-4 w-4" />
                        Used {ticket.usedAt ? `· ${formatDate(ticket.usedAt)}` : ''}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircleIcon className="h-4 w-4" />
                        Valid — not yet scanned
                      </span>
                    )}
                  </div>

                  {ticket.qrImage && (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => downloadQR(ticket, index)}
                        variant="secondary"
                        className="w-full gap-2"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        QR
                      </Button>

                      <Button
                        onClick={() => downloadPDF(ticket)}
                        className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
            <XCircleIcon className="h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-400">QR code not yet available</p>
            <p className="text-xs text-slate-500">
              {booking?.status === 'pending'
                ? 'Complete payment to receive your QR code.'
                : 'QR generation may still be processing.'}
            </p>
          </div>
        )}

        {tickets.some((t) => t.qrImage) && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
              One-Time Entry Access
            </p>
            <p className="mt-1 text-xs text-red-200">
              Each QR is valid for ONE entry only. Do not share your ticket.
            </p>
          </div>
        )}

        <Button onClick={onClose} variant="ghost" className="w-full">
          Close
        </Button>
      </div>
    </Modal>
  );
}