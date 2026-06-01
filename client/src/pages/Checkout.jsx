import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema } from '../utils/validators';
import { useCreateOrderMutation, useVerifyPaymentMutation } from '../features/payments/paymentsApi';
import { useGetEventByIdQuery } from '../features/events/eventsApi';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

const CHECKOUT_TIME = 5 * 60;

export default function Checkout() {
  const { eventId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const selections = state?.selections ?? {};
  const selectedSeats = state?.selectedSeats ?? [];

  const [timeLeft, setTimeLeft] = useState(() => {
    const key = `checkout-timer-${eventId}`;
    const saved = sessionStorage.getItem(key);

    if (saved) {
      const remaining = Number(saved) - Date.now();
      if (remaining > 0) return Math.floor(remaining / 1000);
    }

    const expiry = Date.now() + CHECKOUT_TIME * 1000;
    sessionStorage.setItem(key, expiry.toString());

    return CHECKOUT_TIME;
  });

  useEffect(() => {
    const hasAny = Object.values(selections).some((q) => q > 0);
    if (!hasAny) {
      navigate(`/events/${eventId}`, { replace: true });
    }
  }, [selections, navigate, eventId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      sessionStorage.removeItem(`checkout-timer-${eventId}`);
      toast.error('Checkout session expired');
      navigate(`/events/${eventId}`, { replace: true });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, eventId, navigate]);

  const { data: event, isLoading } = useGetEventByIdQuery(eventId);
  const [createOrder, { isLoading: ordering }] = useCreateOrderMutation();
  const [verifyPayment, { isLoading: verifying }] = useVerifyPaymentMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      attendeeName: user?.name ?? '',
      attendeeEmail: user?.email ?? '',
      attendeePhone: '',
    },
  });

  const tickets = event?.ticketTypes ?? [];

  const lineItems = tickets
    .filter((t) => (selections[t._id] ?? 0) > 0)
    .map((t) => ({ ...t, qty: selections[t._id] }));

  const total = lineItems.reduce(
    (s, t) => s + Number(t.price ?? 0) * Number(t.qty ?? 0),
    0
  );

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, '0');

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const onSubmit = async (formValues) => {
    if (lineItems.length === 0) {
      toast.error('Please select at least one ticket.');
      return;
    }

    try {
      const orderData = await createOrder({
        eventId,
        tickets: lineItems.map((t) => ({
          ticketId: t._id,
          quantity: t.qty,
        })),
        attendee: formValues,
        selectedSeats,
      }).unwrap();

      if (orderData.isFree) {
        sessionStorage.removeItem(`checkout-timer-${eventId}`);
        toast.success('Free booking confirmed! 🎉');
        navigate('/payment-success', {
          state: { bookingId: orderData.bookingId },
          replace: true,
        });
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway could not load. Check your connection.');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency ?? 'INR',
        name: 'EventHub',
        description: event?.title,
        order_id: orderData.orderId,
        prefill: {
          name: formValues.attendeeName,
          email: formValues.attendeeEmail,
          contact: formValues.attendeePhone ?? '',
        },
        theme: { color: '#06b6d4' },
        handler: async (response) => {
          try {
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: orderData.bookingId,
            }).unwrap();

            console.log('Payment verification successful:', verifyResult);
            sessionStorage.removeItem(`checkout-timer-${eventId}`);
            toast.success('Payment successful! 🎉');

            navigate('/payment-success', {
              state: { bookingId: orderData.bookingId },
              replace: true,
            });
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            const errorMessage =
              verifyErr?.data?.message ||
              verifyErr?.message ||
              'Payment verification failed. Please contact support.';

            toast.error(errorMessage);
          }
        },
        modal: {
          ondismiss: () =>
            toast('Payment cancelled. Your checkout timer is still running.', {
              icon: 'ℹ️',
            }),
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'Could not process your booking. Please try again.';

      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-app relative max-w-5xl overflow-hidden py-10">
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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative mb-8"
      >
        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Secure Checkout
        </p>
        <h1 className="font-display text-4xl font-black text-white md:text-5xl">
          Complete your booking
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Review your tickets, selected seats, and attendee details before payment.
        </p>
      </motion.div>

      <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-5">
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 lg:col-span-3"
          noValidate
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
            <h2 className="mb-4 font-display text-2xl font-black text-white">
              Attendee Details
            </h2>

            <div className="space-y-4">
              <Input
                id="att-name"
                label="Full Name"
                type="text"
                required
                placeholder="Your full name"
                error={errors.attendeeName?.message}
                {...register('attendeeName')}
              />

              <Input
                id="att-email"
                label="Email"
                type="email"
                required
                placeholder="you@example.com"
                error={errors.attendeeEmail?.message}
                {...register('attendeeEmail')}
              />

              <Input
                id="att-phone"
                label="Phone"
                type="tel"
                placeholder="Optional — e.g. 9876543210"
                error={errors.attendeePhone?.message}
                {...register('attendeePhone')}
              />
            </div>
          </div>

          <Button
            type="submit"
            loading={ordering || verifying}
            className="w-full btn-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_35px_rgba(6,182,212,0.35)]"
            disabled={lineItems.length === 0}
          >
            {total === 0 ? 'Confirm Free Booking' : `Pay ${formatCurrency(total)}`}
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-2"
        >
          <div className="sticky top-20 space-y-4 rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-black text-white">
                Order Summary
              </h2>

              <div
                className={`rounded-2xl border px-4 py-2 text-center transition-all ${
                  timeLeft <= 60
                    ? 'border-red-400/30 bg-red-500/15 text-red-200 animate-pulse'
                    : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                  Time Left
                </p>

                <p className="font-display text-xl font-black">
                  {minutes}:{seconds}
                </p>
              </div>
            </div>

            <p className="text-sm font-bold text-cyan-300">{event?.title}</p>

            {selectedSeats.length > 0 && (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 shadow-[0_0_25px_rgba(34,211,238,0.15)]">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Selected Seats
                </p>

                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat}
                      className="rounded-xl border border-cyan-300/30 bg-cyan-400/20 px-3 py-1 text-sm font-bold text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lineItems.length === 0 ? (
              <p className="text-sm text-slate-400">No tickets selected.</p>
            ) : (
              <div className="space-y-2">
                {lineItems.map((t) => (
                  <div
                    key={t._id}
                    className="flex justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm"
                  >
                    <span className="text-slate-300">
                      {t.name} × {t.qty}
                    </span>

                    <span className="font-bold text-white">
                      {formatCurrency(Number(t.price ?? 0) * Number(t.qty ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between border-t border-white/10 pt-4">
              <span className="text-slate-400">Total</span>
              <span className="font-display text-2xl font-black text-cyan-200">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}