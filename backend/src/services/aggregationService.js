const { fetchLeetCodeStats } = require('./platforms/leetcodeService');
const { fetchLeetCodeSubmissionCalendar } = require('./platforms/leetcodeService');
const { fetchGitHubStats } = require('./platforms/githubService');
const { fetchCodeforcesStats } = require('./platforms/codeforcesService');
const { fetchCodeChefStats } = require('./platforms/codechefService');
const { fetchGeeksforGeeksStats } = require('./platforms/geeksforgeeksService');
const { fetchHackerRankStats } = require('./platforms/hackerrankService');
const { fetchCodingNinjasStats } = require('./platforms/codingNinjasService');
const PlatformStats = require('../models/PlatformStats');
const DailyProgress = require('../models/DailyProgress');
const User = require('../models/User');

/**
 * Helper: Get LOCAL date string 'YYYY-MM-DD' from a Date object.
 * NEVER use toISOString().split('T')[0] — that gives UTC date which
 * can be off by 1 day for users in UTC+ timezones (e.g. IST = UTC+5:30).
 */
const toLocalDateStr = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

/**
 * Platform Aggregation Service
 * Combines data from all platforms and calculates overall statistics
 */

const platformFetchers = {
  leetcode: fetchLeetCodeStats,
  github: fetchGitHubStats,
  codeforces: fetchCodeforcesStats,
  codechef: fetchCodeChefStats,
  geeksforgeeks: fetchGeeksforGeeksStats,
  hackerrank: fetchHackerRankStats,
  codingninjas: fetchCodingNinjasStats
};

/**
 * Fetch stats for a single platform
 * @param {string} platform - Platform name
 * @param {string} username - Username for that platform
 * @param {string} token - Optional auth token (for GitHub)
 * @returns {Object} Platform stats
 */
const fetchPlatformData = async (platform, username, token = null) => {
  const fetcher = platformFetchers[platform];
  if (!fetcher) {
    return { success: false, error: 'Unsupported platform' };
  }

  // Use GitHub token from environment if not provided
  if (platform === 'github') {
    const githubToken = token || process.env.GITHUB_TOKEN;
    return await fetcher(username, githubToken);
  }
  
  return await fetcher(username);
};

/**
 * Fetch and save stats for all connected platforms of a user
 * @param {Object} user - User object with platforms
 * @returns {Array} Results from all platforms
 */
const fetchAllPlatformStats = async (user) => {
  const results = [];
  const promises = [];

  for (const [platform, username] of Object.entries(user.platforms)) {
    if (username) {
      promises.push(
        fetchPlatformData(platform, username, process.env.GITHUB_TOKEN)
          .then(async (result) => {
            // Save to database
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
            
            results.push(result);
            return result;
          })
          .catch(error => {
            results.push({
              success: false,
              platform,
              error: error.message
            });
          })
      );
    }
  }

  await Promise.allSettled(promises);
  return results;
};

/**
 * Calculate aggregated statistics from all platforms
 * @param {string} userId - User ID
 * @returns {Object} Aggregated stats
 */
