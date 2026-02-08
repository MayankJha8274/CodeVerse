const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');

// Calculate C-Score (Comprehensive Score) like Codolio
const calculateCScore = (user, stats) => {
  let score = 0;
  
  // Problems solved (max 400 points)
  const totalProblems = stats?.totalProblems || 0;
  score += Math.min(400, totalProblems * 0.5);
  
  // Platform ratings (max 300 points)
  const platforms = user.platforms || {};
  let ratingScore = 0;
  
  // LeetCode rating contribution
  if (stats?.leetcode?.rating) {
    ratingScore += Math.min(100, stats.leetcode.rating / 30);
  }
  
  // Codeforces rating contribution
  if (stats?.codeforces?.rating) {
    ratingScore += Math.min(100, stats.codeforces.rating / 20);
  }
  
  // CodeChef rating contribution
  if (stats?.codechef?.rating) {
    ratingScore += Math.min(100, stats.codechef.rating / 20);
  }
  
  score += ratingScore;
  
  // GitHub contributions (max 150 points)
  if (stats?.github?.contributions) {
    score += Math.min(150, stats.github.contributions * 0.1);
  }
  
  // Active days streak bonus (max 100 points)
  if (stats?.streak) {
    score += Math.min(100, stats.streak * 2);
  }
  
  // Contests participated (max 50 points)
  if (stats?.contestsParticipated) {
    score += Math.min(50, stats.contestsParticipated * 5);
  }
  
  return Math.round(score);
};

// @desc    Get global leaderboard
// @route   GET /api/leaderboard
// @access  Private
const getGlobalLeaderboard = async (req, res, next) => {
  try {
    const { limit = 100, page = 1, period = 'all-time', sortBy = 'cScore' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get all users with their platform data
    const users = await User.find({ isActive: true })
      .select('username fullName avatar platforms institution country createdAt')
      .lean();
    
    // Get platform stats for all users
    const userIds = users.map(u => u._id);
    const platformStats = await PlatformStats.find({ user: { $in: userIds } }).lean();
    
    // Create a map of user stats
    const statsMap = {};
    platformStats.forEach(stat => {
      if (!stat || !stat.user) return; // guard against malformed records
      const userId = stat.user.toString();
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
      statsMap[userId].totalProblems += stat.problemsSolved || 0;
    });
    
    // Calculate scores and build leaderboard
    const leaderboard = users.map(user => {
      const stats = statsMap[user._id.toString()] || { totalProblems: 0 };
      const cScore = calculateCScore(user, stats);
      // Return user data along with scores
      return {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        institution: user.institution || 'Independent',
        country: user.country || 'IN',
        cScore,
        totalProblems: stats.totalProblems,
        leetcodeRating: stats.leetcode?.rating || 0,
        leetcodeProblems: stats.leetcode?.problemsSolved || 0,
        codeforcesRating: stats.codeforces?.rating || 0,
        codeforcesProblems: stats.codeforces?.problemsSolved || 0,
        codechefRating: stats.codechef?.rating || 0,
        codechefProblems: stats.codechef?.problemsSolved || 0,
        githubContributions: stats.github?.contributions || 0,
        githubRepos: stats.github?.publicRepos || 0,
        platforms: {
          leetcode: stats.leetcode?.problemsSolved || 0,
          codeforces: stats.codeforces?.problemsSolved || 0,
          codechef: stats.codechef?.problemsSolved || 0,
          geeksforgeeks: stats.geeksforgeeks?.problemsSolved || 0,
          hackerrank: stats.hackerrank?.problemsSolved || 0,
          github: stats.github?.contributions || 0
        }
      };
    });
    
    // Sort based on sortBy parameter
    const sortFunctions = {
      'cScore': (a, b) => b.cScore - a.cScore,
      'problems': (a, b) => b.totalProblems - a.totalProblems,
      'leetcode': (a, b) => b.leetcodeRating - a.leetcodeRating,
      'codeforces': (a, b) => b.codeforcesRating - a.codeforcesRating,
      'codechef': (a, b) => b.codechefRating - a.codechefRating,
      'github': (a, b) => b.githubContributions - a.githubContributions
    };
    
    const sortFn = sortFunctions[sortBy] || sortFunctions['cScore'];
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
      if (!stat || !stat.user) return; // skip malformed entries
      const uid = stat.user.toString();
      if (!statsMap[uid]) statsMap[uid] = { totalProblems: 0 };
      statsMap[uid][stat.platform] = stat;
      statsMap[uid].totalProblems += stat.problemsSolved || 0;
    });
    
    const scores = users.map(user => ({
      id: user._id.toString(),
      cScore: calculateCScore(user, statsMap[user._id.toString()] || { totalProblems: 0 })
    }));
    
    scores.sort((a, b) => b.cScore - a.cScore);
    
    const userRank = scores.findIndex(s => s.id === userId.toString()) + 1;
    const userScore = scores.find(s => s.id === userId.toString())?.cScore || 0;
    
    res.status(200).json({
      success: true,
      data: {
        rank: userRank,
        totalUsers: scores.length,
        cScore: userScore,
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
    const platformStats = await PlatformStats.find({ user: { $in: userIds } }).lean();
    
    const statsMap = {};
    platformStats.forEach(stat => {
      if (!stat || !stat.user) return; // guard against missing user references
      const userId = stat.user.toString();
      if (!statsMap[userId]) statsMap[userId] = { totalProblems: 0 };
      statsMap[userId][stat.platform] = stat;
      statsMap[userId].totalProblems += stat.problemsSolved || 0;
    });
    
    const leaderboard = users.map(user => {
      const stats = statsMap[user._id.toString()] || { totalProblems: 0 };
      return {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        cScore: calculateCScore(user, stats),
        totalProblems: stats.totalProblems
      };
    });
    
    leaderboard.sort((a, b) => b.cScore - a.cScore);
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
  calculateCScore
};
