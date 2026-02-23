const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');

// Calculate Coding-Score (Comprehensive Score)
const calculateCodingScore = (user, stats) => {
  let score = 0;

  // Problems solved (max 400 points) — 0.5 pts each, capped at 400
  const totalProblems = stats?.totalProblems || 0;
  score += Math.min(400, totalProblems * 0.5);

  // Platform ratings (max 300 points)
  // LeetCode rating: max 100 pts (rating/30), cap 3000 → 100
  const lcRating = stats?.leetcode?.stats?.rating || 0;
  if (lcRating) score += Math.min(100, lcRating / 30);

  // Codeforces rating: max 100 pts (rating/20), cap 2000 → 100
  const cfRating = stats?.codeforces?.stats?.rating || 0;
  if (cfRating) score += Math.min(100, cfRating / 20);

  // CodeChef rating: max 100 pts (rating/20)
  const ccRating = stats?.codechef?.stats?.rating || 0;
  if (ccRating) score += Math.min(100, ccRating / 20);

  // GitHub contributions (max 150 points) — 0.1 pt each, cap 1500 → 150
  const ghContribs = stats?.github?.stats?.totalContributions || stats?.github?.stats?.currentYearContributions || 0;
  if (ghContribs) score += Math.min(150, ghContribs * 0.1);

  // Consistency (max 150 points)
  // Streak: up to 100 pts (2 pts/day, cap 50 days)
  const streak = stats?.leetcode?.stats?.leetcodeStreak || 0;
  if (streak) score += Math.min(100, streak * 2);

  // Contests participated: up to 50 pts (5 pts each, cap 10 contests)
  const contests = (stats?.codeforces?.stats?.contestsParticipated || 0) + (stats?.codechef?.stats?.contestsParticipated || 0);
  if (contests) score += Math.min(50, contests * 5);

  return Math.round(score);
};

