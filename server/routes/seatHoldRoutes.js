const express = require('express');

const {
  holdSeats,
  getHeldSeats,
  releaseHold,
} = require('../controllers/seatHoldController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, holdSeats);

router.get('/:eventId', getHeldSeats);

router.delete('/:holdId', protect, releaseHold);

module.exports = router;