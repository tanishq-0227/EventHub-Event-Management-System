import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema } from '../../utils/validators';
import { useCreateEventMutation } from '../../features/events/eventsApi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Conference',
  'Concert',
  'Festival',
  'Sports',
  'Workshop',
  'Networking',
  'Exhibition',
  'Other',
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [layoutType, setLayoutType] = useState('standing');
  const [createEvent, { isLoading }] = useCreateEventMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      isFeatured: false,
      venueLayoutType: 'standing',
      enableSeatSelection: false,
      seatRows: '',
      seatsPerRow: '',
      sectionNames: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();

      Object.entries(values).forEach(([k, v]) => {
        if (k.startsWith('_')) return;
        if (v === undefined || v === '') return;

        formData.append(k, typeof v === 'boolean' ? String(v) : v);
      });

      const banner = values._bannerFile?.[0];

      if (banner) {
        formData.append('bannerImage', banner);
      }

      const result = await createEvent(formData).unwrap();

      toast.success('Event created! 🎉');

      const eventId = result?._id ?? result?.id;

      navigate(
        eventId ? `/dashboard/events/${eventId}/tickets` : '/dashboard/events'
      );
    } catch (err) {
      toast.error(err?.data?.message ?? 'Failed to create event.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Create Event</h1>
        <p className="page-subtitle">
          Fill in the details and configure how attendees will enter your event.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="glass space-y-6 p-6"
        noValidate
      >
        <div className="space-y-5">
          <Input
            id="ev-title"
            label="Event Title"
            required
            placeholder="Amazing Concert 2025"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              id="ev-venue"
              label="Venue"
              required
              placeholder="Convention Centre"
              error={errors.venue?.message}
              {...register('venue')}
            />

            <Input
              id="ev-city"
              label="City"
              required
              placeholder="Mumbai"
              error={errors.city?.message}
              {...register('city')}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              id="ev-start"
              label="Start Date"
              required
              type="datetime-local"
              error={errors.startDate?.message}
              {...register('startDate')}
            />

            <Input
              id="ev-end"
              label="End Date"
              type="datetime-local"
              error={errors.endDate?.message}
              {...register('endDate')}
            />
          </div>

          <div>
            <label className="label">
              Category <span className="text-red-400">*</span>
            </label>

            <select
              id="ev-category"
              className={`input ${errors.category ? 'input-error' : ''}`}
              {...register('category')}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c.toLowerCase()}>
                  {c}
                </option>
              ))}
            </select>

            {errors.category && (
              <p className="error-msg">{errors.category.message}</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5">
            <h3 className="text-lg font-black text-white">
              Venue Layout
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Choose how ticket holders will access the event.
            </p>
          </div>

          <div>
            <label className="label">Layout Type</label>

            <select
              className="input"
              {...register('venueLayoutType')}
              onChange={(e) => setLayoutType(e.target.value)}
            >
              <option value="standing">Standing Event</option>
              <option value="sectioned">Sectioned Venue</option>
              <option value="seated">Seated Venue</option>
            </select>

            <p className="mt-2 text-xs text-slate-500">
              Standing = no seats · Sectioned = VIP/Gold/Balcony blocks ·
              Seated = actual visual seat map
            </p>
          </div>

          {(layoutType === 'sectioned' || layoutType === 'seated') && (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                id="seat-rows"
                label="Seat Rows"
                type="number"
                min="1"
                placeholder="e.g. 20"
                {...register('seatRows')}
              />

              <Input
                id="seats-per-row"
                label="Seats Per Row"
                type="number"
                min="1"
                placeholder="e.g. 30"
                {...register('seatsPerRow')}
              />
            </div>
          )}

          {layoutType === 'sectioned' && (
            <div className="mt-5">
              <Input
                id="section-names"
                label="Section Names"
                placeholder="VIP, Gold, Silver, Balcony"
                {...register('sectionNames')}
              />

              <p className="mt-2 text-xs text-slate-500">
                Separate each section with comma.
              </p>
            </div>
          )}

          {layoutType === 'seated' && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <input
                id="enable-seat-selection"
                type="checkbox"
                className="h-4 w-4 accent-primary-500"
                {...register('enableSeatSelection')}
              />

              <label
                htmlFor="enable-seat-selection"
                className="text-sm font-semibold text-cyan-100"
              >
                Enable visual seat selection for attendees
              </label>
            </div>
          )}
        </div>

        <Input
          id="ev-capacity"
          label="Total Capacity"
          type="number"
          min="1"
          required
          placeholder="e.g. 500"
          error={errors.totalCapacity?.message}
          {...register('totalCapacity')}
        />

        <div>
          <label className="label">
            Description <span className="text-red-400">*</span>
          </label>

          <textarea
            id="ev-desc"
            rows={4}
            placeholder="Describe your event…"
            className={`input resize-none ${
              errors.description ? 'input-error' : ''
            }`}
            {...register('description')}
          />

          {errors.description && (
            <p className="error-msg">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="label">Banner Image</label>

          <div className="flex flex-col items-start gap-4 sm:flex-row">
            {preview && (
              <div className="h-24 w-40 flex-shrink-0 overflow-hidden rounded-xl border border-primary-500/30 bg-surface-border">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="w-full flex-1">
              <input
                id="ev-banner"
                type="file"
                accept="image/*"
                className="input cursor-pointer py-2 text-slate-400"
                {...register('_bannerFile', {
                  onChange: (e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      setPreview(URL.createObjectURL(file));
                    }
                  },
                })}
              />

              <p className="mt-1 text-[10px] text-slate-500">
                Recommend 1280x720. Max size 5MB.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="ev-featured"
            type="checkbox"
            className="h-4 w-4 accent-primary-500"
            {...register('isFeatured')}
          />

          <label htmlFor="ev-featured" className="text-sm text-slate-300">
            Mark as featured event
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isLoading} className="btn-md btn-primary">
            Create Event
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard/events')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}