const calculateAggregatedStats = async (userId) => {
  const platformStats = await PlatformStats.find({
    userId,
    fetchStatus: 'success'
  });

  const aggregated = {
    totalProblemsSolved: 0,
    totalCommits: 0,
    totalContests: 0,
    averageRating: 0,
    platformsActive: 0,
    breakdown: []
  };

  let totalRating = 0;
  let ratingCount = 0;

  platformStats.forEach(ps => {
    aggregated.platformsActive++;

    const breakdown = {
      platform: ps.platform,
      problemsSolved: 0,
      commits: 0,
      contests: 0,
      rating: 0
    };

    // LeetCode
    if (ps.platform === 'leetcode') {
      breakdown.problemsSolved = ps.stats.totalSolved || 0;
      breakdown.contests = ps.stats.contestsParticipated || 0;
      breakdown.rating = ps.stats.rating || 0;
    }

    // GitHub
    if (ps.platform === 'github') {
      breakdown.commits = ps.stats.totalCommits || 0;
    }

    // Codeforces
    if (ps.platform === 'codeforces') {
      breakdown.problemsSolved = ps.stats.problemsSolved || 0;
      breakdown.contests = ps.stats.contestsParticipated || 0;
      breakdown.rating = ps.stats.rating || 0;
    }

    // CodeChef
    if (ps.platform === 'codechef') {
      breakdown.problemsSolved = ps.stats.problemsSolved || 0;
      breakdown.contests = ps.stats.contestsParticipated || 0;
      breakdown.rating = ps.stats.rating || 0;
    }

    // GeeksforGeeks
    if (ps.platform === 'geeksforgeeks') {
      breakdown.problemsSolved = ps.stats.problemsSolved || 0;
    }

    // HackerRank
    if (ps.platform === 'hackerrank') {
      breakdown.problemsSolved = ps.stats.problemsSolved || 0;
    }

    // Coding Ninjas
    if (ps.platform === 'codingninjas') {
      breakdown.problemsSolved = ps.stats.problemsSolved || ps.stats.totalSolved || 0;
      breakdown.contests = ps.stats.contestsParticipated || 0;
    }

    aggregated.totalProblemsSolved += breakdown.problemsSolved;
    aggregated.totalCommits += breakdown.commits;
    aggregated.totalContests += breakdown.contests;

    if (breakdown.rating > 0) {
      totalRating += breakdown.rating;
      ratingCount++;
    }

    aggregated.breakdown.push(breakdown);
  });

  aggregated.averageRating = ratingCount > 0 ? Math.round(totalRating / ratingCount) : 0;

  // Save daily progress snapshot
  await saveDailyProgress(userId, aggregated);

  return aggregated;
};

/**
 * Save daily progress snapshot
 * @param {string} userId - User ID
 * @param {Object} aggregated - Aggregated stats
 */
const saveDailyProgress = async (userId, aggregated) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get yesterday's data for delta calculation
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayProgress = await DailyProgress.findOne({
    userId,
    date: yesterday
  });

  const changes = {
    problemsDelta: 0,
    commitsDelta: 0,
    ratingDelta: 0
  };

  if (yesterdayProgress) {
    changes.problemsDelta = aggregated.totalProblemsSolved - yesterdayProgress.aggregatedStats.totalProblemsSolved;
    changes.commitsDelta = aggregated.totalCommits - yesterdayProgress.aggregatedStats.totalCommits;
    changes.ratingDelta = aggregated.averageRating - yesterdayProgress.aggregatedStats.averageRating;
  }

  await DailyProgress.findOneAndUpdate(
    { userId, date: today },
    {
      userId,
      date: today,
      aggregatedStats: aggregated,
      platformBreakdown: aggregated.breakdown,
      changes
    },
    { upsert: true }
  );
};

/**
 * Get user progress over time period
 * @param {string} userId - User ID
 * @param {string} period - 'daily', 'weekly', 'monthly'
 * @param {number} limit - Number of records to fetch
 * @returns {Array} Progress records
 */
const getProgressHistory = async (userId, period = 'daily', limit = 30) => {
  const query = { userId };
  
  if (period === 'weekly') {
    // Get last N weeks (group by week)
    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - (limit * 7));
    query.date = { $gte: weeksAgo };
  } else if (period === 'monthly') {
    // Get last N months
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - limit);
    query.date = { $gte: monthsAgo };
  } else {
    // Daily - get last N days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - limit);
    query.date = { $gte: daysAgo };
  }

  return await DailyProgress.find(query)
    .sort({ date: -1 })
    .limit(limit);
};

/**
 * Calculate user's activity streaks
 * @param {string} userId - User ID
 * @returns {Object} Streak information
 */
