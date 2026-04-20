const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');
const { getRedisConnection } = require('../config/redis');
const {
  fetchAllPlatformStats,
  calculateAggregatedStats,
  getProgressHistory,
  fetchPlatformData
} = require('../services/aggregationService');
const { fetchLeetCodeSkillStats, fetchLeetCodeBadges, getLeetCodeRankTitle } = require('../services/platforms/leetcodeService');
const { fetchCodeforcesTopicStats, getCodeforcesRankInfo } = require('../services/platforms/codeforcesService');

// Try to load queue (optional - requires Redis)
let addSyncJob, getQueueStats, PRIORITY, PLATFORM_COOLDOWNS;
let queueAvailable = false;
try {
  const syncQueue = require('../queues/syncQueue');
  addSyncJob = syncQueue.addSyncJob;
  getQueueStats = syncQueue.getQueueStats;
  PRIORITY = syncQueue.PRIORITY;
  PLATFORM_COOLDOWNS = syncQueue.PLATFORM_COOLDOWNS;
  queueAvailable = true;
} catch (err) {
  console.warn('⚠️ Queue not available, using direct sync');
  PRIORITY = { HIGH: 1, NORMAL: 5, LOW: 10 };
  PLATFORM_COOLDOWNS = {
    github: 5 * 60 * 1000,
    codeforces: 10 * 60 * 1000,
    leetcode: 15 * 60 * 1000,
    codechef: 15 * 60 * 1000,
    geeksforgeeks: 20 * 60 * 1000,
    hackerrank: 10 * 60 * 1000,
    codingninjas: 20 * 60 * 1000
  };
}

// Try to load logger (optional)
let syncLogger;
try {
  syncLogger = require('../services/loggerService').syncLogger;
} catch (err) {
  // Fallback logger
  syncLogger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  };
}

// Cache threshold (30 minutes)
const CACHE_THRESHOLD = 30 * 60 * 1000;

/**
 * Check if data is fresh enough (cached)
 */
