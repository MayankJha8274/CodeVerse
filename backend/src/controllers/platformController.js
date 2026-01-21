const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');
const {
  fetchAllPlatformStats,
  calculateAggregatedStats,
  getProgressHistory
} = require('../services/aggregationService');

/**
 * @desc    Connect/Update platform username
 * @route   PUT /api/platforms/connect
 * @access  Private
 */
const connectPlatform = async (req, res, next) => {
  try {
    const { platform, username } = req.body;

    if (!platform || !username) {
      return res.status(400).json({
        success: false,
        message: 'Platform and username are required'
      });
    }

    const validPlatforms = ['leetcode', 'github', 'codeforces', 'codechef', 'geeksforgeeks', 'hackerrank', 'codingninjas'];
    
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform name'
      });
    }

    // Update user's platforms
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { [`platforms.${platform}`]: username },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `${platform} connected successfully`,
      data: {
        platforms: user.platforms
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Disconnect platform
 * @route   DELETE /api/platforms/disconnect/:platform
 * @access  Private
 */
const disconnectPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;

    // Remove platform username
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { [`platforms.${platform}`]: null },
      { new: true }
    );

    // Optionally delete stored stats
    await PlatformStats.deleteMany({
      userId: req.user.id,
      platform
    });

    res.status(200).json({
      success: true,
      message: `${platform} disconnected successfully`,
      data: {
        platforms: user.platforms
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sync all platforms (fetch latest stats)
 * @route   POST /api/platforms/sync
 * @access  Private
 */
const syncAllPlatforms = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Fetch stats from all connected platforms
    const results = await fetchAllPlatformStats(user);

    // Calculate aggregated stats
    const aggregated = await calculateAggregatedStats(user._id);

    // Update user's last synced time
    user.lastSynced = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Platforms synced successfully',
      data: {
        results,
        aggregated,
        lastSynced: user.lastSynced
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's aggregated stats
 * @route   GET /api/platforms/stats
 * @access  Private
 */
const getAggregatedStats = async (req, res, next) => {
  try {
    const aggregated = await calculateAggregatedStats(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        stats: aggregated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's stats for specific platform
 * @route   GET /api/platforms/stats/:platform
 * @access  Private
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const { platform } = req.params;

    const stats = await PlatformStats.findOne({
      userId: req.user.id,
      platform
    });

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: `No stats found for ${platform}. Try syncing first.`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        platform: stats.platform,
        stats: stats.stats,
        lastFetched: stats.lastFetched,
        fetchStatus: stats.fetchStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's progress history
 * @route   GET /api/platforms/progress
 * @access  Private
 */
const getProgress = async (req, res, next) => {
  try {
    const { period = 'daily', limit = 30 } = req.query;

    const progress = await getProgressHistory(
      req.user.id,
      period,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        period,
        records: progress.length,
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  connectPlatform,
  disconnectPlatform,
  syncAllPlatforms,
  getAggregatedStats,
  getPlatformStats,
  getProgress
};
