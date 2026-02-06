const axios = require('axios');
const cheerio = require('cheerio');

/**
 * CodeChef Service with axios + cheerio web scraping
 */

/**
 * Fetch CodeChef user statistics
 * @param {string} username - CodeChef username
 * @returns {Object} User stats
 */
const fetchCodeChefStats = async (username) => {
  try {
    // Fetch the profile page
    const response = await axios.get(`https://www.codechef.com/users/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Extract rating
    let rating = 0;
    const ratingText = $('.rating-number').first().text().trim();
    if (ratingText) {
      rating = parseInt(ratingText.replace(/[^0-9]/g, '')) || 0;
    }
    
    // Extract problems solved - try multiple selectors
    let problemsSolved = 0;
    
    // Method 1: Look for "Problems Solved" section
    const pageText = $('body').text();
    const problemsMatch = pageText.match(/Total\s*Problems\s*Solved[:\s]*(\d+)/i) ||
                          pageText.match(/Problems\s*Solved[:\s]*(\d+)/i) ||
                          pageText.match(/Fully\s*Solved[:\s]*(\d+)/i);
    if (problemsMatch) {
      problemsSolved = parseInt(problemsMatch[1]) || 0;
    }
    
    // Method 2: Check rating-data-section for problem count
    if (problemsSolved === 0) {
      const problemSection = $('.problems-solved');
      if (problemSection.length) {
        const numMatch = problemSection.text().match(/(\d+)/);
        if (numMatch) problemsSolved = parseInt(numMatch[1]) || 0;
      }
    }
    
    // Extract highest rating
    let maxRating = rating;
    const highestMatch = pageText.match(/Highest\s*Rating[:\s]*(\d+)/i);
    if (highestMatch) {
      maxRating = parseInt(highestMatch[1]) || rating;
    }
    
    // Calculate stars from rating
    let stars = '0★';
    if (rating >= 2500) stars = '7★';
    else if (rating >= 2200) stars = '6★';
    else if (rating >= 2000) stars = '5★';
    else if (rating >= 1800) stars = '4★';
    else if (rating >= 1600) stars = '3★';
    else if (rating >= 1400) stars = '2★';
    else if (rating > 0) stars = '1★';
    
    // Extract contests participated
    let contestsParticipated = 0;
    const contestsMatch = pageText.match(/Contests?\s*Participated[:\s]*(\d+)/i) ||
                          pageText.match(/(\d+)\s*contests?\s*participated/i);
    if (contestsMatch) {
      contestsParticipated = parseInt(contestsMatch[1]) || 0;
    }
    
    // Extract global and country rank
    let globalRank = 0;
    let countryRank = 0;
    const globalMatch = pageText.match(/Global\s*Rank[:\s]*(\d+)/i);
    const countryMatch = pageText.match(/Country\s*Rank[:\s]*(\d+)/i);
    if (globalMatch) globalRank = parseInt(globalMatch[1]) || 0;
    if (countryMatch) countryRank = parseInt(countryMatch[1]) || 0;

    const stats = {
      rating,
      maxRating,
      stars,
      globalRank,
      countryRank,
      problemsSolved,
      totalSolved: problemsSolved,
      contestsParticipated
    };
    
    console.log(`✅ CodeChef: ${username} - ${problemsSolved} problems, Rating: ${rating} (${stars})`);
    
    return {
      success: true,
      platform: 'codechef',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`❌ CodeChef Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'codechef',
      username,
      error: 'Unable to fetch CodeChef stats. Please check username.',
      stats: null
    };
  }
};

/**
 * Fetch CodeChef rating history
 * @param {string} username - CodeChef username
 * @returns {Array} Rating history with dates
 */
const fetchCodeChefRatingHistory = async (username) => {
  try {
    // CodeChef embeds rating data in the profile page
    const response = await axios.get(`https://www.codechef.com/users/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const history = [];

    // Try to extract rating graph data from script tags
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const content = $(script).html() || '';
      
      // Look for rating data in script content
      const ratingMatch = content.match(/all_rating\s*=\s*(\[[\s\S]*?\])/);
      if (ratingMatch) {
        try {
          const ratingData = JSON.parse(ratingMatch[1]);
          ratingData.forEach(item => {
            history.push({
              date: item.end_date || item.gettime || new Date().toISOString().split('T')[0],
              rating: parseInt(item.rating) || 0,
              contestName: item.name || item.code || 'Contest',
              rank: item.rank || 0
            });
          });
        } catch (parseError) {
          // Continue if parsing fails
        }
      }

      // Alternative: Look for graph data
      const graphMatch = content.match(/date_versus_rating\s*=\s*({[\s\S]*?})\s*;/);
      if (graphMatch && history.length === 0) {
        try {
          const graphData = JSON.parse(graphMatch[1]);
          Object.entries(graphData).forEach(([date, rating]) => {
            history.push({
              date,
              rating: parseInt(rating) || 0,
              contestName: 'Contest'
            });
          });
        } catch (parseError) {
          // Continue if parsing fails
        }
      }
    }

    // Sort by date
    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`✅ CodeChef rating history: ${username} - ${history.length} entries`);
    return { success: true, data: history };
  } catch (error) {
    console.error(`❌ CodeChef rating history error for ${username}:`, error.message);
    return { success: false, data: [] };
  }
};

module.exports = {
  fetchCodeChefStats,
  fetchCodeChefRatingHistory
};