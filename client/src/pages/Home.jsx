import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGetFeaturedEventsQuery } from '../features/events/eventsApi';
import EventGrid from '../components/events/EventGrid';
import EventCard from '../components/events/EventCard';
import { CalendarDaysIcon, TicketIcon, UsersIcon, StarIcon } from '@heroicons/react/24/outline';

const STATS = [
  { icon: CalendarDaysIcon, label: 'Events Hosted', value: '2,400+' },
  { icon: TicketIcon, label: 'Tickets Sold', value: '180K+' },
  { icon: UsersIcon, label: 'Happy Attendees', value: '95K+' },
  { icon: StarIcon, label: 'Avg Rating', value: '4.9 ⭐' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { data, isLoading, error } = useGetFeaturedEventsQuery();
  const featured = Array.isArray(data) ? data : data?.events ?? [];

  return (
    <div className="min-h-screen overflow-hidden bg-[#020617]">
      <section className="relative overflow-hidden pt-28 pb-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.14),transparent_35%)]" />

        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-10 top-40 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"
        />

        <motion.div
          animate={{ y: [0, 18, 0], x: [0, -14, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-10 top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
        />

        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="container-app relative text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-white/5 text-xs font-medium text-cyan-300 mb-7 backdrop-blur-xl"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live events happening near you
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6"
          >
            Discover &amp;{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-emerald-300 bg-clip-text text-transparent">
              Experience
            </span>
            <br />
            Unforgettable Events
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-400 text-lg max-w-xl mx-auto mb-10"
          >
            From concerts and tech conferences to food festivals — find, book, and manage
            events all in one place.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/events"
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 font-bold text-white shadow-[0_0_35px_rgba(6,182,212,0.35)] transition hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(6,182,212,0.55)]"
            >
              Browse Events →
            </Link>

            <Link
              to="/register"
              className="rounded-2xl border border-cyan-400/30 bg-white/5 px-8 py-4 font-bold text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-cyan-400/10"
            >
              Become an Organizer
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="container-app -mt-10 relative z-10 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ icon: Icon, label, value }, index) => (
            <motion.div
              key={label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            >
              <Icon className="w-7 h-7 text-cyan-300 mx-auto mb-3" />
              <p className="font-display font-black text-2xl text-white">{value}</p>
              <p className="text-slate-400 text-xs mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container-app mb-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="font-display font-black text-3xl text-white">Featured Events</h2>
            <p className="text-slate-400 mt-1">Hand-picked experiences you&apos;ll love</p>
          </div>

          <Link
            to="/events"
            className="hidden sm:inline-flex rounded-full border border-cyan-400/20 px-5 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/10"
          >
            View all →
          </Link>
        </motion.div>

        {isLoading || error ? (
          <EventGrid isLoading={isLoading} error={error} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((event, index) => (
              <motion.div
                key={event._id}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}

            {featured.length < 3 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="group flex min-h-[420px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cyan-400/20 bg-white/[0.035] p-8 text-center backdrop-blur-xl transition hover:border-cyan-400/50 hover:bg-cyan-400/5"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/10"
                >
                  <CalendarDaysIcon className="w-7 h-7 text-cyan-300" />
                </motion.div>

                <h3 className="font-display font-bold text-xl text-white mb-2">No more events yet</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-[230px]">
                  Want to host an experience? Create and manage it easily here.
                </p>

                <Link
                  to="/dashboard/events/new"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                >
                  Create Event
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </section>

      <section className="container-app mb-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.28)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/25 via-blue-900/20 to-emerald-900/20" />

          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl"
          />

          <motion.div
            animate={{ x: [0, -25, 0], y: [0, 18, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-emerald-500/15 blur-3xl"
          />

          <div className="relative">
            <h2 className="font-display font-black text-3xl text-white mb-3">
              Ready to host your own event?
            </h2>

            <p className="text-slate-400 max-w-md mx-auto mb-7">
              Create, promote, and manage your events with powerful tools built for organizers.
            </p>

            <Link
              to="/register"
              className="inline-flex rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 font-black text-white shadow-[0_0_35px_rgba(16,185,129,0.35)] transition hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(16,185,129,0.55)]"
            >
              Start for Free
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}