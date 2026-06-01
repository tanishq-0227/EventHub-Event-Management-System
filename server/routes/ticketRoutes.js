const express = require('express');

const {
  createTicket,
  getTicketsByEvent,
  updateTicket,
  deleteTicket,
  validateTicket,
  getFraudReport,
} = require('../controllers/ticketController');

const {
  downloadTicketPdf,
} = require('../controllers/ticketPdfController');

const {
  verifyToken,
  requireRole,
} = require('../middleware/authMiddleware');

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────

// Anyone can browse ticket types for an event
router.get(
  '/event/:eventId',
  getTicketsByEvent
);

// ── Organizer / Admin ────────────────────────────────────────────────

router.post(
  '/',
  verifyToken,
  requireRole('organizer', 'admin'),
  createTicket
);

router.patch(
  '/:id',
  verifyToken,
  requireRole('organizer', 'admin'),
  updateTicket
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('organizer', 'admin'),
  deleteTicket
);

// ── QR Validation ────────────────────────────────────────────────────

router.post(
  '/validate',
  verifyToken,
  requireRole('organizer', 'admin'),
  validateTicket
);

// ── Fraud Detection Report ───────────────────────────────────────────

router.get(
  '/fraud-report',
  verifyToken,
  requireRole('admin'),
  getFraudReport
);

// ── PDF Ticket Download ──────────────────────────────────────────────

router.get(
  '/:ticketId/pdf',
  verifyToken,
  downloadTicketPdf
);

module.exports = router;