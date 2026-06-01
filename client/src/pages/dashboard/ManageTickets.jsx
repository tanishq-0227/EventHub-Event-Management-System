import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import {
  useGetEventByIdQuery,
  eventsApi,
} from '../../features/events/eventsApi';

import axiosClient from '../../api/axiosClient';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

import { formatCurrency } from '../../utils/formatCurrency';

import toast from 'react-hot-toast';

import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

export default function ManageTickets() {
  const { id } = useParams();

  const dispatch = useDispatch();

  const { data: eventResp, isLoading: isLoadingEvent } =
    useGetEventByIdQuery(id);

  const [tickets, setTickets] = useState([]);

  const [isLoadingTickets, setIsLoadingTickets] =
    useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [saving, setSaving] = useState(false);

  const event = eventResp;

  const venueLayoutType =
    event?.venueLayoutType || 'standing';

  const fetchTickets = async () => {
    setIsLoadingTickets(true);

    try {
      const res = await axiosClient.get(
        `/api/tickets/event/${id}`
      );

      const raw = res.data?.data ?? res.data;

      setTickets(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (id) fetchTickets();
  }, [id]);

  const handleOpenModal = (ticket = null) => {
    setEditing(ticket);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditing(null);
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);

    const data = {
      name: form.get('name'),

      price: Number(form.get('price')),

      totalQuantity: Number(form.get('capacity')),

      description: form.get('description'),

      event: id,

      type: form.get('type') || 'general',

      venueLayoutType,

      sectionName:
        form.get('sectionName') || 'General',

      allowSeatSelection:
        form.get('allowSeatSelection') === 'on',

      seatRows:
        Number(form.get('seatRows')) || 0,

      seatsPerRow:
        Number(form.get('seatsPerRow')) || 0,
    };

    setSaving(true);

    try {
      if (editing) {
        await axiosClient.patch(
          `/api/tickets/${editing._id}`,
          data
        );

        toast.success('Ticket updated');
      } else {
        await axiosClient.post(`/api/tickets`, data);

        toast.success('Ticket added');
      }

      fetchTickets();

      handleCloseModal();

      dispatch(
        eventsApi.util.invalidateTags([
          { type: 'Event', id },
          'Event',
        ])
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          'Failed to save ticket'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!confirm('Delete this ticket?')) return;

    try {
      await axiosClient.delete(
        `/api/tickets/${ticketId}`
      );

      toast.success('Ticket deleted');

      fetchTickets();

      dispatch(
        eventsApi.util.invalidateTags([
          { type: 'Event', id },
          'Event',
        ])
      );
    } catch {
      toast.error('Failed to delete ticket');
    }
  };

  if (isLoadingEvent || isLoadingTickets) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Manage Tickets
          </h1>

          <p className="page-subtitle">
            Configure ticket types for{' '}
            {event?.title}
          </p>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          className="btn-md btn-primary gap-1.5"
        >
          <PlusIcon className="h-4 w-4" />
          Add Ticket
        </Button>
      </div>

      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          Venue Layout Mode
        </p>

        <p className="mt-1 text-lg font-black text-white">
          {venueLayoutType.toUpperCase()}
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="glass p-16 text-center">
          <p className="mb-4 text-slate-400">
            No tickets configured yet.
          </p>

          <Button
            onClick={() => handleOpenModal()}
            className="btn-md btn-secondary"
          >
            Add First Ticket
          </Button>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-slate-400">
                <th className="px-5 py-3 font-medium">
                  Ticket
                </th>

                <th className="px-4 py-3 font-medium">
                  Price
                </th>

                <th className="px-4 py-3 font-medium">
                  Capacity
                </th>

                <th className="px-4 py-3 font-medium">
                  Sold
                </th>

                <th className="px-4 py-3 font-medium">
                  Section
                </th>

                <th className="px-4 py-3 font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t._id}
                  className="border-b border-surface-border/50 hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">
                      {t.name}
                    </p>

                    {t.description && (
                      <p className="max-w-[220px] truncate text-xs text-slate-500">
                        {t.description}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {formatCurrency(t.price)}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {t.totalQuantity}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {t.soldQuantity}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                      {t.sectionName || 'General'}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          handleOpenModal(t)
                        }
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-primary-500/20 hover:text-primary-300"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(t._id)
                        }
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={
          editing ? 'Edit Ticket' : 'Add Ticket'
        }
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            id="tkt-name"
            name="name"
            label="Name"
            required
            defaultValue={editing?.name}
            placeholder="VIP Pass"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="tkt-price"
              name="price"
              label="Price (₹)"
              type="number"
              min="0"
              required
              defaultValue={
                editing?.price ?? 0
              }
            />

            <Input
              id="tkt-cap"
              name="capacity"
              label="Capacity"
              type="number"
              min="1"
              required
              defaultValue={
                editing?.totalQuantity ??
                100
              }
            />
          </div>

          <div>
            <label className="label">
              Ticket Type
            </label>

            <select
              name="type"
              defaultValue={
                editing?.type || 'general'
              }
              className="input"
            >
              <option value="general">
                General
              </option>

              <option value="vip">
                VIP
              </option>

              <option value="earlyBird">
                Early Bird
              </option>
            </select>
          </div>

          {(venueLayoutType === 'sectioned' ||
            venueLayoutType === 'seated') && (
            <Input
              id="section-name"
              name="sectionName"
              label="Section Name"
              defaultValue={
                editing?.sectionName ||
                'General'
              }
              placeholder="VIP / Balcony / Gold"
            />
          )}

          {venueLayoutType === 'seated' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="seat-rows"
                  name="seatRows"
                  label="Seat Rows"
                  type="number"
                  min="1"
                  defaultValue={
                    editing?.seatRows || 10
                  }
                />

                <Input
                  id="seats-per-row"
                  name="seatsPerRow"
                  label="Seats Per Row"
                  type="number"
                  min="1"
                  defaultValue={
                    editing?.seatsPerRow ||
                    12
                  }
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <input
                  id="allow-seat-selection"
                  type="checkbox"
                  name="allowSeatSelection"
                  defaultChecked={
                    editing?.allowSeatSelection ??
                    true
                  }
                  className="h-4 w-4 accent-primary-500"
                />

                <label
                  htmlFor="allow-seat-selection"
                  className="text-sm font-semibold text-cyan-100"
                >
                  Enable visual seat selection
                </label>
              </div>
            </>
          )}

          <div>
            <label className="label">
              Description
            </label>

            <textarea
              name="description"
              rows={2}
              className="input resize-none"
              defaultValue={
                editing?.description
              }
              placeholder="Premium front-row access"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              type="submit"
              loading={saving}
              className="btn-md btn-primary w-full"
            >
              Save Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}