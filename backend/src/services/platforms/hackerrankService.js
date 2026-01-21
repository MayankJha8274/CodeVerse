const axios = require('axios');

/**
 * HackerRank API Service
 * Uses unofficial HackerRank API endpoints
 */

const HACKERRANK_API = 'https://www.hackerrank.com/rest/hackers/';

/**
 * Fetch HackerRank user statistics
 * @param {string} username - HackerRank username
 * @returns {Object} User stats
 */
const fetchHackerRankStats = async (username) => {
  try {
    // Fetch user profile
    const response = await axios.get(`${HACKERRANK_API}${username}/scores_elo`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    if (!response.data || response.data.status === false) {
      throw new Error('User not found on HackerRank');
    }

    const userData = response.data;
    
    // Aggregate stats across different domains
    let totalScore = 0;
    let problemsSolved = 0;

    if (userData.models) {
      Object.values(userData.models).forEach(model => {
        if (model.score) totalScore += model.score;
      });
    }

    const stats = {
      totalScore,
      problemsSolved,
      badges: 0, // Would need additional API call
      rank: 0
    };

    return {
      success: true,
      platform: 'hackerrank',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`HackerRank API Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'hackerrank',
      username,
      error: 'Unable to fetch HackerRank stats. Profile may be private.',
      stats: null
    };
  }
};

module.exports = {
  fetchHackerRankStats
};
