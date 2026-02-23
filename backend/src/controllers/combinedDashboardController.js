const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');
const DailyProgress = require('../models/DailyProgress');

/**
 * Combined Dashboard Controller
 * Returns ALL dashboard data in a SINGLE API call for maximum performance.
 * 
 * KEY DESIGN PRINCIPLE: This controller ONLY reads from the database.
 * It NEVER makes external API calls (LeetCode, GitHub, etc.).
 * External API calls happen ONLY during sync (cron every 15 min or manual).
 * This ensures the dashboard loads in <500ms instead of 10-30+ seconds.
 */

/**
 * Helper: Get LOCAL date string 'YYYY-MM-DD'
 */
const toLocalDateStr = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

/**
 * Build contribution calendar from stored platform data only (NO external API calls)
 */
function buildCalendarFromStoredData(platformStats) {
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startDate.setDate(startDate.getDate() - 365);

  const contributionMap = {};

  const addContribution = (dateKey, count, type) => {
    if (!dateKey || count <= 0) return;
    if (!contributionMap[dateKey]) {
      contributionMap[dateKey] = { date: dateKey, count: 0, problems: 0, commits: 0, level: 0 };
    }
    contributionMap[dateKey].count += count;
    if (type === 'problems') contributionMap[dateKey].problems += count;
    else if (type === 'commits') contributionMap[dateKey].commits += count;
  };

  const mergeCalendarArray = (calendarArray, type) => {
    if (!Array.isArray(calendarArray)) return;
    calendarArray.forEach(day => {
      const dateKey = (day.date || '').split('T')[0];
      if (dateKey && day.count > 0) {
        const dayDate = new Date(dateKey + 'T00:00:00');
        if (dayDate >= startDate && dayDate <= endDate) {
          addContribution(dateKey, day.count, type);
        }
      }
    });
  };

  // Merge all stored calendar data from each platform
  platformStats.forEach(ps => {
    if (!ps.stats) return;
    if (ps.platform === 'github') {
      mergeCalendarArray(ps.stats.contributionCalendar, 'commits');
    } else {
      mergeCalendarArray(ps.stats.submissionCalendar, 'problems');
    }
  });

  // Fill all 366 days
  const calendar = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const key = toLocalDateStr(cursor);
    calendar.push(contributionMap[key] || { date: key, count: 0, problems: 0, commits: 0, level: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Assign levels based on percentiles
  const counts = calendar.map(d => d.count).filter(c => c > 0).sort((a, b) => a - b);
  if (counts.length > 0) {
    const p25 = counts[Math.floor(counts.length * 0.25)] || 1;
    const p50 = counts[Math.floor(counts.length * 0.50)] || 2;
    const p75 = counts[Math.floor(counts.length * 0.75)] || 4;
    calendar.forEach(day => {
      if (day.count === 0) day.level = 0;
      else if (day.count <= p25) day.level = 1;
      else if (day.count <= p50) day.level = 2;
      else if (day.count <= p75) day.level = 3;
      else day.level = 4;
    });
  }

  // Calculate stats
  const totalContributions = calendar.reduce((s, d) => s + d.count, 0);
  const totalProblems = calendar.reduce((s, d) => s + (d.problems || 0), 0);
  const totalCommits = calendar.reduce((s, d) => s + (d.commits || 0), 0);
  const activeDays = calendar.filter(d => d.count > 0).length;

  // Current streak
  let currentStreak = 0;
  let idx = calendar.length - 1;
  const todayEntry = calendar[idx];
  if (!todayEntry || todayEntry.count === 0) idx--; // skip today if no activity yet
  while (idx >= 0 && calendar[idx].count > 0) { currentStreak++; idx--; }

  // Longest streak
  let longestStreak = 0, temp = 0;
  calendar.forEach(d => {
    if (d.count > 0) { temp++; longestStreak = Math.max(longestStreak, temp); }
    else temp = 0;
  });

  return {
    calendar,
    stats: { totalContributions, totalProblems, totalCommits, currentStreak, longestStreak, activeDays }
  };
}

/**
 * @desc    Get all dashboard data in one call
 * @route   GET /api/dashboard/combined
 * @access  Private
 */
exports.getCombinedDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Execute all queries in parallel
    const [user, platformStats, recentProgress, todayProgress] = await Promise.all([
      User.findById(userId).select('-password'),
      PlatformStats.find({
        userId,
        stats: { $exists: true, $ne: null }
      }).lean(),
      DailyProgress.find({
        userId,
        date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
      }).sort({ date: -1 }).limit(90).lean(),
      DailyProgress.findOne({
        userId,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }).lean()
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate totals from platform stats
    let totalProblems = 0;
    let totalCommits = 0;
    let totalContests = 0;
    let avgRating = 0;
    let ratingCount = 0;
    const platforms = {};

    platformStats.forEach(ps => {
      const stats = ps.stats || {};
      const problems = stats.problemsSolved || stats.totalSolved || 0;
      const commits = stats.totalCommits || 0;
      const contests = stats.contestsParticipated || 0;
      const rating = stats.rating || 0;

      totalProblems += problems;
      totalCommits += commits;
      totalContests += contests;
      
      if (rating > 0) {
        avgRating += rating;
        ratingCount++;
      }

      platforms[ps.platform] = {
        problems,
        commits,
        contests,
        rating,
        lastFetched: ps.lastFetched,
        ...stats
      };
    });

    avgRating = ratingCount > 0 ? Math.round(avgRating / ratingCount) : 0;

    // Calculate active days from progress
    const activeDaysCount = recentProgress.filter(p => 
      (p.changes?.problemsDelta > 0 || p.changes?.commitsDelta > 0)
    ).length;

    // Today's activity
    const todayActivity = todayProgress ? {
      problemsSolved: todayProgress.changes?.problemsDelta || 0,
      commits: todayProgress.changes?.commitsDelta || 0
    } : {
      problemsSolved: 0,
      commits: 0
    };

    // Topic analysis - aggregate from cached topics
    const topicMap = {};
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

    const topics = Object.entries(topicMap)
      .map(([name, data]) => ({
        name,
        total: data.total,
        platforms: data.platforms
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    // Badges - collect from cached badges
    const allBadges = [];
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

    // Achievements - calculate from platform stats
    const achievements = calculateAchievements(platformStats);

    // Rating history for charts
    const ratingHistory = recentProgress
      .filter(p => p.aggregatedStats?.averageRating > 0)
      .reverse()
      .map(p => ({
        date: p.date,
        rating: p.aggregatedStats.averageRating
      }));

    // Contribution calendar - built from STORED data only (no external API calls!)
    const contributionCalendar = buildCalendarFromStoredData(platformStats);

    // Send combined response
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          platforms: user.platforms
        },
        totals: {
          problems: totalProblems,
          commits: totalCommits,
          contests: totalContests,
          rating: avgRating,
          platformsConnected: platformStats.length,
          activeDays: activeDaysCount
        },
        platforms,
        today: todayActivity,
        topics,
        badges: allBadges,
        achievements,
        ratingHistory,
        contributionCalendar,
        lastSynced: user.lastSynced
      }
    });
  } catch (error) {
    console.error('Error fetching combined dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

/**
 * Helper function to calculate achievements
 */
function calculateAchievements(platformStats) {
  const achievements = [];
  const platformColors = {
    leetcode: '#FFA116',
    codeforces: '#1F8ACB',
    codechef: '#5B4638',
    codingninjas: '#F96D00',
    geeksforgeeks: '#2F8D46',
    hackerrank: '#1BA759',
    github: '#FFFFFF'
  };

  platformStats.forEach(ps => {
    if (!ps.stats) return;

    const rating = ps.stats.rating || 0;
    if (rating <= 0) return;

    const platformData = {
      platform: ps.platform,
      rating: rating,
      color: platformColors[ps.platform] || '#FFFFFF',
      title: null
    };

    if (ps.stats.maxRating) {
      platformData.maxRating = ps.stats.maxRating;
    }

    // Generate title based on platform
    if (ps.platform === 'codeforces') {
      if (rating >= 2400) platformData.title = 'International Grandmaster';
      else if (rating >= 2200) platformData.title = 'Grandmaster';
      else if (rating >= 2100) platformData.title = 'International Master';
      else if (rating >= 1900) platformData.title = 'Master';
      else if (rating >= 1600) platformData.title = 'Candidate Master';
      else if (rating >= 1400) platformData.title = 'Expert';
      else if (rating >= 1200) platformData.title = 'Specialist';
      else platformData.title = 'Pupil';
    } else if (ps.platform === 'codechef') {
      if (rating >= 2500) platformData.title = '7★';
      else if (rating >= 2200) platformData.title = '6★';
      else if (rating >= 1800) platformData.title = '5★';
      else if (rating >= 1600) platformData.title = '4★';
      else if (rating >= 1400) platformData.title = '3★';
      else if (rating >= 1200) platformData.title = '2★';
      else platformData.title = '1★';
    } else if (ps.platform === 'leetcode') {
      const ranking = ps.stats.ranking || 0;
      if (ranking > 0 && ranking <= 5000) platformData.title = 'Guardian';
      else if (ranking <= 25000) platformData.title = 'Knight';
      else platformData.title = 'Contestant';
    }

    achievements.push(platformData);
  });

  return achievements;
}
