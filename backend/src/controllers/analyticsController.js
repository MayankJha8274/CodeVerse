const { 
  calculateStreaks, 
  calculateLanguageBreakdown, 
  calculateWeeklyProgress 
} = require('../services/aggregationService');
const { 
  trackRatingHistory, 
  detectRatingChanges, 
  predictNextRating, 
  analyzeContestPerformance,
  getHighestRatedPlatform 
} = require('../services/cpRatingService');
const { 
  identifyWeakAreas, 
  suggestDailyGoals, 
  findSimilarUsers, 
  detectAchievements,
  generateInsightsSummary 
} = require('../services/insightsService');

/**
 * Analytics Controller
 * Handles Phase 4 analytics endpoints
 */

/**
 * Get user's activity streaks
 * GET /api/analytics/streaks
 */
exports.getStreaks = async (req, res) => {
  try {
    const streaks = await calculateStreaks(req.user.id);
    res.json({
      success: true,
      data: streaks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching streaks',
      error: error.message
    });
  }
};

/**
 * Get language breakdown from GitHub
 * GET /api/analytics/languages
 */
exports.getLanguages = async (req, res) => {
  try {
    const languages = await calculateLanguageBreakdown(req.user.id);
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching language breakdown',
      error: error.message
    });
  }
};

/**
 * Get weekly progress comparison
 * GET /api/analytics/weekly-progress
 */
exports.getWeeklyProgress = async (req, res) => {
  try {
    const progress = await calculateWeeklyProgress(req.user.id);
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly progress',
      error: error.message
    });
  }
};

/**
 * Get rating history for a platform
 * GET /api/analytics/rating-history/:platform?days=90
 */
exports.getRatingHistory = async (req, res) => {
  try {
    const { platform } = req.params;
    const days = parseInt(req.query.days) || 90;
    
    const history = await trackRatingHistory(req.user.id, platform, days);
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rating history',
      error: error.message
    });
  }
};

/**
 * Get recent rating changes
 * GET /api/analytics/rating-changes
 */
exports.getRatingChanges = async (req, res) => {
  try {
    const changes = await detectRatingChanges(req.user.id);
    res.json({
      success: true,
      data: changes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error detecting rating changes',
      error: error.message
    });
  }
};

/**
 * Predict next rating for a platform
 * GET /api/analytics/rating-prediction/:platform
 */
exports.getRatingPrediction = async (req, res) => {
  try {
    const { platform } = req.params;
    const prediction = await predictNextRating(req.user.id, platform);
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error predicting rating',
      error: error.message
    });
  }
};

/**
 * Get contest performance analysis
 * GET /api/analytics/contest-performance
 */
exports.getContestPerformance = async (req, res) => {
  try {
    const performance = await analyzeContestPerformance(req.user.id);
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing contest performance',
      error: error.message
    });
  }
};

/**
 * Get highest rated platform
 * GET /api/analytics/highest-rated
 */
exports.getHighestRated = async (req, res) => {
  try {
    const highest = await getHighestRatedPlatform(req.user.id);
    res.json({
      success: true,
      data: highest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching highest rated platform',
      error: error.message
    });
  }
};

/**
 * Identify weak areas
 * GET /api/analytics/weak-areas
 */
exports.getWeakAreas = async (req, res) => {
  try {
    const weakAreas = await identifyWeakAreas(req.user.id);
    res.json({
      success: true,
      data: weakAreas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error identifying weak areas',
      error: error.message
    });
  }
};

/**
 * Get suggested daily goals
 * GET /api/analytics/daily-goals
 */
exports.getDailyGoals = async (req, res) => {
  try {
    const goals = await suggestDailyGoals(req.user.id);
    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error suggesting daily goals',
      error: error.message
    });
  }
};

/**
 * Find similar users
 * GET /api/analytics/similar-users?limit=5
 */
exports.getSimilarUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const similarUsers = await findSimilarUsers(req.user.id, limit);
    res.json({
      success: true,
      data: similarUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error finding similar users',
      error: error.message
    });
  }
};

/**
 * Get achievements
 * GET /api/analytics/achievements
 */
exports.getAchievements = async (req, res) => {
  try {
    const achievements = await detectAchievements(req.user.id);
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error detecting achievements',
      error: error.message
    });
  }
};

/**
 * Get complete insights summary
 * GET /api/analytics/insights
 */
exports.getInsightsSummary = async (req, res) => {
  try {
    const insights = await generateInsightsSummary(req.user.id);
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating insights summary',
      error: error.message
    });
  }
};