const isDataFresh = (lastSyncedAt) => {
  if (!lastSyncedAt) return false;
  const elapsed = Date.now() - new Date(lastSyncedAt).getTime();
  return elapsed < CACHE_THRESHOLD;
};

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

    // Delete old stats to bypass "Suspicious Zero" worker check on new empty IDs
    await PlatformStats.deleteMany({
      userId: req.user.id,
      platform
    });

    // Invalidate user cache to ensure new data isn't blocked by Redis caches
    const redis = getRedisConnection();
    if (redis) {
      try {
        const keys = await redis.keys(`cache:user:${req.user.id}:*`);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } catch (err) {
        console.warn('Failed to clear user cache:', err.message);
      }
    }

    // Update user's platforms
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        [`platforms.${platform}`]: username,
        lastActivityAt: new Date()
      },
      { new: true }
    );

    // Queue a sync job if queue is available
    if (queueAvailable && addSyncJob) {
      try {
        await addSyncJob(req.user.id, {
          platform,
          priority: PRIORITY.HIGH,
          triggeredBy: 'platform_connect'
        });
      } catch (err) {
        console.warn('Queue not available, sync manually');
      }
    }

    res.status(200).json({
      success: true,
      message: `${platform} connected successfully.`,
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
      {
        [`platforms.${platform}`]: null,
        [`platformSyncTimes.${platform}`]: null
      },
      { new: true }
    );

    // Optionally delete stored stats
    await PlatformStats.deleteMany({
      userId: req.user.id,
      platform
    });

    // Invalidate user cache
    const redis = getRedisConnection();
    if (redis) {
      try {
        const keys = await redis.keys(`cache:user:${req.user.id}:*`);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } catch (err) {
        console.warn('Failed to clear user cache:', err.message);
      }
    }

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
 * @desc    Sync all platforms (queue-based or direct)
 * @route   POST /api/platforms/sync
 * @access  Private
 */
const syncAllPlatforms = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const { platform, hardReset, forceSync } = req.body;

    // Check if already syncing
    if (user.syncStatus === 'syncing' && !forceSync) {
      return res.status(429).json({
        success: false,
        message: 'Sync already in progress. Please wait.',
        data: {
          syncStatus: user.syncStatus,
          lastSyncedAt: user.lastSyncedAt
        }
      });
    }

    // Check cache (if not force sync and not hard reset)
    if (!forceSync && !hardReset && isDataFresh(user.lastSyncedAt)) {
      const aggregated = await calculateAggregatedStats(user._id);

      return res.status(200).json({
        success: true,
        message: 'Data is fresh (cached). No sync needed.',
        cached: true,
        data: {
          aggregated,
          lastSynced: user.lastSyncedAt,
          nextSyncIn: Math.ceil((CACHE_THRESHOLD - (Date.now() - new Date(user.lastSyncedAt).getTime())) / 1000)
        }
      });
    }

    // Check platform-specific cooldown
    if (platform && !hardReset) {
      const lastPlatformSync = user.platformSyncTimes?.[platform];
      if (lastPlatformSync) {
        const cooldown = PLATFORM_COOLDOWNS[platform] || 10 * 60 * 1000;
        const elapsed = Date.now() - new Date(lastPlatformSync).getTime();

        if (elapsed < cooldown) {
          const remaining = Math.ceil((cooldown - elapsed) / 1000);
          return res.status(429).json({
            success: false,
            message: `${platform} is on cooldown. Try again in ${remaining} seconds.`,
            data: {
              platform,
              cooldownRemaining: remaining
            }
          });
        }
      }
    }

    // If queue is available, use it
    if (queueAvailable && addSyncJob) {
      try {
        // Update user status
        await User.findByIdAndUpdate(req.user.id, {
          syncStatus: 'syncing',
          lastActivityAt: new Date()
        });

        // Queue the sync job with high priority (manual trigger)
        const job = await addSyncJob(req.user.id, {
          platform,
          hardReset: hardReset === true,
          priority: PRIORITY.HIGH,
          triggeredBy: 'manual'
        });

        syncLogger.info('Manual sync requested', {
          userId: req.user.id,
          platform: platform || 'all',
          jobId: job.id
        });

        return res.status(202).json({
          success: true,
          message: platform
            ? `Sync queued for ${platform}`
            : 'Sync queued for all platforms',
          data: {
            jobId: job.id,
            status: 'queued'
          }
        });
      } catch (err) {
        console.warn('Queue failed, falling back to direct sync:', err.message);
      }
    }

    // Direct sync (fallback when queue is not available)
    await User.findByIdAndUpdate(req.user.id, {
      syncStatus: 'syncing'
    });

    // Hard reset if requested
    if (hardReset) {
      await PlatformStats.deleteMany({ userId: user._id });
      const DailyProgress = require('../models/DailyProgress');
      await DailyProgress.deleteMany({ userId: user._id });
    }

    let results;
    if (platform) {
      const username = user.platforms?.[platform];
      if (!username) {
        return res.status(400).json({
          success: false,
          message: `Platform ${platform} is not linked`
        });
      }
      const result = await fetchPlatformData(platform, username);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || `Failed to sync ${platform}`,
          error: result.error || 'Platform data fetch failed'
        });
      }
      
      await PlatformStats.findOneAndUpdate(
        { userId: user._id, platform },
        {
          userId: user._id,
          platform,
          stats: result.stats,
          lastFetched: new Date(),
          fetchStatus: 'success'
        },
        { upsert: true }
      );
      
      results = [result];
    } else {
      results = await fetchAllPlatformStats(user);
    }

    const aggregated = await calculateAggregatedStats(user._id);

    await User.findByIdAndUpdate(req.user.id, {
      lastSynced: new Date(),
      lastSyncedAt: new Date(),
      syncStatus: 'completed'
    });

    res.status(200).json({
      success: true,
      message: platform ? `${platform} synced successfully` : 'Platforms synced successfully',
      data: {
        results,
        aggregated,
        lastSynced: new Date()
      }
    });
  } catch (error) {
    await User.findByIdAndUpdate(req.user.id, {
      syncStatus: 'failed',
      lastSyncError: error.message
    });
    syncLogger.error('Sync request failed', { error: error.message });
    next(error);
  }
};

/**
 * @desc    Get sync status
 * @route   GET /api/platforms/sync/status
 * @access  Private
 */
const getSyncStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('syncStatus lastSyncedAt lastSyncError platformSyncTimes');

    let queueStats = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };

    if (queueAvailable && getQueueStats) {
      try {
        queueStats = await getQueueStats();
      } catch (err) {
        // Queue stats not available
      }
    }

    // Calculate time since last sync
    let timeSinceSync = null;
    if (user.lastSyncedAt) {
      const elapsed = Date.now() - new Date(user.lastSyncedAt).getTime();
      timeSinceSync = {
        seconds: Math.floor(elapsed / 1000),
        minutes: Math.floor(elapsed / 60000),
        hours: Math.floor(elapsed / 3600000)
      };
    }

    // Check if data is cached
    const isCached = isDataFresh(user.lastSyncedAt);

    res.status(200).json({
      success: true,
      data: {
        syncStatus: user.syncStatus || 'idle',
        lastSyncedAt: user.lastSyncedAt,
        lastSyncError: user.lastSyncError,
        timeSinceSync,
        isCached,
        platformSyncTimes: user.platformSyncTimes,
        queue: queueStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's aggregated stats (with caching)
 * @route   GET /api/platforms/stats
 * @access  Private
 */
const getAggregatedStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Return cached data if fresh, otherwise calculate
    const aggregated = await calculateAggregatedStats(req.user.id);

    // Also fetch individual platform stats for the dashboard.
    const platformStatsData = await PlatformStats.find({
      userId: req.user.id,
      stats: { $exists: true, $ne: null }
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
        lastSyncedAt: user.lastSyncedAt,
        syncStatus: user.syncStatus,
        isCached: isDataFresh(user.lastSyncedAt),
        ...platformsObject
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
    const user = await User.findById(req.user.id);

    const stats = await PlatformStats.findOne({
      userId: req.user.id,
      platform
    });

    if (!stats) {
      const username = user.platforms?.[platform];
      if (!username) {
        return res.status(404).json({
          success: false,
          message: `Platform ${platform} is not linked.`
        });
      }
      
      console.warn(`[getPlatformStats] Stats missing for ${platform}. Triggering inline sync...`);
      const result = await fetchPlatformData(platform, username);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || `No stats found for ${platform} and inline fetch failed.`
        });
      }

      const newStats = await PlatformStats.findOneAndUpdate(
        { userId: user._id, platform },
        {
          userId: user._id,
          platform,
          stats: result.stats,
          lastFetched: new Date(),
          fetchStatus: 'success'
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        data: {
          platform: newStats.platform,
          stats: newStats.stats,
          lastFetched: newStats.lastFetched,
          fetchStatus: newStats.fetchStatus,
          isCached: false
        }
      });
    }

    // Check if platform data is fresh
    const lastPlatformSync = user.platformSyncTimes?.[platform];
    const isFresh = lastPlatformSync &&
      (Date.now() - new Date(lastPlatformSync).getTime()) < (PLATFORM_COOLDOWNS[platform] || 600000);

    res.status(200).json({
      success: true,
      data: {
        platform: stats.platform,
        stats: stats.stats,
        lastFetched: stats.lastFetched,
        fetchStatus: stats.fetchStatus,
        isCached: isFresh
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
    // Return cached topics from database instead of fetching from external APIs
    const platformStats = await PlatformStats.find({
      userId: req.user.id,
      'stats.topics': { $exists: true, $ne: [] }
    });

    const topicMap = {};

    // Aggregate topics from all platforms
    platformStats.forEach(ps => {
      if (ps.stats.topics && Array.isArray(ps.stats.topics)) {
        ps.stats.topics.forEach(topic => {
          const name = topic.name;
          if (!topicMap[name]) {
            topicMap[name] = { total: 0, platforms: {} };
          }
          topicMap[name].total += topic.count || 0;
          topicMap[name].platforms[ps.platform] = topic.count || 0;
        });
      }
    });

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
    // Return cached badges from database instead of fetching from external APIs
    const platformStats = await PlatformStats.find({
      userId: req.user.id
    });

    const allBadges = [];

    // Collect badges from all platforms
    platformStats.forEach(ps => {
      if (ps.stats.badges && Array.isArray(ps.stats.badges)) {
        ps.stats.badges.forEach(badge => {
          allBadges.push({
            platform: ps.platform,
            name: badge.name,
            icon: badge.icon,
            earnedDate: badge.earnedDate
          });
        });
      }
    });

    // Generate Codeforces badges based on rating
    const cfStats = platformStats.find(ps => ps.platform === 'codeforces');

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
    const ccStats = platformStats.find(ps => ps.platform === 'codechef');

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

      cnBadges.push(...cnBadges);
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

/**
 * @desc    Get queue statistics (admin)
 * @route   GET /api/platforms/queue/stats
 * @access  Private
 */
const getQueueStatistics = async (req, res, next) => {
  try {
    let stats = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, total: 0 };

    if (queueAvailable && getQueueStats) {
      try {
        stats = await getQueueStats();
      } catch (err) {
        // Queue not available
      }
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  connectPlatform,
  disconnectPlatform,
  syncAllPlatforms,
  getSyncStatus,
  getAggregatedStats,
  getPlatformStats,
  getProgress,
  getTopicAnalysis,
  getBadges,
  getAchievements,
  getQueueStatistics
};
