import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  useGetEventByIdQuery,
  useGetBookedSeatsQuery,
} from '../features/events/eventsApi';

import SeatMap from '../components/events/SeatMap';
import Spinner from '../components/ui/Spinner';

import { formatCurrency } from '../utils/formatCurrency';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';

export default function SeatSelection() {
  const { id } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const selections = location.state?.selections || {};

  const eventFromState = location.state?.event;

  const { data: fetchedEvent, isLoading, error } =
    useGetEventByIdQuery(id);

  const event = eventFromState || fetchedEvent;

  const venueLayoutType =
    event?.venueLayoutType || 'standing';

  const enableSeatSelection =
    event?.enableSeatSelection || false;

  const { data: bookedSeatsData } =
    useGetBookedSeatsQuery(id, {
      skip:
        venueLayoutType !== 'seated' &&
        venueLayoutType !== 'sectioned',
    });

  const bookedSeats = bookedSeatsData || [];

  const [selectedSeats, setSelectedSeats] = useState([]);

  const [selectedSection, setSelectedSection] =
    useState(null);

  const tickets = event?.ticketTypes ?? [];

  const selectedTicketList = useMemo(() => {
    return tickets
      .filter(
        (ticket) =>
          Number(selections[ticket._id] || 0) > 0
      )
      .map((ticket) => ({
        ...ticket,
        qty: Number(selections[ticket._id] || 0),
      }));
  }, [tickets, selections]);

  const totalTickets = selectedTicketList.reduce(
    (sum, ticket) => sum + ticket.qty,
    0
  );

  const subtotal = selectedTicketList.reduce(
    (sum, ticket) =>
      sum + Number(ticket.price || 0) * ticket.qty,
    0
  );

  useEffect(() => {
    if (
      !isLoading &&
      event &&
      totalTickets === 0
    ) {
      navigate(`/events/${id}`);
    }
  }, [
    isLoading,
    event,
    totalTickets,
    navigate,
    id,
  ]);

  // ─────────────────────────────────────────────
  // AUTO SKIP FOR STANDING EVENTS
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (
      event &&
      venueLayoutType === 'standing'
    ) {
      navigate(`/checkout/${id}`, {
        state: {
          selections,
          event,
          selectedSeats: [],
          selectedSection: null,
        },
      });
    }
  }, [
    event,
    venueLayoutType,
    navigate,
    id,
    selections,
  ]);

  const canContinue =
    venueLayoutType === 'sectioned'
      ? !!selectedSection
      : venueLayoutType === 'seated'
      ? selectedSeats.length === totalTickets
      : true;

  const handleContinue = () => {
    if (!canContinue) return;

    navigate(`/checkout/${id}`, {
      state: {
        selections,
        event,
        selectedSeats,
        selectedSection,
      },
    });
  };

  if (isLoading && !event) {
    return (
      <div className="flex justify-center py-28">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container-app py-24 text-center">
        <p className="mb-4 text-red-400">
          Event not found.
        </p>

        <Link
          to="/events"
          className="btn-md btn-secondary"
        >
          ← Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app relative overflow-hidden py-10">
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 18, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <motion.div
        animate={{
          y: [0, 24, 0],
          x: [0, -18, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute -right-24 top-80 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"
      />

      <div className="mb-8">
        <Link
          to={`/events/${id}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Event
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 2xl:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
        >
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                <TicketIcon className="h-4 w-4" />

                {venueLayoutType === 'sectioned'
                  ? 'Section Selection'
                  : 'Seat Selection'}
              </div>

              <h1 className="font-display text-3xl font-black leading-tight text-white md:text-5xl">
                {venueLayoutType === 'sectioned'
                  ? 'Choose your section'
                  : 'Choose your seats'}
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                {venueLayoutType === 'sectioned'
                  ? 'Pick the best section for your event experience.'
                  : `Select exactly ${totalTickets} seat${
                      totalTickets > 1 ? 's' : ''
                    } based on your ticket category.`}
              </p>
            </div>

            {venueLayoutType === 'seated' && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Selected
                </p>

                <p className="font-display text-2xl font-black text-cyan-200">
                  {selectedSeats.length}/{totalTickets}
                </p>
              </div>
            )}
          </div>

          {/* SECTIONED LAYOUT */}

          {venueLayoutType === 'sectioned' && (
            <div className="grid gap-4 md:grid-cols-2">
              {(event?.seatingConfig?.sectionNames ||
                []).map((section) => {
                const active =
                  selectedSection === section;

                return (
                  <button
                    key={section}
                    onClick={() =>
                      setSelectedSection(section)
                    }
                    className={`rounded-3xl border p-6 text-left transition ${
                      active
                        ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_35px_rgba(6,182,212,0.25)]'
                        : 'border-white/10 bg-white/[0.03] hover:border-cyan-400/30 hover:bg-cyan-400/5'
                    }`}
                  >
                    <p className="text-xl font-black text-white">
                      {section}
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      Premium event access section
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* SEATED LAYOUT */}

          {venueLayoutType === 'seated' &&
            enableSeatSelection && (
              <SeatMap
                ticketTypes={tickets}
                selections={selections}
                selectedSeats={selectedSeats}
                bookedSeats={bookedSeats}
                onSelect={setSelectedSeats}
                rows={
                  event?.seatingConfig?.rows || 10
                }
                seatsPerRow={
                  event?.seatingConfig
                    ?.seatsPerRow || 12
                }
              />
            )}
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-5"
        >
          <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <h2 className="font-display text-2xl font-black text-white">
              Booking Summary
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="font-bold text-white">
                  {event.title}
                </h3>

                <div className="mt-3 space-y-2 text-sm text-slate-400">
                  <p className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-cyan-300" />
                    {new Date(
                      event.startDate
                    ).toLocaleString()}
                  </p>

                  {event.venue && (
                    <p className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-blue-300" />
                      {event.venue?.name},{' '}
                      {event.venue?.city}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {selectedTicketList.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        {ticket.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {ticket.qty} ×{' '}
                        {formatCurrency(ticket.price)}
                      </p>
                    </div>

                    <p className="font-bold text-cyan-200">
                      {formatCurrency(
                        Number(ticket.price || 0) *
                          ticket.qty
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {selectedSection && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Selected Section
                  </p>

                  <p className="text-sm font-bold text-white">
                    {selectedSection}
                  </p>
                </div>
              )}

              {selectedSeats.length > 0 && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Selected Seats
                  </p>

                  <p className="text-sm font-bold text-white">
                    {selectedSeats.join(', ')}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm font-medium text-slate-400">
                  Subtotal
                </span>

                <span className="font-display text-2xl font-black text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {!canContinue && (
                <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-center text-xs font-semibold text-amber-200">
                  {venueLayoutType === 'sectioned'
                    ? 'Select one section to continue.'
                    : `Select ${totalTickets} seat${
                        totalTickets > 1 ? 's' : ''
                      } to continue.`}
                </p>
              )}

              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black transition ${
                  canContinue
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_35px_rgba(6,182,212,0.35)] hover:-translate-y-1'
                    : 'cursor-not-allowed bg-white/10 text-slate-500'
                }`}
              >
                Continue to Checkout

                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}