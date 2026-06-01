import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatDate';
import Badge from '../ui/Badge';

const categoryColors = {
  music: 'primary',
  tech: 'success',
  sports: 'accent',
  food: 'warning',
  art: 'neutral',
  business: 'primary',
  education: 'success',
  default: 'neutral',
};

export default function EventCard({ event }) {
  if (!event) return null;

  const getLowestTicketPrice = () => {
    const tickets = event.ticketTypes || event.tickets || [];

    const prices = tickets
      .map((ticket) =>
        Number(
          ticket.price ??
          ticket.amount ??
          ticket.ticketPrice ??
          ticket.basePrice ??
          0
        )
      )
      .filter((price) => Number.isFinite(price) && price > 0);

    if (prices.length === 0) return 'Free';

    return `₹${Math.min(...prices)}`;
  };

  const priceDisplay = getLowestTicketPrice();

  const hasTicketTypes = event.ticketTypes?.length > 0;
  const color =
    categoryColors[event.category?.toLowerCase()] ??
    categoryColors.default;

  const totalRemaining = hasTicketTypes
    ? event.ticketTypes.reduce(
        (s, t) => s + (t.totalQuantity - (t.soldQuantity ?? 0)),
        0
      )
    : Math.max(
        0,
        (event.totalCapacity ?? 0) - (event.soldCount ?? 0)
      );

  const soldOut =
    event.totalCapacity > 0 && totalRemaining <= 0;

  return (
    <Link
      to={`/events/${event._id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/40 hover:shadow-[0_25px_80px_rgba(6,182,212,0.25)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      {/* Banner */}
      <div className="relative h-56 overflow-hidden bg-slate-900">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950">
            <CalendarDaysIcon className="h-14 w-14 text-cyan-300/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

        {/* Badges */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {event.isFeatured && (
            <span className="flex items-center gap-1 rounded-full border border-yellow-300/30 bg-yellow-400/15 px-3 py-1 text-xs font-black text-yellow-200 backdrop-blur-xl">
              <SparklesIcon className="h-3.5 w-3.5" />
              Featured
            </span>
          )}

          {soldOut && <Badge variant="danger">Sold Out</Badge>}
        </div>

        {event.category && (
          <div className="absolute right-4 top-4">
            <Badge variant={color}>{event.category}</Badge>
          </div>
        )}

        {/* Price */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
              Starting from
            </p>
            <p className="font-display text-lg font-black text-white">
              {priceDisplay}
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xl">
            {event.totalCapacity > 0
              ? `${totalRemaining} seats left`
              : 'Open Entry'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="line-clamp-2 font-display text-xl font-black leading-tight text-white transition group-hover:text-cyan-200">
            {event.title}
          </h3>

          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                <CalendarDaysIcon className="h-4 w-4" />
              </span>
              <span>{formatDate(event.startDate)}</span>
            </div>

            {(event.venue?.city || event.venue?.name) && (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                  <MapPinIcon className="h-4 w-4" />
                </span>
                <span className="truncate">
                  {event.venue?.city || event.venue?.name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <UsersIcon className="h-4 w-4" />
              </span>
              <span>
                {event.totalCapacity > 0
                  ? `${totalRemaining} available`
                  : 'Unlimited access'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            View Details
          </span>

          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] transition group-hover:translate-x-1">
            <ArrowRightIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}