const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const IssuedTicket = require('../models/IssuedTicket');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const parseBool = (value) => value === true || value === 'true';

const parseSectionNames = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((s) => String(s).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const buildSeatingConfig = (body, fallback = {}) => {
  return {
    rows: Number(body.seatRows) || fallback?.rows || 0,
    seatsPerRow: Number(body.seatsPerRow) || fallback?.seatsPerRow || 0,
    sectionNames:
      body.sectionNames !== undefined
        ? parseSectionNames(body.sectionNames)
        : fallback?.sectionNames || [],
  };
};

// ── POST /api/events ──────────────────────────────────────────────────────────
const createEvent = async (req, res) => {
  console.log('📝 CREATE EVENT - Body:', req.body);
  console.log('📸 CREATE EVENT - File:', req.file);

  const body = {
    ...req.body,
    organizer: req.user.id,
    status: req.body.status || 'published',

    venue: {
      name: req.body.venueName || req.body.venue,
      address: req.body.address || 'TBD',
      city: req.body.city || 'TBD',
      country: req.body.country || 'India',
    },

    totalCapacity: Number(req.body.totalCapacity) || 100,

    isFeatured: parseBool(req.body.isFeatured),

    venueLayoutType: req.body.venueLayoutType || 'standing',

    enableSeatSelection: parseBool(req.body.enableSeatSelection),

    seatingConfig: buildSeatingConfig(req.body),
  };

  if (req.file?.path) {
    body.bannerImage = req.file.path;
    console.log('✅ Image uploaded to Cloudinary:', req.file.path);
  } else {
    console.log('ℹ️  No image file received (req.file is', req.file, ')');
  }

  const event = await Event.create(body);

  res.status(201).json(
    new ApiResponse(201, event, 'Event created successfully')
  );
};

// ── GET /api/events ───────────────────────────────────────────────────────────
const getEvents = async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    city,
    status,
    startDate,
    endDate,
    search,
    sortBy = 'startDate',
    order = 'asc',
    organizer,
  } = req.query;

  const filter = {};

  if (organizer === 'me') {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    filter.organizer = req.user.id;
  } else {
    filter.status = status || 'published';
  }

  if (category) filter.category = category;
  if (city) filter['venue.city'] = { $regex: city, $options: 'i' };
  if (search) filter.title = { $regex: search, $options: 'i' };

  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('organizer', 'name email avatar')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Event.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(
      200,
      {
        events,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      'Events fetched successfully'
    )
  );
};

// ── GET /api/events/featured ──────────────────────────────────────────────────
const getFeaturedEvents = async (_req, res) => {
  const events = await Event.find({
    isFeatured: true,
    status: 'published',
  })
    .populate('organizer', 'name email avatar')
    .sort({ startDate: 1 })
    .limit(8)
    .lean();

  const eventsWithTickets = await Promise.all(
    events.map(async (event) => {
      const tickets = await Ticket.find({ event: event._id })
        .select(
          'name price totalQuantity soldQuantity sectionName venueLayoutType allowSeatSelection'
        )
        .lean();

      return {
        ...event,
        ticketTypes: tickets,
      };
    })
  );

  res.json(
    new ApiResponse(200, eventsWithTickets, 'Featured events fetched')
  );
};

// ── GET /api/events/:id ───────────────────────────────────────────────────────
const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'name email avatar');

  if (!event) throw new ApiError(404, 'Event not found');

  const ticketTypes = await Ticket.find({ event: req.params.id }).lean();

  const eventData = {
    ...event.toObject(),
    ticketTypes,
  };

  res.json(
    new ApiResponse(200, eventData, 'Event fetched successfully')
  );
};

const getBookedSeats = async (req, res) => {
  const issuedTickets = await IssuedTicket.find({
    event: req.params.id,
    paymentStatus: 'completed',
    seatNumber: { $ne: null },
  })
    .select('seatNumber')
    .lean();

  const bookedSeats = issuedTickets
    .map((t) => t.seatNumber)
    .filter(Boolean);

  res.json(
    new ApiResponse(
      200,
      bookedSeats,
      'Booked seats fetched successfully'
    )
  );
};

// ── PUT /api/events/:id ───────────────────────────────────────────────────────
const updateEvent = async (req, res) => {
  console.log('📝 UPDATE EVENT - Body:', req.body);
  console.log('📸 UPDATE EVENT - File:', req.file);

  const event = await Event.findById(req.params.id);

  if (!event) throw new ApiError(404, 'Event not found');

  if (
    event.organizer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to update this event');
  }

  const updates = {
    ...req.body,

    venueLayoutType:
      req.body.venueLayoutType || event.venueLayoutType || 'standing',

    enableSeatSelection:
      req.body.enableSeatSelection !== undefined
        ? parseBool(req.body.enableSeatSelection)
        : event.enableSeatSelection,

    seatingConfig: buildSeatingConfig(
      req.body,
      event.seatingConfig || {}
    ),
  };

  if (req.file?.path) {
    updates.bannerImage = req.file.path;
  }

  if (req.body.venue || req.body.venueName || req.body.city) {
    updates.venue = {
      name: req.body.venueName || req.body.venue || event.venue.name,
      address: req.body.address || event.venue.address || 'TBD',
      city: req.body.city || event.venue.city || 'TBD',
      country: req.body.country || event.venue.country || 'India',
    };
  }

  if (req.body.totalCapacity) {
    updates.totalCapacity = Number(req.body.totalCapacity);
  }

  if (req.body.isFeatured !== undefined) {
    updates.isFeatured = parseBool(req.body.isFeatured);
  }

  const updated = await Event.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('organizer', 'name email avatar');

  res.json(
    new ApiResponse(200, updated, 'Event updated successfully')
  );
};

// ── DELETE /api/events/:id ────────────────────────────────────────────────────
const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) throw new ApiError(404, 'Event not found');

  if (
    event.organizer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to delete this event');
  }

  await event.deleteOne();

  res.json(
    new ApiResponse(200, null, 'Event deleted successfully')
  );
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getFeaturedEvents,
  getBookedSeats,
};