const calculateStreaks = async (userId) => {
  const allProgress = await DailyProgress.find({ userId })
    .sort({ date: -1 })
    .limit(365); // Last year

  if (allProgress.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null
    };
  }

  // Build a Set of active date strings for O(1) lookup
  const activeDates = new Set();
  allProgress.forEach(p => {
    const changes = p.changes;
    if ((changes.problemsDelta > 0 || changes.commitsDelta > 0)) {
      const dateKey = toLocalDateStr(new Date(p.date));
      activeDates.add(dateKey);
    }
  });

  // Calculate current streak: walk backwards from today (or yesterday if today has no activity yet)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toLocalDateStr(today);

  let currentStreak = 0;
  let checkDate = new Date(today);

  // If today has no activity, start checking from yesterday (day isn't over)
  if (!activeDates.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateKey = toLocalDateStr(checkDate);
    if (activeDates.has(dateKey)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak by walking through all progress records sorted ascending
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = [...activeDates].sort();
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: allProgress[0]?.date || null
  };
};

/**
 * Calculate language breakdown from GitHub stats
 * @param {string} userId - User ID
 * @returns {Object} Language percentages
 */
const calculateLanguageBreakdown = async (userId) => {
  const githubStats = await PlatformStats.findOne({
    userId,
    platform: 'github',
    fetchStatus: 'success'
  });

  if (!githubStats || !githubStats.stats.languages) {
    return {};
  }

  return githubStats.stats.languages;
};

/**
 * Calculate weekly progress comparison
 * @param {string} userId - User ID
 * @returns {Object} Week-over-week comparison
 */
const calculateWeeklyProgress = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // This week (last 7 days)
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);

  // Previous week (7-14 days ago)
  const prevWeekStart = new Date(today);
  prevWeekStart.setDate(prevWeekStart.getDate() - 14);
  const prevWeekEnd = new Date(weekStart);

  const thisWeekProgress = await DailyProgress.find({
    userId,
    date: { $gte: weekStart, $lte: today }
  });

  const prevWeekProgress = await DailyProgress.find({
    userId,
    date: { $gte: prevWeekStart, $lt: prevWeekEnd }
  });

  const calculateWeekTotals = (progressArray) => {
    return progressArray.reduce((acc, day) => {
      acc.problems += day.changes.problemsDelta || 0;
      acc.commits += day.changes.commitsDelta || 0;
      acc.activeDays += (day.changes.problemsDelta > 0 || day.changes.commitsDelta > 0) ? 1 : 0;
      return acc;
    }, { problems: 0, commits: 0, activeDays: 0 });
  };

  const thisWeek = calculateWeekTotals(thisWeekProgress);
  const prevWeek = calculateWeekTotals(prevWeekProgress);

  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    thisWeek,
    prevWeek,
    improvement: {
      problems: calculateChange(thisWeek.problems, prevWeek.problems),
      commits: calculateChange(thisWeek.commits, prevWeek.commits),
      activeDays: calculateChange(thisWeek.activeDays, prevWeek.activeDays)
    },
    trend: (thisWeek.problems + thisWeek.commits) > (prevWeek.problems + prevWeek.commits) ? 'up' : 'down'
  };
};

/**
 * Get contribution calendar data for last 365 days
 * Merges data from ALL platforms: LeetCode, GitHub, Codeforces, CodeChef,
 * HackerRank, GFG, CodingNinjas + DailyProgress records
 * @param {string} userId - User ID
 * @returns {Object} Calendar data with stats
 */
