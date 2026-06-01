const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },

    type: {
      type: String,
      enum: ['general', 'vip', 'earlyBird'],
      required: [true, 'Ticket type is required'],
    },

    name: {
      type: String,
      required: [true, 'Ticket name is required'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Price cannot be negative'],
    },

    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Total quantity must be at least 1'],
    },

    soldQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    saleStartDate: {
      type: Date,
    },

    saleEndDate: {
      type: Date,
    },

    perUserLimit: {
      type: Number,
      default: 5,
      min: [1, 'Per-user limit must be at least 1'],
    },

    // ─────────────────────────────────────────────
    // NEW FLEXIBLE VENUE / SEATING SYSTEM
    // ─────────────────────────────────────────────

    venueLayoutType: {
      type: String,
      enum: ['standing', 'sectioned', 'seated'],
      default: 'standing',
    },

    sectionName: {
      type: String,
      default: 'General',
      trim: true,
    },

    sectionCapacity: {
      type: Number,
      default: null,
      min: 1,
    },

    seatPrefix: {
      type: String,
      default: '',
      trim: true,
    },

    seatRows: {
      type: Number,
      default: 0,
      min: 0,
    },

    seatsPerRow: {
      type: Number,
      default: 0,
      min: 0,
    },

    allowSeatSelection: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ticketSchema.index({ event: 1 });

ticketSchema.index({ event: 1, type: 1 });

ticketSchema.index({ event: 1, sectionName: 1 });

// Virtual: remaining tickets
ticketSchema.virtual('remainingQuantity').get(function () {
  return this.totalQuantity - this.soldQuantity;
});

// Virtual: total generated seats
ticketSchema.virtual('totalSeatCount').get(function () {
  if (!this.seatRows || !this.seatsPerRow) return 0;

  return this.seatRows * this.seatsPerRow;
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;