// @desc    Get global leaderboard
// @route   GET /api/leaderboard
// @access  Private
const getGlobalLeaderboard = async (req, res, next) => {
  try {
    const { limit = 100, page = 1, period = 'all-time', sortBy = 'codingScore' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get all users with their platform data
    const users = await User.find({ isActive: true })
      .select('username fullName avatar platforms institution country createdAt')
      .lean();
    
    // Get platform stats for all users
    const userIds = users.map(u => u._id);
    const platformStats = await PlatformStats.find({ userId: { $in: userIds } }).lean();
    
    // Create a map of user stats
    const statsMap = {};
    platformStats.forEach(stat => {
      if (!stat || !stat.userId) return; // guard against malformed records
      const userId = stat.userId.toString();
      if (!statsMap[userId]) {
        statsMap[userId] = {
          totalProblems: 0,
          leetcode: {},
          codeforces: {},
          codechef: {},
          github: {},
          streak: 0,
          contestsParticipated: 0
        };
      }
      statsMap[userId][stat.platform] = stat;
      // problems solved: LeetCode uses totalSolved, others use problemsSolved
      const solved = stat.stats?.totalSolved || stat.stats?.problemsSolved || 0;
      statsMap[userId].totalProblems += solved;
    });

    // Calculate scores and build leaderboard
    const leaderboard = users.map(user => {
      const stats = statsMap[user._id.toString()] || { totalProblems: 0 };
      const codingScore = calculateCodingScore(user, stats);
      return {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        institution: user.institution || 'Independent',
        country: user.country || 'IN',
        codingScore,
        totalProblems: stats.totalProblems,
        leetcodeRating: stats.leetcode?.stats?.rating || 0,
        leetcodeProblems: stats.leetcode?.stats?.totalSolved || stats.leetcode?.stats?.problemsSolved || 0,
        codeforcesRating: stats.codeforces?.stats?.rating || 0,
        codeforcesProblems: stats.codeforces?.stats?.problemsSolved || 0,
        codechefRating: stats.codechef?.stats?.rating || 0,
        codechefProblems: stats.codechef?.stats?.problemsSolved || 0,
        githubContributions: stats.github?.stats?.totalContributions || stats.github?.stats?.currentYearContributions || 0,
        githubRepos: stats.github?.stats?.totalRepos || 0,
        platforms: {
          leetcode: stats.leetcode?.stats?.totalSolved || stats.leetcode?.stats?.problemsSolved || 0,
          codeforces: stats.codeforces?.stats?.problemsSolved || 0,
          codechef: stats.codechef?.stats?.problemsSolved || 0,
          geeksforgeeks: stats.geeksforgeeks?.stats?.problemsSolved || 0,
          hackerrank: stats.hackerrank?.stats?.problemsSolved || 0,
          github: stats.github?.stats?.totalContributions || stats.github?.stats?.currentYearContributions || 0
        }
      };
    });

    // Sort based on sortBy parameter
    const sortFunctions = {
      'codingScore': (a, b) => b.codingScore - a.codingScore,
      'problems': (a, b) => b.totalProblems - a.totalProblems,
      'leetcode': (a, b) => b.leetcodeRating - a.leetcodeRating,
      'codeforces': (a, b) => b.codeforcesRating - a.codeforcesRating,
      'codechef': (a, b) => b.codechefRating - a.codechefRating,
      'github': (a, b) => b.githubContributions - a.githubContributions
    };

    const sortFn = sortFunctions[sortBy] || sortFunctions['codingScore'];
    leaderboard.sort(sortFn);
    
    // Add ranks based on current sort
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    // Get current user's rank
    const currentUserId = req.user.id.toString();
    const userRank = leaderboard.findIndex(e => e.id.toString() === currentUserId) + 1;
    const currentUserData = leaderboard.find(e => e.id.toString() === currentUserId);
    
    // Paginate
    const paginatedLeaderboard = leaderboard.slice(skip, skip + parseInt(limit));
    const totalUsers = leaderboard.length;
    
    res.status(200).json({
      success: true,
      data: {
        leaderboard: paginatedLeaderboard,
        topThree: leaderboard.slice(0, 3),
        currentUser: currentUserData ? { ...currentUserData, rank: userRank } : null,
        sortBy,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalUsers,
          totalPages: Math.ceil(totalUsers / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user rank
// @route   GET /api/leaderboard/rank
// @access  Private
const getUserRank = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get all users and calculate scores
    const users = await User.find({ isActive: true }).lean();
    const platformStats = await PlatformStats.find().lean();
    
    const statsMap = {};
    platformStats.forEach(stat => {
      if (!stat || !stat.userId) return; // skip malformed entries
      const uid = stat.userId.toString();
      if (!statsMap[uid]) statsMap[uid] = { totalProblems: 0 };
      statsMap[uid][stat.platform] = stat;
      const solved = stat.stats?.totalSolved || stat.stats?.problemsSolved || 0;
      statsMap[uid].totalProblems += solved;
    });
    
    const scores = users.map(user => ({
      id: user._id.toString(),
      codingScore: calculateCodingScore(user, statsMap[user._id.toString()] || { totalProblems: 0 })
    }));
    
    scores.sort((a, b) => b.codingScore - a.codingScore);

    const userRank = scores.findIndex(s => s.id === userId.toString()) + 1;
    const userScore = scores.find(s => s.id === userId.toString())?.codingScore || 0;

    res.status(200).json({
      success: true,
      data: {
        rank: userRank,
        totalUsers: scores.length,
        codingScore: userScore,
        percentile: userRank > 0 ? Math.round(((scores.length - userRank) / scores.length) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard by institution
// @route   GET /api/leaderboard/institution/:institution
// @access  Private
const getInstitutionLeaderboard = async (req, res, next) => {
  try {
    const { institution } = req.params;
    const { limit = 50, page = 1 } = req.query;
    
    const users = await User.find({ 
      isActive: true,
      institution: { $regex: institution, $options: 'i' }
    }).lean();
    
    const userIds = users.map(u => u._id);
    const platformStats = await PlatformStats.find({ userId: { $in: userIds } }).lean();
    
    const statsMap = {};
    platformStats.forEach(stat => {
      if (!stat || !stat.userId) return; // guard against missing user references
      const userId = stat.userId.toString();
      if (!statsMap[userId]) statsMap[userId] = { totalProblems: 0 };
      statsMap[userId][stat.platform] = stat;
      const instSolved = stat.stats?.totalSolved || stat.stats?.problemsSolved || 0;
      statsMap[userId].totalProblems += instSolved;
    });

    const leaderboard = users.map(user => {
      const stats = statsMap[user._id.toString()] || { totalProblems: 0 };
      return {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        codingScore: calculateCodingScore(user, stats),
        totalProblems: stats.totalProblems
      };
    });

    leaderboard.sort((a, b) => b.codingScore - a.codingScore);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedLeaderboard = leaderboard.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        institution,
        leaderboard: paginatedLeaderboard,
        totalUsers: leaderboard.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGlobalLeaderboard,
  getUserRank,
  getInstitutionLeaderboard,
  calculateCodingScore
};
