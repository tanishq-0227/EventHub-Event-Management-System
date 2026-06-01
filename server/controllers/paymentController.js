const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const IssuedTicket = require('../models/IssuedTicket');
const Event = require('../models/Event');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const validateRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keyId.trim()) {
    console.error('❌ RAZORPAY_KEY_ID not configured');
    throw new Error('Razorpay key ID not configured');
  }

  if (!keySecret || !keySecret.trim()) {
    console.error('❌ RAZORPAY_KEY_SECRET not configured');
    throw new Error('Razorpay key secret not configured');
  }

  return { keyId: keyId.trim(), keySecret: keySecret.trim() };
};

const getRazorpay = () => {
  const { keyId, keySecret } = validateRazorpayConfig();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const rollbackBooking = async (bookingId, ticketLines) => {
  try {
    for (const { ticket, quantity } of ticketLines) {
      await Ticket.findByIdAndUpdate(ticket, {
        $inc: { soldQuantity: -quantity },
      });
    }

    const totalQty = ticketLines.reduce((s, l) => s + l.quantity, 0);
    const booking = await Booking.findById(bookingId);

    if (booking) {
      await Event.findByIdAndUpdate(booking.event, {
        $inc: { soldCount: -totalQty },
      });

      booking.status = 'cancelled';
      await booking.save();
    }
  } catch (rbErr) {
    console.error(
      '⚠️  Rollback error (manual intervention may be needed):',
      rbErr.message
    );
  }
};

const createOrder = async (req, res) => {
  const {
    eventId,
    tickets: ticketLines,
    attendee,
    selectedSeats = [],
  } = req.body;

  if (!eventId) throw new ApiError(400, 'eventId is required');

  if (!ticketLines || ticketLines.length === 0) {
    throw new ApiError(400, 'At least one ticket must be selected');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let booking;
  let totalAmount = 0;
  const savedTicketLines = [];

  try {
    const event = await Event.findById(eventId).session(session);

    if (!event) throw new ApiError(404, 'Event not found');
    if (event.status !== 'published') {
      throw new ApiError(400, 'Event is not open for booking');
    }

    let totalQtyBooked = 0;

    for (const { ticketId, quantity } of ticketLines) {
      if (!ticketId || !quantity || quantity < 1) {
        throw new ApiError(
          400,
          'Each ticket entry needs a valid ticketId and quantity ≥ 1'
        );
      }

      const ticket = await Ticket.findById(ticketId).session(session);

      if (!ticket) throw new ApiError(404, 'Ticket not found');
      if (!ticket.isActive) {
        throw new ApiError(
          400,
          `Ticket "${ticket.name}" is no longer available`
        );
      }

      const remaining = ticket.totalQuantity - ticket.soldQuantity;

      if (quantity > remaining) {
        throw new ApiError(
          400,
          `Only ${remaining} "${ticket.name}" ticket(s) left`
        );
      }

      if (quantity > ticket.perUserLimit) {
        throw new ApiError(
          400,
          `Max ${ticket.perUserLimit} "${ticket.name}" per person`
        );
      }

      await Ticket.findByIdAndUpdate(
        ticketId,
        { $inc: { soldQuantity: quantity } },
        { session }
      );

      savedTicketLines.push({
        ticket: ticket._id,
        name: ticket.name,
        quantity,
        unitPrice: ticket.price,
      });

      totalAmount += ticket.price * quantity;
      totalQtyBooked += quantity;
    }

    await Event.findByIdAndUpdate(
      eventId,
      { $inc: { soldCount: totalQtyBooked } },
      { session }
    );

    const attendeeInfo = {
      name: (attendee?.attendeeName || attendee?.name || '').trim(),
      email: (attendee?.attendeeEmail || attendee?.email || '')
        .trim()
        .toLowerCase(),
      phone: (attendee?.attendeePhone || attendee?.phone || '').trim(),
    };

    const [created] = await Booking.create(
      [
        {
          user: req.user.id,
          event: eventId,
          tickets: savedTicketLines,
          totalAmount,
          status: 'pending',
          attendeeInfo,
          selectedSeats,
        },
      ],
      { session }
    );

    booking = created;

    await session.commitTransaction();
    session.endSession();

    const io = req.app.get('io');

    if (io) {
      for (const line of savedTicketLines) {
        const ticket = await Ticket.findById(line.ticket).lean();

        io.to(`event:${eventId}`).emit('ticketUpdate', {
          eventId,
          ticketTypeId: line.ticket,
          soldQuantity: ticket.soldQuantity,
        });
      }
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }

  if (totalAmount === 0) {
    booking.status = 'confirmed';
    await booking.save();

    setImmediate(async () => {
      try {
        const { generateTicket } = require('../services/qrService');
        const { sendBookingConfirmation } = require('../services/emailService');

        const [userDoc, eventDoc] = await Promise.all([
          User.findById(req.user.id).lean(),
          Event.findById(eventId).lean(),
        ]);

        if (!userDoc || !eventDoc) return;

        const issuedTickets = [];

        for (const line of savedTicketLines) {
          const lineTierName = line.name || 'General';

          for (let i = 0; i < line.quantity; i++) {
            const seatNumber = booking.selectedSeats?.[issuedTickets.length] || null;

            const { ticketCode, qrToken, qrImage } = await generateTicket(
              {
                eventId,
                userId: req.user.id,
                tierName: lineTierName,
              },
              eventDoc
            );

            await IssuedTicket.create({
              booking: booking._id,
              event: eventId,
              user: req.user.id,
              ticketCode,
              qrToken,
              qrImage,
              tierName: lineTierName,
              seatNumber,
              paymentStatus: 'completed',
            });

            issuedTickets.push({
              ticketCode,
              qrImage,
              tierName: lineTierName,
              seatNumber,
            });

            console.log(
              `✅ Free QR ticket issued: ${ticketCode} (${lineTierName})`
            );
          }
        }

        if (issuedTickets.length > 0) {
          await Booking.findByIdAndUpdate(booking._id, {
            qrCode: issuedTickets[0].qrImage,
          });
        }

        await sendBookingConfirmation({
          user: {
            name: userDoc.name,
            email: userDoc.email,
          },
          event: eventDoc,
          tickets: issuedTickets,
          totalAmount: 0,
          selectedSeats: booking.selectedSeats || [],
        });

        console.log(
          `✅ ${issuedTickets.length} Free QR tickets issued & email sent`
        );
      } catch (e) {
        console.error('⚠️  Free booking QR error:', e.message);
      }
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          isFree: true,
          bookingId: booking._id,
          bookingRef: booking.bookingRef,
          amount: 0,
        },
        'Free booking confirmed'
      )
    );
  }

  let razorpayOrder;

  try {
    const rz = getRazorpay();

    razorpayOrder = await rz.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: booking.bookingRef,
      notes: {
        bookingId: booking._id.toString(),
        userId: req.user.id,
      },
    });
  } catch (rzErr) {
    console.error('❌ Razorpay order creation failed:', rzErr.message || rzErr);
    await rollbackBooking(booking._id, savedTicketLines);
    throw new ApiError(502, 'Payment gateway error — please try again shortly');
  }

  const payment = await Payment.create({
    booking: booking._id,
    user: req.user.id,
    razorpayOrderId: razorpayOrder.id,
    amount: totalAmount,
    currency: 'INR',
    status: 'pending',
  });

  booking.paymentId = payment._id;
  await booking.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id,
        bookingRef: booking.bookingRef,
        paymentId: payment._id,
      },
      'Razorpay order created'
    )
  );
};

