const mongoose = require('mongoose');

const seatHoldSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    seats: [
      {
        type: String,
        required: true,
      },
    ],

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

seatHoldSchema.index(
  {
    event: 1,
    seats: 1,
  },
  { unique: false }
);

module.exports = mongoose.model(
  'SeatHold',
  seatHoldSchema
);