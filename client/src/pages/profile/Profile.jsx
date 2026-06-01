import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import {
  useGetUserBookingsQuery,
  useRequestCancellationMutation,
  useCancelBookingMutation,
} from '../../features/bookings/bookingsApi';
import { useGetFeaturedEventsQuery } from '../../features/events/eventsApi';

import axiosClient from '../../api/axiosClient';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../features/auth/authSlice';

import BookingCard from '../../components/bookings/BookingCard';
import CancelModal from '../../components/bookings/CancelModal';
import QRModal from '../../components/bookings/QRModal';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

import toast from 'react-hot-toast';

import {
  TicketIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);
  const [selectedBk, setSelectedBk] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const {
    data: bookingsData,
    isLoading: bkLoading,
    isError: bkError,
    error: bkErrorDetail,
    refetch,
  } = useGetUserBookingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { data: featuredEvents = [] } = useGetFeaturedEventsQuery();
  const recommendedEvents = featuredEvents.slice(0, 3);

  const [requestCancellation, { isLoading: cancelling }] =
    useRequestCancellationMutation();

  const [cancelBooking] = useCancelBookingMutation();

  const bookings = Array.isArray(bookingsData)
    ? bookingsData
    : bookingsData?.bookings ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      bio: user?.bio ?? '',
    },
  });

  const onSave = async (values) => {
    setSaving(true);

    try {
      const { data } = await axiosClient.patch('/api/users/profile', values);

      const raw = data?.data ?? data?.user ?? data;

      const updatedUser = {
        id: raw._id ?? raw.id,
        name: raw.name,
        email: raw.email,
        role: raw.role,
        avatar: raw.avatar ?? null,
      };

      dispatch(setCredentials({ user: updatedUser }));
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDirectCancel = async (bookingId) => {
    try {
      await cancelBooking(bookingId).unwrap();
      toast.success('Booking cancelled successfully.');
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to cancel booking.');
    }
  };

  const handleConfirmCancel = async (reason) => {
    if (!cancelTarget) return;

    try {
      await requestCancellation({
        bookingId: cancelTarget._id,
        cancellationReason: reason,
      }).unwrap();

      toast.success(
        'Cancellation request submitted! Admin will review within 24 hours.'
      );

      setCancelTarget(null);
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to submit cancellation request.');
    }
  };

  return (
    <div className="container-app relative max-w-7xl py-8">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              <SparklesIcon className="h-4 w-4" />
              EventHub Profile
            </p>

            <h1 className="bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-5xl font-black tracking-tight text-transparent">
              My Profile
            </h1>

            <p className="mt-2 text-slate-400">
              Manage your bookings, tickets and account settings.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-white"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.05] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
              <div className="relative h-28 bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-700">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_40%)]" />
              </div>

              <div className="relative px-6 pb-6">
                <div className="-mt-12 flex flex-col items-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#070B1A] bg-gradient-to-br from-cyan-400 to-violet-600 text-4xl font-black text-white shadow-[0_0_50px_rgba(34,211,238,0.35)]">
                    {user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>

                  <h2 className="mt-4 text-center text-2xl font-black text-white">
                    {user?.name}
                  </h2>

                  <p className="mt-1 text-center text-sm text-slate-400">
                    {user?.email}
                  </p>

                  <span className="mt-4 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    {user?.role ?? 'Attendee'}
                  </span>
                </div>

                <form
                  onSubmit={handleSubmit(onSave)}
                  className="mt-7 space-y-4"
                  noValidate
                >
                  <Input
                    id="prof-name"
                    label="Name"
                    type="text"
                    error={errors.name?.message}
                    {...register('name')}
                  />

                  <Input
                    id="prof-phone"
                    label="Phone"
                    type="tel"
                    placeholder="10 digits"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />

                  <div>
                    <label className="label">Bio</label>

                    <textarea
                      id="prof-bio"
                      rows={3}
                      placeholder="Tell us about yourself…"
                      className="input resize-none"
                      {...register('bio')}
                    />

                    {errors.bio && (
                      <p className="error-msg">{errors.bio.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    loading={saving}
                    className="w-full rounded-2xl"
                  >
                    Save Changes
                  </Button>
                </form>
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-black text-white">
                  Recommended
                </h3>

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Featured
                </span>
              </div>

              {recommendedEvents.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                  <TicketIcon className="mx-auto mb-2 h-7 w-7 text-slate-600" />
                  <p className="text-sm text-slate-400">
                    No featured events right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedEvents.map((event) => (
                    <a
                      key={event._id}
                      href={`/events/${event._id}`}
                      className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                    >
                      <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-surface-border">
                        {event.bannerImage ? (
                          <img
                            src={event.bannerImage}
                            alt={event.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-cyan-300">
                            🎟️
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">
                          {event.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {event.venue?.city || event.venue?.name || 'Online'} ·{' '}
                          {event.startDate
                            ? new Date(event.startDate).toLocaleDateString()
                            : 'Date TBD'}
                        </p>

                        <p className="mt-1 text-xs font-bold text-cyan-300">
                          View event →
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">
                  My Bookings
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Your recent bookings and active tickets.
                </p>
              </div>
            </div>

            {bkLoading && (
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            )}

            {!bkLoading && bkError && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-10 text-center">
                <ExclamationTriangleIcon className="mx-auto mb-4 h-10 w-10 text-red-400" />

                <p className="mb-1 text-lg font-bold text-red-300">
                  Failed to load bookings
                </p>

                <p className="mb-5 text-sm text-slate-500">
                  {bkErrorDetail?.data?.message ??
                    bkErrorDetail?.error ??
                    'Please try again'}
                </p>

                <button
                  onClick={() => refetch()}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                >
                  Retry
                </button>
              </div>
            )}

            {!bkLoading && !bkError && bookings.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-16 text-center">
                <TicketIcon className="mx-auto mb-4 h-14 w-14 text-slate-600" />

                <p className="mb-1 text-xl font-bold text-white">
                  No bookings yet
                </p>

                <p className="text-slate-400">
                  Browse events and book your first ticket!
                </p>
              </div>
            )}

            {!bkLoading && !bkError && bookings.length > 0 && (
              <div className="space-y-5">
                {bookings.map((bk) => (
                  <BookingCard
                    key={bk._id}
                    booking={bk}
                    onDirectCancel={handleDirectCancel}
                    onRequestCancel={setCancelTarget}
                    onViewQr={setSelectedBk}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <QRModal
        isOpen={!!selectedBk}
        onClose={() => setSelectedBk(null)}
        booking={selectedBk}
      />

      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleConfirmCancel}
          isLoading={cancelling}
        />
      )}
    </div>
  );
}