const getContributionCalendar = async (userId) => {
  // Use LOCAL dates to avoid timezone issues
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startDate.setDate(startDate.getDate() - 365);
  
  console.log(`📅 Calendar range: ${toLocalDateStr(startDate)} to ${todayStr} (local time)`);

  // Create a map of dates to contributions
  const contributionMap = {};

  // Helper to add contributions to the map
  const addContribution = (dateKey, count, type) => {
    if (!dateKey || count <= 0) return;
    if (!contributionMap[dateKey]) {
      contributionMap[dateKey] = {
        date: dateKey,
        count: 0,
        problems: 0,
        commits: 0,
        level: 0
      };
    }
    contributionMap[dateKey].count += count;
    if (type === 'problems') {
      contributionMap[dateKey].problems += count;
    } else if (type === 'commits') {
      contributionMap[dateKey].commits += count;
    }
  };

  // Helper to merge a calendar array into the map
  const mergeCalendarArray = (calendarArray, type) => {
    if (!Array.isArray(calendarArray)) return 0;
    let merged = 0;
    calendarArray.forEach(day => {
      const dateKey = (day.date || '').split('T')[0];
      if (dateKey && day.count > 0) {
        const dayDate = new Date(dateKey + 'T00:00:00');
        if (dayDate >= startDate && dayDate <= endDate) {
          addContribution(dateKey, day.count, type);
          merged++;
        }
      }
    });
    return merged;
  };

  // Look up user to get platform usernames
  const user = await User.findById(userId);
  const allPlatformStats = await PlatformStats.find({ userId, fetchStatus: 'success' });

  // ═══════════════════════════════════════════════════════
  // 1. LEETCODE — Use stored data PLUS live fetch for fresh today data
  // ═══════════════════════════════════════════════════════
  const leetcodeStats = allPlatformStats.find(ps => ps.platform === 'leetcode');
  if (leetcodeStats?.stats?.submissionCalendar) {
    const count = mergeCalendarArray(leetcodeStats.stats.submissionCalendar, 'problems');
    console.log(`📅 Calendar: Using stored LeetCode data (${count} active days)`);
  }
  // Live-fetch LeetCode calendar to get fresh data for today and recent days
  if (user?.platforms?.leetcode) {
    try {
      const liveCalResult = await fetchLeetCodeSubmissionCalendar(user.platforms.leetcode);
      if (liveCalResult.success && liveCalResult.data?.length > 0) {
        // Only merge last 7 days from live data for freshness
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        
        const recentDays = liveCalResult.data.filter(d => {
          const dayDate = new Date(d.date + 'T00:00:00');
          return dayDate >= sevenDaysAgo;
        });
        
        // IMPORTANT: Clear stored data for these days first, then add live data
        // This ensures 0-count days overwrite stale stored data
        recentDays.forEach(day => {
          const dateKey = day.date;
          const dayDate = new Date(dateKey + 'T00:00:00');
          if (dayDate >= startDate && dayDate <= endDate) {
            // Remove old LeetCode problems count if exists
            if (contributionMap[dateKey]) {
              const oldProblems = contributionMap[dateKey].problems || 0;
              contributionMap[dateKey].count -= oldProblems;
              contributionMap[dateKey].problems = 0;
            }
            // Add live data (even if 0)
            if (day.count > 0) {
              addContribution(dateKey, day.count, 'problems');
            }
          }
        });
        console.log(`📅 Calendar: Updated ${recentDays.length} days with live LeetCode data`);
      }
    } catch (err) {
      console.warn(`⚠️ Live LeetCode calendar fetch failed: ${err.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════
  // 2. GITHUB — Use stored data + live fetch for today
  // ═══════════════════════════════════════════════════════
  const githubStats = allPlatformStats.find(ps => ps.platform === 'github');
  if (githubStats?.stats?.contributionCalendar) {
    const count = mergeCalendarArray(githubStats.stats.contributionCalendar, 'commits');
    console.log(`📅 Calendar: Using stored GitHub data (${count} active days)`);
  }
  // Live-fetch GitHub contributions for fresh data
  if (user?.platforms?.github) {
    try {
      const liveGHResult = await fetchGitHubStats(user.platforms.github, process.env.GITHUB_TOKEN);
      if (liveGHResult.success && liveGHResult.stats?.contributionCalendar?.length > 0) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        
        const recentDays = liveGHResult.stats.contributionCalendar.filter(d => {
          const dayDate = new Date(d.date + 'T00:00:00');
          return dayDate >= sevenDaysAgo;
        });
        
        // Clear old GitHub commits for these days, then add live data
        recentDays.forEach(day => {
          const dateKey = (day.date || '').split('T')[0];
          const dayDate = new Date(dateKey + 'T00:00:00');
          if (dayDate >= startDate && dayDate <= endDate) {
            if (contributionMap[dateKey]) {
              const oldCommits = contributionMap[dateKey].commits || 0;
              contributionMap[dateKey].count -= oldCommits;
              contributionMap[dateKey].commits = 0;
            }
            if (day.count > 0) {
              addContribution(dateKey, day.count, 'commits');
            }
          }
        });
        console.log(`📅 Calendar: Updated ${recentDays.length} days with live GitHub data`);
      }
    } catch (err) {
      console.warn(`⚠️ Live GitHub calendar fetch failed: ${err.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════
  // 3. CODEFORCES — Use stored data for consistency
  // ═══════════════════════════════════════════════════════
  const cfStats = allPlatformStats.find(ps => ps.platform === 'codeforces');
  if (cfStats?.stats?.submissionCalendar) {
    const count = mergeCalendarArray(cfStats.stats.submissionCalendar, 'problems');
    console.log(`📅 Calendar: Using stored Codeforces data (${count} active days)`);
  }

  // ═══════════════════════════════════════════════════════
  // 4. HACKERRANK — Use stored data for consistency
  // ═══════════════════════════════════════════════════════
  const hrStats = allPlatformStats.find(ps => ps.platform === 'hackerrank');
  if (hrStats?.stats?.submissionCalendar) {
    const count = mergeCalendarArray(hrStats.stats.submissionCalendar, 'problems');
    console.log(`📅 Calendar: Using stored HackerRank data (${count} active days)`);
  }

  // ═══════════════════════════════════════════════════════
  // 5. CODECHEF — Use stored data (no calendar API available)
  // ═══════════════════════════════════════════════════════
  const codechefStats = allPlatformStats.find(ps => ps.platform === 'codechef');
  if (codechefStats?.stats?.submissionCalendar) {
    const count = mergeCalendarArray(codechefStats.stats.submissionCalendar, 'problems');
    console.log(`📅 Calendar: Merged CodeChef stored data (${count} active days)`);
  }

  // ═══════════════════════════════════════════════════════
  // 6. GFG — Use stored data (no calendar API available)
  // ═══════════════════════════════════════════════════════
  const gfgStats = allPlatformStats.find(ps => ps.platform === 'geeksforgeeks');
  if (gfgStats?.stats?.submissionCalendar) {
    const count = mergeCalendarArray(gfgStats.stats.submissionCalendar, 'problems');
    console.log(`📅 Calendar: Merged GFG stored data (${count} active days)`);
  }

  // ═══════════════════════════════════════════════════════
  // 7. CODING NINJAS — Use stored data
  // ═══════════════════════════════════════════════════════
  const cnStats = allPlatformStats.find(ps => ps.platform === 'codingninjas');
  if (cnStats?.stats?.submissionCalendar) {
    const count = mergeCalendarArray(cnStats.stats.submissionCalendar, 'problems');
    console.log(`📅 Calendar: Merged CodingNinjas stored data (${count} active days)`);
  }

  // ═══════════════════════════════════════════════════════
  // 8. DailyProgress records — fill any gaps
  // ═══════════════════════════════════════════════════════
  const progressData = await DailyProgress.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  progressData.forEach(day => {
    const dateKey = toLocalDateStr(new Date(day.date));
    if (!contributionMap[dateKey] || contributionMap[dateKey].count === 0) {
      const problems = day.changes?.problemsDelta || 0;
      const commits = day.changes?.commitsDelta || 0;
      if (problems > 0) addContribution(dateKey, problems, 'problems');
      if (commits > 0) addContribution(dateKey, commits, 'commits');
    }
  });

  // Fill in all 366 days using LOCAL dates — guarantees today is always the last cell
  const calendar = [];
  const loopStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const loopEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // today midnight local
  const current = new Date(loopStart);
  
  while (current <= loopEnd) {
    const dateKey = toLocalDateStr(current);
    if (contributionMap[dateKey]) {
      calendar.push(contributionMap[dateKey]);
    } else {
      calendar.push({
        date: dateKey,
        count: 0,
        problems: 0,
        commits: 0,
        level: 0
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  // Verify today is included
  const lastDate = calendar[calendar.length - 1]?.date;
  const todayData = calendar.find(d => d.date === todayStr);
  console.log(`📅 Calendar: ${calendar.length} days (${calendar[0]?.date} → ${lastDate})`);
  console.log(`📅 Today (${todayStr}): ${todayData ? `${todayData.count} contributions` : '⚠️ MISSING!'}`);

  // Calculate contribution levels (0-4) based on activity using percentiles
  const counts = calendar.map(d => d.count).filter(c => c > 0).sort((a, b) => a - b);
  
  if (counts.length > 0) {
    const percentile25 = counts[Math.floor(counts.length * 0.25)] || 1;
    const percentile50 = counts[Math.floor(counts.length * 0.50)] || 2;
    const percentile75 = counts[Math.floor(counts.length * 0.75)] || 4;

    calendar.forEach(day => {
      if (day.count === 0) day.level = 0;
      else if (day.count <= percentile25) day.level = 1;
      else if (day.count <= percentile50) day.level = 2;
      else if (day.count <= percentile75) day.level = 3;
      else day.level = 4;
    });
  }

  // Calculate stats
  const totalContributions = calendar.reduce((sum, day) => sum + day.count, 0);
  const totalProblems = calendar.reduce((sum, day) => sum + (day.problems || 0), 0);
  const totalCommits = calendar.reduce((sum, day) => sum + (day.commits || 0), 0);
  const activeDays = calendar.filter(d => d.count > 0).length;
  // Streaks count ANY activity (problems OR commits across all platforms)
  const currentStreak = calculateCurrentStreak(calendar);
  const longestStreak = calculateLongestStreak(calendar);

  // Debug: show where the current streak starts (the first gap day)
  const streakStartIdx = calendar.length - 1 - currentStreak;
  if (streakStartIdx >= 0 && streakStartIdx < calendar.length) {
    const gapDay = calendar[streakStartIdx];
    const streakFirstDay = calendar[streakStartIdx + 1];
    console.log(`📊 Streak start: ${streakFirstDay?.date} (gap before: ${gapDay?.date} count=${gapDay?.count})`);
  }

  console.log(`📅 Calendar final: ${totalContributions} total (${totalProblems} problems + ${totalCommits} commits), ${activeDays} active days, streak: ${currentStreak}/${longestStreak}`);

  return {
    calendar,
    stats: {
      totalContributions,
      totalProblems,
      totalCommits,
      currentStreak,
      longestStreak,
      activeDays
    }
  };
};

/**
 * Calculate current streak from calendar data
 * Walks backwards from the end of the calendar.
 * If today (last entry) has no activity, skips it (day isn't over yet).
 */
const calculateCurrentStreak = (calendar) => {
  if (!calendar || calendar.length === 0) return 0;
  
  const todayStr = toLocalDateStr(new Date());
  let streak = 0;
  
  for (let i = calendar.length - 1; i >= 0; i--) {
    const day = calendar[i];
    const count = day.count || 0;
    
    // Skip today if no activity yet (day isn't over)
    if (day.date === todayStr && count === 0) {
      continue;
    }
    
    if (count > 0) {
      streak++;
    } else {
      break; // First gap = streak ends
    }
  }
  
  return streak;
};

/**
 * Calculate longest streak from calendar data
 * Simple scan: count consecutive active days, keep the maximum.
 */
const calculateLongestStreak = (calendar) => {
  if (!calendar || calendar.length === 0) return 0;
  
  let maxStreak = 0;
  let tempStreak = 0;
  
  for (let i = 0; i < calendar.length; i++) {
    if ((calendar[i].count || 0) > 0) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }
  
  return maxStreak;
};

module.exports = {
  fetchPlatformData,
  fetchAllPlatformStats,
  calculateAggregatedStats,
  getProgressHistory,
  calculateStreaks,
  calculateLanguageBreakdown,
  calculateWeeklyProgress,
  getContributionCalendar
};
