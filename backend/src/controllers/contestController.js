const Contest = require('../models/Contest');
const ContestReminder = require('../models/ContestReminder');
const User = require('../models/User');
const { fetchAllContests, getUpcomingContests } = require('../services/contestService');

/**
 * @desc    Get all upcoming contests
 * @route   GET /api/contests
 * @access  Public
 */
const getContests = async (req, res, next) => {
  try {
    const { platform = 'all', limit = 50 } = req.query;
    
    // Try to get from database first
    let contests = await getUpcomingContests(platform, parseInt(limit));
    
    // If no contests in DB or it's been a while, fetch fresh data
    if (contests.length === 0) {
      await fetchAllContests();
      contests = await getUpcomingContests(platform, parseInt(limit));
    }

    res.status(200).json({
      success: true,
      data: contests,
      count: contests.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh contests from all platforms
 * @route   POST /api/contests/refresh
 * @access  Private
 */
const refreshContests = async (req, res, next) => {
  try {
    const contests = await fetchAllContests();
    
    res.status(200).json({
      success: true,
      message: 'Contests refreshed successfully',
      data: {
        total: contests.length,
        platforms: {
          codeforces: contests.filter(c => c.platform === 'codeforces').length,
          leetcode: contests.filter(c => c.platform === 'leetcode').length,
          codechef: contests.filter(c => c.platform === 'codechef').length,
          atcoder: contests.filter(c => c.platform === 'atcoder').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set reminder for a contest
 * @route   POST /api/contests/:contestId/reminder
 * @access  Private
 */
const setReminder = async (req, res, next) => {
  try {
    const { contestId } = req.params;
    const userId = req.user.id;

    // Get contest details
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    // Check if contest hasn't started yet
    if (new Date(contest.startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set reminder for past or ongoing contests'
      });
    }

    // Get user email
    const user = await User.findById(userId);
    if (!user || !user.email) {
      return res.status(400).json({
        success: false,
        message: 'User email not found'
      });
    }

    // Calculate reminder time (16 hours before contest)
    const reminderTime = new Date(contest.startTime.getTime() - 16 * 60 * 60 * 1000);
    
    // If reminder time is in the past, send immediately when possible
    const effectiveReminderTime = reminderTime < new Date() 
      ? new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      : reminderTime;

    // Check if reminder already exists
    const existingReminder = await ContestReminder.findOne({
      userId,
      contestId: contest._id
    });

    if (existingReminder) {
      return res.status(400).json({
        success: false,
        message: 'Reminder already set for this contest'
      });
    }

    // Create reminder
    const reminder = await ContestReminder.create({
      userId,
      contestId: contest._id,
      email: user.email,
      reminderTime: effectiveReminderTime,
      contestDetails: {
        name: contest.name,
        platform: contest.platform,
        url: contest.url,
        startTime: contest.startTime,
        duration: contest.duration
      }
    });

    res.status(201).json({
      success: true,
      message: 'Reminder set successfully',
      data: {
        reminderId: reminder._id,
        contestName: contest.name,
        reminderTime: effectiveReminderTime,
        email: user.email
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Reminder already set for this contest'
      });
    }
    next(error);
  }
};

/**
 * @desc    Remove reminder for a contest
 * @route   DELETE /api/contests/:contestId/reminder
 * @access  Private
 */
const removeReminder = async (req, res, next) => {
  try {
    const { contestId } = req.params;
    const userId = req.user.id;

    const reminder = await ContestReminder.findOneAndDelete({
      userId,
      contestId
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reminder removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's reminders
 * @route   GET /api/contests/reminders
 * @access  Private
 */
const getUserReminders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const reminders = await ContestReminder.find({
      userId,
      reminderSent: false,
      reminderTime: { $gt: new Date() }
    }).populate('contestId');

    res.status(200).json({
      success: true,
      data: reminders,
      count: reminders.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get contests for calendar view (grouped by date)
 * @route   GET /api/contests/calendar
 * @access  Public
 */
const getContestsCalendar = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const targetMonth = parseInt(month) || new Date().getMonth();
    const targetYear = parseInt(year) || new Date().getFullYear();

    // Get first and last day of month
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const contests = await Contest.find({
      startTime: { $gte: startDate, $lte: endDate }
    }).sort({ startTime: 1 });

    // Group by date
    const calendarData = {};
    contests.forEach(contest => {
      const dateKey = contest.startTime.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push({
        _id: contest._id,
        name: contest.name,
        platform: contest.platform,
        startTime: contest.startTime,
        duration: contest.duration,
        url: contest.url
      });
    });

    res.status(200).json({
      success: true,
      data: calendarData,
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContests,
  refreshContests,
  setReminder,
  removeReminder,
  getUserReminders,
  getContestsCalendar
};