const verifyPayment = async (req, res) => {
  const razorpayOrderId =
    req.body.razorpay_order_id || req.body.razorpayOrderId;
  const razorpayPaymentId =
    req.body.razorpay_payment_id || req.body.razorpayPaymentId;
  const razorpaySignature =
    req.body.razorpay_signature || req.body.razorpaySignature;
  const { bookingId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
    throw new ApiError(400, 'Missing required payment verification fields');
  }

  const { keySecret: razorpaySecret } = validateRazorpayConfig();

  const expectedSig = crypto
    .createHmac('sha256', razorpaySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  console.log('🔍 Payment verification debug:', {
    razorpayOrderId,
    razorpayPaymentId,
    expectedSig: expectedSig.substring(0, 20) + '...',
    receivedSig: razorpaySignature?.substring(0, 20) + '...',
    signaturesMatch: expectedSig === razorpaySignature,
  });

  if (expectedSig !== razorpaySignature) {
    console.error('❌ Payment signature mismatch');
    throw new ApiError(400, 'Payment signature verification failed');
  }

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: 'completed',
    },
    { new: true }
  );

  if (!payment) {
    console.error('❌ Payment record not found for order:', razorpayOrderId);
    throw new ApiError(404, 'Payment record not found');
  }

  const booking = await Booking.findById(bookingId).populate(
    'tickets.ticket',
    'name soldQuantity totalQuantity'
  );

  if (!booking) {
    console.error('❌ Booking not found:', bookingId);
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.status === 'confirmed') {
    console.warn('⚠️ Booking already confirmed:', bookingId);
    return res.json(
      new ApiResponse(200, { payment, booking }, 'Booking already confirmed')
    );
  }

  if (booking.status !== 'pending') {
    throw new ApiError(
      400,
      `Cannot confirm booking with status: ${booking.status}`
    );
  }

  booking.status = 'confirmed';
  await booking.save();

  console.log('✅ Booking confirmed:', bookingId);

  const io = req.app.get('io');

  if (io) {
    for (const line of booking.tickets) {
      const ticket = line.ticket || {};

      io.to(`event:${booking.event._id || booking.event}`).emit('ticketUpdate', {
        eventId: booking.event._id || booking.event,
        ticketTypeId: ticket._id || line.ticket,
        soldQuantity: ticket.soldQuantity,
      });
    }
  }

  setImmediate(async () => {
    try {
      const { generateTicket } = require('../services/qrService');
      const { sendBookingConfirmation } = require('../services/emailService');

      const [userDoc, eventDoc] = await Promise.all([
        User.findById(booking.user).lean(),
        Event.findById(booking.event).lean(),
      ]);

      if (!userDoc || !eventDoc) return;

      const issuedTickets = [];

      for (const line of booking.tickets) {
        const lineTierName = line.ticket?.name || line.name || 'General';

        for (let i = 0; i < line.quantity; i++) {
          const seatNumber = booking.selectedSeats?.[issuedTickets.length] || null;

          const { ticketCode, qrToken, qrImage } = await generateTicket(
            {
              eventId: booking.event.toString(),
              userId: booking.user.toString(),
              tierName: lineTierName,
            },
            eventDoc
          );

          await IssuedTicket.create({
            booking: booking._id,
            event: booking.event,
            user: booking.user,
            ticketCode,
            qrToken,
            qrImage,
            tierName: lineTierName,
            seatNumber,
            paymentStatus: 'completed',
          });

          issuedTickets.push({
            ticketCode,
            qrImage,
            tierName: lineTierName,
            seatNumber,
          });

          console.log(`✅ QR ticket issued: ${ticketCode} (${lineTierName})`);
        }
      }

      if (issuedTickets.length > 0) {
        await Booking.findByIdAndUpdate(bookingId, {
          qrCode: issuedTickets[0].qrImage,
        });
      }

      await sendBookingConfirmation({
        user: {
          name: userDoc.name,
          email: userDoc.email,
        },
        event: eventDoc,
        tickets: issuedTickets,
        totalAmount: booking.totalAmount,
        selectedSeats: booking.selectedSeats || [],
      });

      console.log(`✅ ${issuedTickets.length} QR tickets issued & email sent`);
    } catch (e) {
      console.error(
        '⚠️  QR ticket / email error (payment already confirmed):',
        e.message
      );
    }
  });

  res.json(
    new ApiResponse(200, { payment, booking }, 'Payment verified — booking confirmed')
  );
};

const getPaymentById = async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('booking', 'bookingRef status totalAmount')
    .populate('user', 'name email');

  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view this payment');
  }

  res.json(new ApiResponse(200, payment, 'Payment details fetched'));
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentById,
};