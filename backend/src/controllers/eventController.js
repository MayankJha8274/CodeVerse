const SocietyEvent = require('../models/SocietyEvent');
const SocietyMember = require('../models/SocietyMember');
const SocietyStreak = require('../models/SocietyStreak');
const ActivityLog = require('../models/ActivityLog');
const Society = require('../models/Society');

// @desc    Get events for a society
// @route   GET /api/societies/:societyId/events
// @access  Private (member)
const getEvents = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = { society: req.params.societyId };

    if (status === 'upcoming') query.startTime = { $gt: new Date() };
    else if (status === 'past') query.endTime = { $lt: new Date() };
    else if (status === 'ongoing') {
      const now = new Date();
      query.startTime = { $lte: now };
      query.endTime = { $gte: now };
    }
    if (type) query.eventType = type;

    // Don't show drafts to non-admins
    const { ROLE_HIERARCHY } = require('../middleware/societyAuth');
    if (ROLE_HIERARCHY.indexOf(req.membership.role) < ROLE_HIERARCHY.indexOf('moderator')) {
      query.status = 'published';
    }

    const total = await SocietyEvent.countDocuments(query);
    const events = await SocietyEvent.find(query)
      .populate('createdBy', 'username fullName avatar')
      .sort({ startTime: status === 'past' ? -1 : 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    // Add user RSVP status
    const enriched = events.map(evt => {
      const userRsvp = evt.rsvps?.find(r => r.user?.toString() === req.user.id);
      return { ...evt, userRsvpStatus: userRsvp?.status || null };
    });

    res.status(200).json({
      success: true,
      data: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/societies/:societyId/events/:eventId
// @access  Private (member)
const getEventById = async (req, res, next) => {
  try {
    const event = await SocietyEvent.findOne({
      _id: req.params.eventId,
      society: req.params.societyId
    })
      .populate('createdBy', 'username fullName avatar')
      .populate('rsvps.user', 'username fullName avatar')
      .populate('attendees.user', 'username fullName avatar')
      .populate('feedback.user', 'username fullName avatar');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an event
// @route   POST /api/societies/:societyId/events
// @access  Private (moderator+)
const createEvent = async (req, res, next) => {
  try {
    const { title, description, startTime, endTime, mode, location, meetingLink, eventType, maxParticipants, tags, status, bannerImage } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Title, start time, and end time are required' });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const event = await SocietyEvent.create({
      society: req.params.societyId,
      title,
      description: description || '',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      mode: mode || 'online',
      location: location || '',
      meetingLink: meetingLink || '',
      eventType: eventType || 'meetup',
      maxParticipants: maxParticipants || null,
      tags: tags || [],
      status: status || 'published',
      bannerImage: bannerImage || '',
      createdBy: req.user.id
    });

    await Society.findByIdAndUpdate(req.params.societyId, {
      $inc: { 'stats.totalEvents': 1 }
    });

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'event_created',
      targetType: 'event',
      targetId: event._id
    });

    res.status(201).json({ success: true, message: 'Event created', data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event
// @route   PUT /api/societies/:societyId/events/:eventId
// @access  Private (moderator+)
const updateEvent = async (req, res, next) => {
  try {
    const event = await SocietyEvent.findOneAndUpdate(
      { _id: req.params.eventId, society: req.params.societyId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'event_updated',
      targetType: 'event',
      targetId: event._id
    });

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an event
// @route   POST /api/societies/:societyId/events/:eventId/cancel
// @access  Private (admin+)
const cancelEvent = async (req, res, next) => {
  try {
    const event = await SocietyEvent.findOneAndUpdate(
      { _id: req.params.eventId, society: req.params.societyId },
      { status: 'cancelled' },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'event_cancelled',
      targetType: 'event',
      targetId: event._id
    });

    res.status(200).json({ success: true, message: 'Event cancelled' });
  } catch (error) {
    next(error);
  }
};

// @desc    RSVP to an event
// @route   POST /api/societies/:societyId/events/:eventId/rsvp
// @access  Private (member)
const rsvpEvent = async (req, res, next) => {
  try {
    const { status } = req.body; // going, maybe, not_going
    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid RSVP status' });
    }

    const event = await SocietyEvent.findOne({
      _id: req.params.eventId,
      society: req.params.societyId
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check max participants
    if (status === 'going' && event.maxParticipants) {
      const goingCount = event.rsvps.filter(r => r.status === 'going').length;
      if (goingCount >= event.maxParticipants) {
        return res.status(400).json({ success: false, message: 'Event is full' });
      }
    }

    const existingIdx = event.rsvps.findIndex(r => r.user.toString() === req.user.id);
    if (existingIdx > -1) {
      event.rsvps[existingIdx].status = status;
    } else {
      event.rsvps.push({ user: req.user.id, status });
    }

    await event.save();

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'event_rsvp',
      targetType: 'event',
      targetId: event._id,
      details: { status }
    });

    res.status(200).json({ success: true, message: `RSVP: ${status}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Check in to event (attendance)
// @route   POST /api/societies/:societyId/events/:eventId/checkin
// @access  Private (member)
const checkInEvent = async (req, res, next) => {
  try {
    const event = await SocietyEvent.findOne({
      _id: req.params.eventId,
      society: req.params.societyId
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const alreadyCheckedIn = event.attendees.find(a => a.user.toString() === req.user.id);
    if (alreadyCheckedIn) {
      return res.status(400).json({ success: false, message: 'Already checked in' });
    }

    event.attendees.push({ user: req.user.id, checkedInAt: new Date() });
    await event.save();

    // Update member stats
    await SocietyMember.findOneAndUpdate(
      { society: req.params.societyId, user: req.user.id },
      { $inc: { 'gamification.eventsAttended': 1 } }
    );

    // Record streak
    const streak = await SocietyStreak.findOne({ user: req.user.id, society: req.params.societyId });
    if (streak) await streak.recordActivity('event_attended');

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'event_attended',
      targetType: 'event',
      targetId: event._id
    });

    res.status(200).json({ success: true, message: 'Checked in successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit event feedback
// @route   POST /api/societies/:societyId/events/:eventId/feedback
// @access  Private (member)
const submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    }

    const event = await SocietyEvent.findOne({
      _id: req.params.eventId,
      society: req.params.societyId
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const existingIdx = event.feedback.findIndex(f => f.user.toString() === req.user.id);
    if (existingIdx > -1) {
      event.feedback[existingIdx] = { user: req.user.id, rating, comment: comment || '' };
    } else {
      event.feedback.push({ user: req.user.id, rating, comment: comment || '' });
    }

    await event.save();

    res.status(200).json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  rsvpEvent,
  checkInEvent,
  submitFeedback
};
