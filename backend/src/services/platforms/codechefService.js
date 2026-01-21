const axios = require('axios');

/**
 * CodeChef API Service
 * Note: CodeChef's official API requires OAuth, this uses public profile scraping
 * For production, implement proper OAuth flow
 */

const CODECHEF_API = 'https://www.codechef.com/api/user/';

/**
 * Fetch CodeChef user statistics
 * @param {string} username - CodeChef username
 * @returns {Object} User stats
 */
const fetchCodeChefStats = async (username) => {
  try {
    // CodeChef public API endpoint (unofficial)
    const response = await axios.get(`${CODECHEF_API}${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    if (!response.data || !response.data.success) {
      throw new Error('User not found on CodeChef');
    }

    const userData = response.data;

    const stats = {
      rating: userData.current_rating || 0,
      maxRating: userData.highest_rating || 0,
      stars: userData.stars || '0',
      globalRank: userData.global_rank || 0,
      countryRank: userData.country_rank || 0,
      problemsSolved: userData.fully_solved?.count || 0,
      contestsParticipated: userData.contests?.count || 0
    };

    return {
      success: true,
      platform: 'codechef',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`CodeChef API Error for ${username}:`, error.message);
    
    // Fallback: Try alternate approach (placeholder for future implementation)
    return {
      success: false,
      platform: 'codechef',
      username,
      error: 'CodeChef API unavailable. Please add API credentials in .env',
      stats: null
    };
  }
};

module.exports = {
  fetchCodeChefStats
};
