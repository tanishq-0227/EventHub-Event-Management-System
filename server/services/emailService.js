const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendBookingConfirmation = async (params) => {
  let to, holderName, ticketCodes, tierName, eventTitle, eventDate, venueName, totalAmount, qrImages, eventId;

  if (params.user && params.event && params.ticket) {
    to          = params.user.email;
    holderName  = params.user.name || 'Attendee';
    // Support both single ticketCode string and array of tickets
    if (params.tickets && Array.isArray(params.tickets)) {
      ticketCodes = params.tickets;
    } else {
      ticketCodes = [{ ticketCode: params.ticket.ticketCode || '', tierName: params.ticket.tierName || 'General', qrImage: params.qrImage || null }];
    }
    tierName    = params.ticket.tierName   || 'General';
    eventTitle  = params.event.title       || 'Event';
    eventDate   = params.event.startDate
      ? new Date(params.event.startDate).toDateString()
      : 'TBD';
    venueName   = params.event.venue
      ? `${params.event.venue.name || ''}, ${params.event.venue.city || ''}`.trim().replace(/^,|,$/g, '')
      : 'TBD';
    totalAmount = params.totalAmount ?? 0;
    eventId     = params.event._id || params.event.id || '';
  } else {
    to          = params.to;
    holderName  = params.attendeeName  || 'Attendee';
    ticketCodes = [{ ticketCode: params.bookingRef || '', tierName: 'General', qrImage: params.qrCode || params.qrImage || null }];
    tierName    = 'General';
    eventTitle  = params.eventTitle    || 'Event';
    eventDate   = params.eventDate     || 'TBD';
    venueName   = params.venueName     || 'TBD';
    totalAmount = params.totalAmount   ?? 0;
    eventId     = params.eventId       || '';
  }

  // Build QR sections HTML
  const qrSectionsHtml = ticketCodes.map((t, index) => {
    const cidId = `entry_qr_code_${index}`;
    return `
    <div style="text-align:center;margin:20px 0;padding:20px;background:#fff;border-radius:8px;border:1px solid #e2e8f0">
      <h3 style="color:#0A1931;margin:0 0 4px">Ticket ${index + 1} — ${t.tierName}</h3>
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;font-family:monospace">${t.ticketCode}</p>
      <p style="color:#dc2626;font-weight:bold;font-size:12px;margin:0 0 12px">
        ⚠️ Valid for ONE entry only. Do not share this QR code.
      </p>
      ${t.qrImage ? `<img src="cid:${cidId}" alt="Entry QR Code"
           style="width:200px;height:200px;border:3px solid #0A1931;border-radius:8px;display:block;margin:0 auto"/>` : ''}
    </div>`;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Booking Confirmed — ${eventTitle}</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f4f6fb;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden">

    <div style="background:linear-gradient(135deg,#0A1931,#1a1a4e);padding:32px 24px;text-align:center">
      <h1 style="color:#00B4D8;margin:0;font-size:26px">🎉 EventHub</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0">Booking Confirmed!</p>
    </div>

    <div style="padding:32px 24px;background:#f9f9f9">
      <p style="font-size:16px">Hi <strong>${holderName}</strong>,</p>
      <p>Your tickets have been confirmed. Show the QR codes below at the venue entrance.</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
        <tr style="background:#e8f4fd">
          <td style="padding:10px 12px;font-weight:bold;color:#333;width:35%">Event</td>
          <td style="padding:10px 12px;color:#333">${eventTitle}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:bold;color:#333">Date</td>
          <td style="padding:10px 12px;color:#333">${eventDate}</td>
        </tr>
        <tr style="background:#e8f4fd">
          <td style="padding:10px 12px;font-weight:bold;color:#333">Venue</td>
          <td style="padding:10px 12px;color:#333">${venueName}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:bold;color:#333">Total Tickets</td>
          <td style="padding:10px 12px;color:#333">${ticketCodes.length}</td>
        </tr>
        ${totalAmount > 0 ? `
        <tr style="background:#e8f4fd">
          <td style="padding:10px 12px;font-weight:bold;color:#333">Amount Paid</td>
          <td style="padding:10px 12px;color:#333">₹${Number(totalAmount).toLocaleString('en-IN')}</td>
        </tr>` : ''}
      </table>

      <h3 style="color:#0A1931;text-align:center;margin:24px 0 8px">Your Entry QR Codes</h3>
      ${qrSectionsHtml}
    </div>

    <div style="background:#0A1931;padding:14px;text-align:center">
      <p style="color:#64748b;margin:0;font-size:12px">
        Built with ❤️ by Tanishq Sharma — EventHub 2026
      </p>
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from:    process.env.EMAIL_FROM,
    to,
    subject: `🎟️ Booking Confirmed — ${eventTitle} (${ticketCodes.length} ticket${ticketCodes.length > 1 ? 's' : ''})`,
    html,
    attachments: [],
  };

  // Attach each QR as CID
  ticketCodes.forEach((t, index) => {
    if (t.qrImage) {
      const base64Data = t.qrImage.includes('base64,')
        ? t.qrImage.split('base64,')[1]
        : t.qrImage;

      mailOptions.attachments.push({
        filename:    `ticket-${index + 1}-qr.png`,
        content:     base64Data,
        encoding:    'base64',
        contentType: 'image/png',
        cid:         `entry_qr_code_${index}`,
      });
    }
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

const sendCancellationRequestToAdmin = async ({ booking, user, event, refundAmount, refundPercent, hoursUntilEvent }) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      adminEmail,
    subject: `Cancellation Request — ${event.title} — ${user.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0A1931;padding:24px;text-align:center">
          <h1 style="color:#00B4D8;margin:0">EventHub Admin</h1>
          <p style="color:#94a3b8;margin:8px 0 0">Cancellation Request Received</p>
        </div>
        <div style="padding:24px;background:#f9f9f9">
          <h2 style="color:#dc2626">New Cancellation Request</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#e8f4fd"><td style="padding:10px;font-weight:bold">User</td><td style="padding:10px">${user.name} (${user.email})</td></tr>
            <tr><td style="padding:10px;font-weight:bold">Event</td><td style="padding:10px">${event.title}</td></tr>
            <tr style="background:#e8f4fd"><td style="padding:10px;font-weight:bold">Booking Ref</td><td style="padding:10px;font-family:monospace">${booking.bookingRef}</td></tr>
            <tr><td style="padding:10px;font-weight:bold">Booking Amount</td><td style="padding:10px">₹${booking.totalAmount}</td></tr>
            <tr style="background:#e8f4fd"><td style="padding:10px;font-weight:bold">Refund Eligible</td><td style="padding:10px;color:#16a34a;font-weight:bold">₹${refundAmount} (${refundPercent}%)</td></tr>
            <tr><td style="padding:10px;font-weight:bold">Hours Until Event</td><td style="padding:10px">${hoursUntilEvent} hours</td></tr>
            <tr style="background:#e8f4fd"><td style="padding:10px;font-weight:bold">Reason</td><td style="padding:10px">${booking.cancellationReason}</td></tr>
            <tr><td style="padding:10px;font-weight:bold">Requested At</td><td style="padding:10px">${new Date().toLocaleString('en-IN')}</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0">
            <a href="${process.env.CLIENT_URL}/admin/cancellations"
              style="background:#16a34a;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block">
              ✓ Review Request
            </a>
          </div>
        </div>
        <div style="background:#0A1931;padding:12px;text-align:center">
          <p style="color:#94a3b8;margin:0;font-size:12px">EventHub Admin Panel — Tanishq Sharma</p>
        </div>
      </div>
    `,
  });
};

const sendCancellationApprovedEmail = async ({ user, event, booking, refundAmount, refundPercent }) => {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      user.email,
    subject: `Cancellation Approved — Refund of ₹${refundAmount} Initiated — ${event.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0A1931;padding:24px;text-align:center">
          <h1 style="color:#00B4D8;margin:0">EventHub</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9">
          <div style="background:#dcfce7;border:2px solid #16a34a;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
            <h2 style="color:#16a34a;margin:0">✓ Cancellation Approved</h2>
            <p style="color:#15803d;margin:8px 0 0">Your refund has been initiated</p>
          </div>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your cancellation for <strong>${event.title}</strong> has been approved.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#e8f4fd"><td style="padding:10px;font-weight:bold">Booking Ref</td><td style="padding:10px;font-family:monospace">${booking.bookingRef}</td></tr>
            <tr><td style="padding:10px;font-weight:bold">Refund Amount</td><td style="padding:10px;color:#16a34a;font-weight:bold">₹${refundAmount} (${refundPercent}%)</td></tr>
            <tr style="background:#e8f4fd"><td style="padding:10px;font-weight:bold">Refund Status</td><td style="padding:10px;color:#16a34a">Processing (5-7 business days)</td></tr>
          </table>
        </div>
        <div style="background:#0A1931;padding:12px;text-align:center">
          <p style="color:#94a3b8;margin:0;font-size:12px">Built with love by Tanishq Sharma — EventHub 2026</p>
        </div>
      </div>
    `,
  });
};

