const axios = require('axios');
const cheerio = require('cheerio');

/**
 * GeeksforGeeks Service
 * Web scraping approach (GFG doesn't have a public API)
 */

const GFG_PROFILE_URL = 'https://auth.geeksforgeeks.org/user/';

/**
 * Fetch GeeksforGeeks user statistics via web scraping
 * @param {string} username - GFG username
 * @returns {Object} User stats
 */
const fetchGeeksforGeeksStats = async (username) => {
  try {
    const response = await axios.get(`${GFG_PROFILE_URL}${username}/practice`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract stats from profile page (structure may change, needs maintenance)
    let problemsSolved = 0;
    let codingScore = 0;

    // Try to extract problem count
    $('.score_card_value').each((i, elem) => {
      const value = $(elem).text().trim();
      if (i === 0) problemsSolved = parseInt(value) || 0;
      if (i === 1) codingScore = parseInt(value) || 0;
    });

    const stats = {
      problemsSolved,
      codingScore,
      instituteRank: 0, // Would need additional scraping
      monthlyScore: 0
    };

    return {
      success: true,
      platform: 'geeksforgeeks',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`GeeksforGeeks Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'geeksforgeeks',
      username,
      error: 'Unable to fetch GFG stats. Profile may be private or username incorrect.',
      stats: null
    };
  }
};

module.exports = {
  fetchGeeksforGeeksStats
};
