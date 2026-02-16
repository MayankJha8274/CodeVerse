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
    const { platform, hardReset } = req.body;

    // Hard reset: Clear all stored data and rebuild from scratch
    if (hardReset === true || req.query.hardReset === 'true') {
      console.log(`🔥 Hard reset requested for user ${user.username} - clearing all cached data`);
      
      // Delete all platform stats
      await PlatformStats.deleteMany({ userId: user._id });
      
      // Delete all daily progress records (this clears corrupt streak data)
      const DailyProgress = require('../models/DailyProgress');
      await DailyProgress.deleteMany({ userId: user._id });
      
      console.log('✅ All cached data cleared - will rebuild from scratch');
    }
    // Normal sync: just fetch fresh data without wiping anything

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

    // Generate Codeforces badges based on rating
    const cfStats = await PlatformStats.findOne({
      userId: req.user.id,
      platform: 'codeforces'
    });
    
    if (cfStats?.stats?.rating && cfStats.stats.rating > 0) {
      const rating = cfStats.stats.rating;
      const cfBadges = [];
      
      if (rating >= 1200) {
        cfBadges.push({
          platform: 'codeforces',
          name: 'Specialist',
          icon: '🎖️',
          earnedDate: new Date()
        });
      }
      if (rating >= 1400) {
        cfBadges.push({
          platform: 'codeforces',
          name: 'Expert',
          icon: '⭐',
          earnedDate: new Date()
        });
      }
      if (rating >= 1600) {
        cfBadges.push({
          platform: 'codeforces',
          name: 'Candidate Master',
          icon: '👑',
          earnedDate: new Date()
        });
      }
      if (rating >= 1900) {
        cfBadges.push({
          platform: 'codeforces',
          name: 'Master',
          icon: '💎',
          earnedDate: new Date()
        });
      }
      if (rating >= 2200) {
        cfBadges.push({
          platform: 'codeforces',
          name: 'International Master',
          icon: '🌟',
          earnedDate: new Date()
        });
      }
      
      allBadges.push(...cfBadges);
    }

    // Generate CodeChef badges based on rating
    const ccStats = await PlatformStats.findOne({
      userId: req.user.id,
      platform: 'codechef'
    });
    
    if (ccStats?.stats?.rating && ccStats.stats.rating > 0) {
      const rating = ccStats.stats.rating;
      const ccBadges = [];
      
      if (rating >= 1000) {
        ccBadges.push({
          platform: 'codechef',
          name: '2⭐ Chef',
          icon: '🌶️',
          earnedDate: new Date()
        });
      }
      if (rating >= 1200) {
        ccBadges.push({
          platform: 'codechef',
          name: '3⭐ Chef',
          icon: '🌶️🌶️',
          earnedDate: new Date()
        });
      }
      if (rating >= 1400) {
        ccBadges.push({
          platform: 'codechef',
          name: '4⭐ Chef',
          icon: '🏆',
          earnedDate: new Date()
        });
      }
      if (rating >= 1600) {
        ccBadges.push({
          platform: 'codechef',
          name: '5⭐ Chef',
          icon: '💫',
          earnedDate: new Date()
        });
      }
      
      allBadges.push(...ccBadges);
    }

    // Generate Coding Ninjas badges based on rating
    const cnStats = await PlatformStats.findOne({
      userId: req.user.id,
      platform: 'codingninjas'
    });
    
    if (cnStats?.stats?.rating && cnStats.stats.rating > 0) {
      const rating = cnStats.stats.rating;
      const cnBadges = [];
      
      if (rating >= 800) {
        cnBadges.push({
          platform: 'codingninjas',
          name: 'Rising Coder',
          icon: '📈',
          earnedDate: new Date()
        });
      }
      if (rating >= 1200) {
        cnBadges.push({
          platform: 'codingninjas',
          name: 'Intermediate Master',
          icon: '⚡',
          earnedDate: new Date()
        });
      }
      if (rating >= 1600) {
        cnBadges.push({
          platform: 'codingninjas',
          name: 'Ace Programmer',
          icon: '🎯',
          earnedDate: new Date()
        });
      }
      
      allBadges.push(...cnBadges);
    }

    // Generate GeeksforGeeks badges based on rating
    const gfgStats = await PlatformStats.findOne({
      userId: req.user.id,
      platform: 'geeksforgeeks'
    });
    
    if (gfgStats?.stats?.rating && gfgStats.stats.rating > 0) {
      const rating = gfgStats.stats.rating;
      const gfgBadges = [];
      
      if (rating >= 100) {
        gfgBadges.push({
          platform: 'geeksforgeeks',
          name: 'Learner',
          icon: '📚',
          earnedDate: new Date()
        });
      }
      if (rating >= 300) {
        gfgBadges.push({
          platform: 'geeksforgeeks',
          name: 'Problem Solver',
          icon: '🧩',
          earnedDate: new Date()
        });
      }
      if (rating >= 500) {
        gfgBadges.push({
          platform: 'geeksforgeeks',
          name: 'Expert',
          icon: '🎓',
          earnedDate: new Date()
        });
      }
      
      allBadges.push(...gfgBadges);
    }

    // Generate HackerRank badges based on rating
    const hrStats = await PlatformStats.findOne({
      userId: req.user.id,
      platform: 'hackerrank'
    });
    
    if (hrStats?.stats?.rating && hrStats.stats.rating > 0) {
      const rating = hrStats.stats.rating;
      const hrBadges = [];
      
      if (rating >= 50) {
        hrBadges.push({
          platform: 'hackerrank',
          name: 'Problem Solver',
          icon: '✅',
          earnedDate: new Date()
        });
      }
      if (rating >= 150) {
        hrBadges.push({
          platform: 'hackerrank',
          name: 'Advanced Problem Solver',
          icon: '🚀',
          earnedDate: new Date()
        });
      }
      if (rating >= 300) {
        hrBadges.push({
          platform: 'hackerrank',
          name: 'Expert Coder',
          icon: '💻',
          earnedDate: new Date()
        });
      }
      
      allBadges.push(...hrBadges);
    }

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

    // Fetch ALL platform stats for this user
    const allStats = await PlatformStats.find({
      userId: req.user.id
    });

    // Define platform color mapping
    const platformColors = {
      leetcode: '#FFA116',
      codeforces: '#1F8ACB',
      codechef: '#5B4638',
      codingninjas: '#F96D00',
      geeksforgeeks: '#2F8D46',
      hackerrank: '#1BA759',
      github: '#FFFFFF'
    };

    // Process each platform that user has stats for
    for (const stats of allStats) {
      if (!stats.stats) continue;

      // Only include platforms where rating > 0 (user attended at least 1 contest)
      const rating = stats.stats.rating || 0;
      if (rating <= 0) continue;

      const platformData = {
        platform: stats.platform,
        rating: rating,
        color: platformColors[stats.platform] || '#FFFFFF',
        title: null
      };

      // Add maxRating if available (for all platforms that have it)
      if (stats.stats.maxRating) {
        platformData.maxRating = stats.stats.maxRating;
      }

      // Generate title/rank based on platform
      if (stats.platform === 'leetcode' && stats.stats.rating) {
        const lcRank = getLeetCodeRankTitle(stats.stats.rating);
        platformData.title = lcRank.title;
      } else if (stats.platform === 'codeforces' && stats.stats.ranking) {
        const cfRank = getCodeforcesRankInfo(stats.stats.ranking, stats.stats.rating);
        platformData.title = cfRank.title;
      } else if (stats.platform === 'codechef' && stats.stats.rating) {
        const rating = stats.stats.rating;
        if (rating >= 2000) platformData.title = '7★';
        else if (rating >= 1800) platformData.title = '6★';
        else if (rating >= 1600) platformData.title = '5★';
        else if (rating >= 1400) platformData.title = '4★';
        else if (rating >= 1200) platformData.title = '3★';
        else if (rating >= 1000) platformData.title = '2★';
        else platformData.title = '1★';
      } else if (stats.platform === 'codingninjas' && stats.stats.rating) {
        const rating = stats.stats.rating;
        if (rating >= 1600) platformData.title = 'Ace';
        else if (rating >= 1200) platformData.title = 'Expert';
        else if (rating >= 800) platformData.title = 'Intermediate';
        else platformData.title = 'Beginner';
      } else if (stats.platform === 'geeksforgeeks' && stats.stats.rating) {
        platformData.title = `Level ${Math.floor(stats.stats.rating / 100) || 1}`;
      } else if (stats.platform === 'hackerrank' && stats.stats.rating) {
        platformData.title = `${Math.floor(stats.stats.rating / 100)} Stars`;
      }

      achievements.push(platformData);
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
