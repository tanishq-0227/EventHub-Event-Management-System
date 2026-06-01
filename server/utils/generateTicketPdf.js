const PDFDocument = require('pdfkit');

const generateTicketPdf = ({
  stream,
  ticket,
  event,
  user,
  qrCodeDataUrl,
}) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
  });

  doc.pipe(stream);

  // Background
  doc.rect(0, 0, 595, 842).fill('#070B1A');

  // Glow
  doc.circle(520, 120, 180).fillOpacity(0.12).fill('#06B6D4');
  doc.fillOpacity(1);

  // Main Card
  doc.roundedRect(40, 80, 515, 640, 28)
    .fillAndStroke('#0F172A', '#1E293B');

  // Header
  doc.fontSize(30)
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .text(event.title || 'EVENT TICKET', 70, 120);

  doc.fontSize(14)
    .fillColor('#67E8F9')
    .font('Helvetica')
    .text('SMART EVENT PASS', 70, 165);

  // Divider
  doc.moveTo(70, 200)
    .lineTo(525, 200)
    .strokeColor('#1E293B')
    .lineWidth(1)
    .stroke();

  // Info Labels
  const labelColor = '#94A3B8';
  const valueColor = '#FFFFFF';

  const drawField = (label, value, y) => {
    doc.fontSize(11)
      .fillColor(labelColor)
      .font('Helvetica')
      .text(label.toUpperCase(), 70, y);

    doc.fontSize(18)
      .fillColor(valueColor)
      .font('Helvetica-Bold')
      .text(value || '-', 70, y + 18);
  };

  drawField('Attendee', user.name, 230);

  drawField(
    'Date',
    new Date(event.startDate).toLocaleString('en-IN'),
    300
  );

  drawField(
    'Venue',
    `${event.venue?.name || ''}, ${event.venue?.city || ''}`,
    370
  );

  drawField(
    'Seat',
    ticket.seatNumber || 'General Entry',
    440
  );

  drawField(
    'Booking Ref',
    ticket.bookingRef || 'N/A',
    510
  );

  // QR Box
  doc.roundedRect(320, 260, 170, 170, 22)
    .fill('#FFFFFF');

  // QR
  if (qrCodeDataUrl) {
    const base64Data = qrCodeDataUrl.replace(
      /^data:image\/png;base64,/,
      ''
    );

    const imgBuffer = Buffer.from(base64Data, 'base64');

    doc.image(imgBuffer, 340, 280, {
      width: 130,
      height: 130,
    });
  }

  doc.fontSize(10)
    .fillColor('#CBD5E1')
    .font('Helvetica')
    .text(
      'Scan this QR at venue entry',
      330,
      450,
      { width: 150, align: 'center' }
    );

  // Footer
  doc.moveTo(70, 620)
    .lineTo(525, 620)
    .strokeColor('#1E293B')
    .lineWidth(1)
    .stroke();

  doc.fontSize(12)
    .fillColor('#94A3B8')
    .text(
      'Powered by EventHub Smart Events',
      70,
      650
    );

  doc.fontSize(10)
    .fillColor('#64748B')
    .text(
      'This ticket is digitally generated and valid for one entry only.',
      70,
      675,
      { width: 400 }
    );

  doc.end();
};

module.exports = generateTicketPdf;