const sendCancellationRejectedEmail = async ({ user, event, booking, reason }) => {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      user.email,
    subject: `Cancellation Request Rejected — ${event.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0A1931;padding:24px;text-align:center">
          <h1 style="color:#00B4D8;margin:0">EventHub</h1>
        </div>
        <div style="padding:24px;background:#f9f9f9">
          <div style="background:#fee2e2;border:2px solid #dc2626;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
            <h2 style="color:#dc2626;margin:0">✗ Cancellation Request Rejected</h2>
          </div>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your cancellation for <strong>${event.title}</strong> has been rejected.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#e8f4fd"><td style="padding:10px;font-weight:bold">Booking Ref</td><td style="padding:10px;font-family:monospace">${booking.bookingRef}</td></tr>
            <tr><td style="padding:10px;font-weight:bold">Reason</td><td style="padding:10px;color:#dc2626">${reason}</td></tr>
          </table>
          <p>Your booking remains <strong>confirmed</strong>. See you at the event!</p>
        </div>
        <div style="background:#0A1931;padding:12px;text-align:center">
          <p style="color:#94a3b8;margin:0;font-size:12px">Built with love by Tanishq Sharma — EventHub 2026</p>
        </div>
      </div>
    `,
  });
};

module.exports = {
  sendBookingConfirmation,
  sendEmail,
  sendCancellationRequestToAdmin,
  sendCancellationApprovedEmail,
  sendCancellationRejectedEmail,
};