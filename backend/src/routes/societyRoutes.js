const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireSocietyMember, requirePermission, requireMinRole, requireOwner } = require('../middleware/societyAuth');

// Controllers
const society = require('../controllers/societyController');
const chat = require('../controllers/chatController');
const event = require('../controllers/eventController');
const announcement = require('../controllers/announcementController');
const leaderboard = require('../controllers/societyLeaderboardController');
const analytics = require('../controllers/societyAnalyticsController');

// All routes require authentication
router.use(protect);

// ============ SOCIETY CRUD ============
router.post('/', society.createSociety);
router.get('/', society.exploreSocieties);
router.get('/my', society.getMySocieties);
router.post('/join', society.joinSociety);

// Routes that need societyId
router.get('/:societyId', society.getSocietyById);
router.put('/:societyId', requireSocietyMember, requirePermission('edit_society'), society.updateSociety);
router.delete('/:societyId', requireSocietyMember, requireOwner, society.deleteSociety);
router.post('/:societyId/leave', requireSocietyMember, society.leaveSociety);
router.post('/:societyId/regenerate-invite', requireSocietyMember, requirePermission('regenerate_invite'), society.regenerateInviteCode);

// ============ MEMBERS ============
router.get('/:societyId/members', requireSocietyMember, requirePermission('view_members'), society.getMembers);
router.delete('/:societyId/members/:userId', requireSocietyMember, requirePermission('kick_member'), society.kickMember);
router.post('/:societyId/members/:userId/ban', requireSocietyMember, requirePermission('ban_member'), society.banMember);
router.put('/:societyId/members/:userId/role', requireSocietyMember, requirePermission('change_role'), society.changeMemberRole);
router.post('/:societyId/members/:userId/mute', requireSocietyMember, requirePermission('mute_member'), society.toggleMuteMember);

// ============ CHANNELS ============
router.get('/:societyId/channels', requireSocietyMember, requirePermission('view_channels'), chat.getChannels);
router.post('/:societyId/channels', requireSocietyMember, requirePermission('manage_channels'), chat.createChannel);
router.put('/:societyId/channels/:channelId', requireSocietyMember, requirePermission('manage_channels'), chat.updateChannel);
router.delete('/:societyId/channels/:channelId', requireSocietyMember, requireMinRole('society_admin'), chat.deleteChannel);

// ============ MESSAGES ============
router.get('/:societyId/channels/:channelId/messages', requireSocietyMember, requirePermission('view_channels'), chat.getMessages);
router.post('/:societyId/channels/:channelId/messages', requireSocietyMember, requirePermission('send_message'), chat.sendMessage);
router.get('/:societyId/channels/:channelId/messages/:messageId/thread', requireSocietyMember, requirePermission('view_channels'), chat.getThread);
router.delete('/:societyId/channels/:channelId/messages/:messageId', requireSocietyMember, chat.deleteMessage);
router.post('/:societyId/channels/:channelId/messages/:messageId/pin', requireSocietyMember, requirePermission('pin_message'), chat.togglePinMessage);
router.post('/:societyId/channels/:channelId/messages/:messageId/react', requireSocietyMember, requirePermission('react_message'), chat.reactToMessage);
router.post('/:societyId/channels/:channelId/messages/:messageId/report', requireSocietyMember, requirePermission('report_message'), chat.reportMessage);
router.post('/:societyId/channels/:channelId/messages/:messageId/solution', requireSocietyMember, requireMinRole('moderator'), chat.markSolution);

// ============ EVENTS ============
router.get('/:societyId/events', requireSocietyMember, requirePermission('view_events'), event.getEvents);
router.get('/:societyId/events/:eventId', requireSocietyMember, requirePermission('view_events'), event.getEventById);
router.post('/:societyId/events', requireSocietyMember, requirePermission('create_event'), event.createEvent);
router.put('/:societyId/events/:eventId', requireSocietyMember, requirePermission('edit_event'), event.updateEvent);
router.post('/:societyId/events/:eventId/cancel', requireSocietyMember, requirePermission('cancel_event'), event.cancelEvent);
router.post('/:societyId/events/:eventId/rsvp', requireSocietyMember, requirePermission('rsvp_event'), event.rsvpEvent);
router.post('/:societyId/events/:eventId/checkin', requireSocietyMember, event.checkInEvent);
router.post('/:societyId/events/:eventId/feedback', requireSocietyMember, event.submitFeedback);

// ============ ANNOUNCEMENTS ============
router.get('/:societyId/announcements', requireSocietyMember, requirePermission('view_announcements'), announcement.getAnnouncements);
router.post('/:societyId/announcements', requireSocietyMember, requirePermission('create_announcement'), announcement.createAnnouncement);
router.put('/:societyId/announcements/:announcementId', requireSocietyMember, requirePermission('create_announcement'), announcement.updateAnnouncement);
router.delete('/:societyId/announcements/:announcementId', requireSocietyMember, requireMinRole('society_admin'), announcement.deleteAnnouncement);
router.post('/:societyId/announcements/:announcementId/read', requireSocietyMember, announcement.markAsRead);
router.post('/:societyId/announcements/:announcementId/comment', requireSocietyMember, requirePermission('send_message'), announcement.commentOnAnnouncement);
router.post('/:societyId/announcements/:announcementId/react', requireSocietyMember, requirePermission('react_message'), announcement.reactToAnnouncement);

// ============ LEADERBOARD & GAMIFICATION ============
router.get('/:societyId/leaderboard', requireSocietyMember, requirePermission('view_leaderboard'), leaderboard.getLeaderboard);
router.get('/:societyId/leaderboard/history', requireSocietyMember, requirePermission('view_leaderboard'), leaderboard.getLeaderboardHistory);
router.get('/:societyId/badges', requireSocietyMember, leaderboard.getUserBadges);
router.get('/:societyId/streak', requireSocietyMember, leaderboard.getUserStreak);

// ============ ANALYTICS & ADMIN ============
router.get('/:societyId/analytics', requireSocietyMember, requirePermission('view_analytics'), analytics.getSocietyAnalytics);
router.get('/:societyId/activity-log', requireSocietyMember, requirePermission('view_activity_log'), analytics.getActivityLog);

module.exports = router;
