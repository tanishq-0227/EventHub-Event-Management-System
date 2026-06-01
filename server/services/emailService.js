const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendBookingConfirmation = async (params) => {
  let to, holderName, ticketCodes, eventTitle, eventDate, venueName, totalAmount;

  if (params.user && params.event && (params.ticket || params.tickets)) {
    to = params.user.email;
    holderName = params.user.name || 'Attendee';

    ticketCodes = Array.isArray(params.tickets)
      ? params.tickets.map((t, index) => ({
          ticketCode: t.ticketCode || '',
          tierName: t.tierName || 'General',
          qrImage: t.qrImage || null,
          seatNumber: t.seatNumber || params.selectedSeats?.[index] || null,
        }))
      : [{
          ticketCode: params.ticket?.ticketCode || '',
          tierName: params.ticket?.tierName || 'General',
          qrImage: params.qrImage || null,
          seatNumber: params.selectedSeats?.[0] || null,
        }];

    eventTitle = params.event.title || 'Event';
    eventDate = params.event.startDate ? new Date(params.event.startDate).toDateString() : 'TBD';
    venueName = params.event.venue
      ? `${params.event.venue.name || ''}, ${params.event.venue.city || ''}`.trim().replace(/^,|,$/g, '')
      : 'TBD';
    totalAmount = params.totalAmount ?? 0;
  } else {
    to = params.to;
    holderName = params.attendeeName || 'Attendee';
    ticketCodes = [{
      ticketCode: params.bookingRef || '',
      tierName: 'General',
      qrImage: params.qrCode || params.qrImage || null,
      seatNumber: params.selectedSeats?.[0] || null,
    }];
    eventTitle = params.eventTitle || 'Event';
    eventDate = params.eventDate || 'TBD';
    venueName = params.venueName || 'TBD';
    totalAmount = params.totalAmount ?? 0;
  }

  const qrSectionsHtml = ticketCodes.map((t, index) => {
    const cidId = `entry_qr_code_${index}`;
    return `
      <div style="text-align:center;margin:20px 0;padding:20px;background:#fff;border-radius:8px;border:1px solid #e2e8f0">
        <h3 style="color:#0A1931;margin:0 0 4px">Ticket ${index + 1} — ${t.tierName}</h3>
        ${t.seatNumber ? `<p style="color:#0891b2;font-weight:bold;font-size:14px;margin:0 0 8px">Seat: ${t.seatNumber}</p>` : ''}
        <p style="color:#64748b;font-size:13px;margin:0 0 8px;font-family:monospace">${t.ticketCode}</p>
        <p style="color:#dc2626;font-weight:bold;font-size:12px;margin:0 0 12px">
          ⚠️ Valid for ONE entry only. Do not share this QR code.
        </p>
        ${t.qrImage ? `<img src="cid:${cidId}" alt="Entry QR Code" style="width:200px;height:200px;border:3px solid #0A1931;border-radius:8px;display:block;margin:0 auto"/>` : ''}
      </div>`;
  }).join('');

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:32px auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden">
    <div style="background:linear-gradient(135deg,#0A1931,#1a1a4e);padding:32px 24px;text-align:center">
      <h1 style="color:#00B4D8;margin:0;font-size:26px">🎉 EventHub</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0">Booking Confirmed!</p>
    </div>

    <div style="padding:32px 24px;background:#f9f9f9">
      <p style="font-size:16px">Hi <strong>${holderName}</strong>,</p>
      <p>Your tickets have been confirmed. Show the QR codes below at the venue entrance.</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
        <tr style="background:#e8f4fd"><td style="padding:10px 12px;font-weight:bold;color:#333;width:35%">Event</td><td style="padding:10px 12px;color:#333">${eventTitle}</td></tr>
        <tr><td style="padding:10px 12px;font-weight:bold;color:#333">Date</td><td style="padding:10px 12px;color:#333">${eventDate}</td></tr>
        <tr style="background:#e8f4fd"><td style="padding:10px 12px;font-weight:bold;color:#333">Venue</td><td style="padding:10px 12px;color:#333">${venueName}</td></tr>
        <tr><td style="padding:10px 12px;font-weight:bold;color:#333">Total Tickets</td><td style="padding:10px 12px;color:#333">${ticketCodes.length}</td></tr>
        ${totalAmount > 0 ? `<tr style="background:#e8f4fd"><td style="padding:10px 12px;font-weight:bold;color:#333">Amount Paid</td><td style="padding:10px 12px;color:#333">₹${Number(totalAmount).toLocaleString('en-IN')}</td></tr>` : ''}
      </table>

      <h3 style="color:#0A1931;text-align:center;margin:24px 0 8px">Your Entry QR Codes</h3>
      ${qrSectionsHtml}
    </div>

    <div style="background:#0A1931;padding:14px;text-align:center">
      <p style="color:#64748b;margin:0;font-size:12px">Built with ❤️ by Tanishq Vashishtha — EventHub 2026</p>
    </div>
  </div>`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `🎟️ Booking Confirmed — ${eventTitle} (${ticketCodes.length} ticket${ticketCodes.length > 1 ? 's' : ''})`,
    html,
    attachments: [],
  };

  ticketCodes.forEach((t, index) => {
    if (!t.qrImage) return;
    const base64Data = t.qrImage.includes('base64,')
      ? t.qrImage.split('base64,')[1]
      : t.qrImage;

    mailOptions.attachments.push({
      filename: `ticket-${index + 1}-qr.png`,
      content: base64Data,
      encoding: 'base64',
      contentType: 'image/png',
      cid: `entry_qr_code_${index}`,
    });
  });

  await transporter.sendMail(mailOptions);
};

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

const sendCancellationRequestToAdmin = async () => {};
const sendCancellationApprovedEmail = async () => {};
const sendCancellationRejectedEmail = async () => {};

module.exports = {
  sendBookingConfirmation,
  sendEmail,
  sendCancellationRequestToAdmin,
  sendCancellationApprovedEmail,
  sendCancellationRejectedEmail,
};