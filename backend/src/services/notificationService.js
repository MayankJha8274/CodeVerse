const NotificationLog = require('../models/NotificationLog');

/**
 * Creates an in-app notification for a user about a contest.
 * @param {object} user - The user object.
 * @param {object} contest - The contest object.
 * @returns {Promise<object>} The created notification log document.
 */
async function createInAppNotification(user, contest) {
  try {
    const notification = await NotificationLog.create({
      userId: user._id,
      contestId: contest._id,
      type: 'contest-reminder',
      message: `🔥 ${contest.name} starts soon!`,
    });
    return notification;
  } catch (error) {
    // If a duplicate key error occurs, it means the notification already exists.
    // We can safely ignore this and return null.
    if (error.code === 11000) {
      console.log(`Notification already exists for user ${user._id} and contest ${contest._id}. Skipping.`);
      return null;
    }
    // For other errors, re-throw them.
    console.error(`Error creating notification for user ${user._id}:`, error);
    throw error;
  }
}

module.exports = {
  createInAppNotification,
};