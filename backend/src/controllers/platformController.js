const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');
const {
  fetchAllPlatformStats,
  calculateAggregatedStats,
  getProgressHistory
} = require('../services/aggregationService');
const { fetchLeetCodeSkillStats, fetchLeetCodeBadges, getLeetCodeRankTitle } = require('../services/platforms/leetcodeService');
const { fetchCodeforcesTopicStats, getCodeforcesRankInfo } = require('../services/platforms/codeforcesService');

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

/**
 * @desc    Get DSA topic analysis from all platforms
 * @route   GET /api/platforms/topics
 * @access  Private
 */
const getTopicAnalysis = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const topicMap = {};

    // Fetch LeetCode topics
    if (user.platforms?.leetcode) {
      const lcResult = await fetchLeetCodeSkillStats(user.platforms.leetcode);
      if (lcResult.success) {
        lcResult.data.forEach(topic => {
          const name = topic.name;
          if (!topicMap[name]) {
            topicMap[name] = { total: 0, platforms: {} };
          }
          topicMap[name].total += topic.count;
          topicMap[name].platforms.leetcode = topic.count;
        });
      }
    }

    // Fetch Codeforces topics
    if (user.platforms?.codeforces) {
      const cfResult = await fetchCodeforcesTopicStats(user.platforms.codeforces);
      if (cfResult.success) {
        cfResult.data.forEach(topic => {
          const name = topic.name;
          if (!topicMap[name]) {
            topicMap[name] = { total: 0, platforms: {} };
          }
          topicMap[name].total += topic.count;
          topicMap[name].platforms.codeforces = topic.count;
        });
      }
    }

    // Convert to sorted array
    const topics = Object.entries(topicMap)
      .map(([name, data]) => ({
        name,
        total: data.total,
        platforms: data.platforms
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20); // Top 20 topics

    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get badges from all platforms
 * @route   GET /api/platforms/badges
 * @access  Private
 */
const getBadges = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const allBadges = [];

    // Fetch LeetCode badges
    if (user.platforms?.leetcode) {
      const lcResult = await fetchLeetCodeBadges(user.platforms.leetcode);
      if (lcResult.success) {
        lcResult.data.badges.forEach(badge => {
          allBadges.push({
            platform: 'leetcode',
            name: badge.name,
            icon: badge.icon,
            earnedDate: badge.earnedDate
          });
        });
      }
    }

    // Note: Codeforces doesn't have a badge API, but we could add more platforms here

    res.status(200).json({
      success: true,
      data: allBadges
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get achievements/titles from all platforms
 * @route   GET /api/platforms/achievements
 * @access  Private
 */
const getAchievements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const achievements = [];

    // Get LeetCode rank
    const lcStats = await PlatformStats.findOne({
      userId: req.user.id,
      platform: 'leetcode'
    });
    
    if (lcStats?.stats?.rating) {
      const lcRank = getLeetCodeRankTitle(lcStats.stats.rating);
      achievements.push({
        platform: 'leetcode',
        title: lcRank.title,
        color: lcRank.color,
        rating: lcStats.stats.rating,
        icon: '🏆'
      });
    }

    // Get Codeforces rank
    const cfStats = await PlatformStats.findOne({
      userId: req.user.id,
      platform: 'codeforces'
    });
    
    if (cfStats?.stats?.rank) {
      const cfRank = getCodeforcesRankInfo(cfStats.stats.rank, cfStats.stats.rating);
      achievements.push({
        platform: 'codeforces',
        title: cfRank.title,
        color: cfRank.color,
        rating: cfRank.rating,
        maxRating: cfStats.stats.maxRating,
        icon: '⚔️'
      });
    }

    // Get CodeChef stars (if available)
    const ccStats = await PlatformStats.findOne({
      userId: req.user.id,
      platform: 'codechef'
    });
    
    if (ccStats?.stats?.rating) {
      const rating = ccStats.stats.rating;
      let stars = 1;
      let title = '1★';
      let color = '#666666';
      
      if (rating >= 2000) { stars = 7; title = '7★'; color = '#FF7F00'; }
      else if (rating >= 1800) { stars = 6; title = '6★'; color = '#FF7F00'; }
      else if (rating >= 1600) { stars = 5; title = '5★'; color = '#FFDF00'; }
      else if (rating >= 1400) { stars = 4; title = '4★'; color = '#7F00FF'; }
      else if (rating >= 1200) { stars = 3; title = '3★'; color = '#0073E6'; }
      else if (rating >= 1000) { stars = 2; title = '2★'; color = '#1E7D22'; }
      
      achievements.push({
        platform: 'codechef',
        title,
        stars,
        color,
        rating: ccStats.stats.rating,
        icon: '⭐'
      });
    }

    res.status(200).json({
      success: true,
      data: achievements
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
  getProgress,
  getTopicAnalysis,
  getBadges,
  getAchievements
};
