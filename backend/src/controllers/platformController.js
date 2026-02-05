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
    const { platform } = req.body;

    let results;
    
    // If specific platform requested, sync only that one
    if (platform) {
      const username = user.platforms?.[platform];
      if (!username) {
        return res.status(400).json({
          success: false,
          message: `Platform ${platform} is not linked`
        });
      }
      
      // Fetch stats for single platform
      const { fetchPlatformData } = require('../services/aggregationService');
      const result = await fetchPlatformData(platform, username);
      
      // Save to database
      const PlatformStats = require('../models/PlatformStats');
      if (result.success) {
        await PlatformStats.findOneAndUpdate(
          { userId: user._id, platform },
          {
            userId: user._id,
            platform,
            stats: result.stats,
            lastFetched: new Date(),
            fetchStatus: 'success',
            errorMessage: null
          },
          { upsert: true, new: true }
        );
      } else {
        await PlatformStats.findOneAndUpdate(
          { userId: user._id, platform },
          {
            userId: user._id,
            platform,
            lastFetched: new Date(),
            fetchStatus: 'failed',
            errorMessage: result.error
          },
          { upsert: true, new: true }
        );
      }
      
      results = [result];
    } else {
      // Fetch stats from all connected platforms
      results = await fetchAllPlatformStats(user);
    }

    // Calculate aggregated stats
    const aggregated = await calculateAggregatedStats(user._id);

    // Update user's last synced time
    user.lastSynced = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: platform ? `${platform} synced successfully` : 'Platforms synced successfully',
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

    // Also fetch individual platform stats for the dashboard
    const platformStatsData = await PlatformStats.find({
      userId: req.user.id,
      fetchStatus: 'success'
    });

    // Convert array to object keyed by platform name
    const platformsObject = {};
    platformStatsData.forEach(ps => {
      platformsObject[ps.platform] = ps.stats;
    });

    res.status(200).json({
      success: true,
      data: {
        stats: aggregated,
        ...platformsObject // Spread individual platform stats at root level
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
