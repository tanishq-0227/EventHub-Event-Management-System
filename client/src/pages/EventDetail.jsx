import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetEventByIdQuery } from '../features/events/eventsApi';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import TicketSelector from '../components/events/TicketSelector';
import CountdownTimer from '../components/events/CountdownTimer';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { formatDateTime } from '../utils/formatDate';
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserCircleIcon,
  SparklesIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuth, isOrganizer, user } = useAuth();
  const { data: event, isLoading, error } = useGetEventByIdQuery(id);

  const [selections, setSelections] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`sel_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useSocket();

  if (isLoading) {
    return (
      <div className="flex justify-center py-28">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container-app py-24 text-center">
        <p className="text-red-400 mb-4">Event not found.</p>
        <Link to="/events" className="btn-md btn-secondary">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const tickets = event.ticketTypes ?? [];

  const totalLeft = tickets.reduce(
    (s, t) => s + (t.totalQuantity - (t.soldQuantity ?? 0)),
    0
  );

  const soldOut = tickets.length > 0 && totalLeft <= 0;
  const hasSelected = Object.values(selections).some((q) => Number(q) > 0);

  const prices = tickets
    .map((ticket) => Number(ticket.price ?? ticket.amount ?? ticket.ticketPrice ?? 0))
    .filter((price) => Number.isFinite(price) && price > 0);

  const lowestPrice = prices.length > 0 ? `₹${Math.min(...prices)}` : 'Free';

  const handleBook = () => {
    if (!isAuth) {
      try {
        sessionStorage.setItem(`sel_${id}`, JSON.stringify(selections));
      } catch {
        // ignore
      }

      navigate(`/login?next=/events/${id}`);
      return;
    }

    try {
      sessionStorage.removeItem(`sel_${id}`);
    } catch {
      // ignore
    }

    navigate(`/events/${id}/seats`, {
      state: { selections, event },
    });
  };

  return (
    <div className="container-app relative overflow-hidden py-10">
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute top-20 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute top-60 -right-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative mb-10 h-72 w-full overflow-hidden rounded-3xl border border-white/10 bg-surface-border shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:h-[420px]"
      >
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.title}
            className="h-full w-full object-cover transition duration-[2500ms] hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950">
            <CalendarDaysIcon className="h-20 w-20 text-cyan-300/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/35 to-transparent" />

        <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center gap-2">
          {event.category && <Badge variant="primary">{event.category}</Badge>}
          {event.isFeatured && (
            <span className="flex items-center gap-1 rounded-full border border-yellow-300/30 bg-yellow-400/15 px-3 py-1 text-xs font-black text-yellow-200 backdrop-blur-xl">
              <SparklesIcon className="h-3.5 w-3.5" />
              Featured
            </span>
          )}
          {soldOut && <Badge variant="danger">Sold Out</Badge>}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-6 lg:col-span-2"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300 backdrop-blur-xl">
              <TicketIcon className="h-4 w-4" />
              Starting from {lowestPrice}
            </div>

            <h1 className="mt-2 font-display text-4xl md:text-6xl font-black leading-[0.95] bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
              {event.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-xl">
                <CalendarDaysIcon className="h-4 w-4 text-cyan-300" />
                {formatDateTime(event.startDate)}
                {event.endDate && ` — ${formatDateTime(event.endDate)}`}
              </div>

              {event.venue && (
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-xl">
                  <MapPinIcon className="h-4 w-4 text-blue-300" />
                  {event.venue?.name}
                  {event.venue?.city ? `, ${event.venue.city}` : ''}
                </div>
              )}

              {event.organizer && (
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-xl">
                  <UserCircleIcon className="h-4 w-4 text-emerald-300" />
                  By {event.organizer?.name ?? 'Organizer'}
                </div>
              )}
            </div>

            {event.startDate && new Date(event.startDate) > new Date() && (
              <div className="mt-5">
                <CountdownTimer targetDate={event.startDate} />
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_15px_50px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
          >
            <h2 className="mb-3 font-display text-2xl font-black text-white">
              About this event
            </h2>

            <p className="whitespace-pre-line leading-relaxed text-slate-300">
              {event.description}
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-4"
        >
          <div className="sticky top-20 rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-black text-white">
                  Select Tickets
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Choose your ticket tier to continue
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                  From
                </p>
                <p className="font-display text-lg font-black text-white">
                  {lowestPrice}
                </p>
              </div>
            </div>

            {tickets.length > 0 ? (
              <TicketSelector ticketTypes={tickets} onChange={setSelections} />
            ) : (
              <div className="py-3 text-center">
                <p className="mb-3 text-sm text-slate-400">
                  No tickets available yet.
                </p>

                {isOrganizer && event.organizer?._id === (user?.id ?? user?._id) && (
                  <Link
                    to={`/dashboard/events/${id}/tickets`}
                    className="btn-sm btn-secondary text-xs"
                  >
                    + Add Tickets
                  </Link>
                )}
              </div>
            )}

            {tickets.length > 0 && !hasSelected && !soldOut && (
              <p className="mt-3 text-center text-xs text-amber-300/90">
                ☝️ Select at least 1 ticket above to continue
              </p>
            )}

            <Button
              onClick={handleBook}
              disabled={soldOut || tickets.length === 0 || (!hasSelected && tickets.length > 0)}
              className={`mt-5 w-full btn-lg ${
                soldOut || tickets.length === 0
                  ? 'btn-secondary cursor-not-allowed opacity-60'
                  : hasSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_35px_rgba(6,182,212,0.35)]'
                  : 'btn-secondary opacity-70'
              }`}
            >
              {soldOut
                ? '🚫 Sold Out'
                : tickets.length === 0
                ? '⏳ Tickets Coming Soon'
                : !hasSelected
                ? 'Select Tickets Above'
                : '🎟️ Continue to Seats →'}
            </Button>

            {!isAuth && !soldOut && tickets.length > 0 && (
              <p className="mt-3 text-center text-xs text-slate-500">
                You&apos;ll be asked to sign in
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}