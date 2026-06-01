const IssuedTicket = require('../models/IssuedTicket');
const generateTicketPdf = require('../utils/generateTicketPdf');
const ApiError = require('../utils/ApiError');

const downloadTicketPdf = async (req, res) => {
  const { ticketId } = req.params;

  const ticket = await IssuedTicket.findById(ticketId)
    .populate('event')
    .populate('user')
    .populate('booking', 'bookingRef')
    .lean();

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  if (
    ticket.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'Not authorized to access this ticket');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=ticket-${ticket.ticketCode}.pdf`
  );

  generateTicketPdf({
    stream: res,
    ticket: {
      ...ticket,
      bookingRef: ticket.booking?.bookingRef,
    },
    event: ticket.event,
    user: ticket.user,
    qrCodeDataUrl: ticket.qrImage,
  });
};

module.exports = {
  downloadTicketPdf,
};