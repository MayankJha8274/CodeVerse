const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');

let _gfgBrowser = null;

const getGfgBrowser = async () => {
  try {
    if (_gfgBrowser && _gfgBrowser.connected) {
      return _gfgBrowser;
    }

    _gfgBrowser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    _gfgBrowser.on('disconnected', () => {
      _gfgBrowser = null;
    });

    return _gfgBrowser;
  } catch (err) {
    console.error('❌ Failed to launch GFG browser:', err.message);
    _gfgBrowser = null;
    throw err;
  }
};

/**
 * Fetch stats from GeeksforGeeks
 * @param {string} username - GFG username
 * @returns {Object} GFG stats
 */
const fetchGeeksforGeeksStats = async (username) => {
  // 1. Sanitize username
  const sanitizedUsername = username.startsWith('@') ? username.substring(1) : username;
  let page = null;
  
  try {
    console.log(`🔍 Fetching GFG via Puppeteer for: ${sanitizedUsername}`);
    const browser = await getGfgBrowser();
    page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    let problemsSolved = 0;
    let codingScore = 0;
    let instituteRank = 0;
    let apiCaptured = false;

    // Listen for API responses - this is the most reliable way to get GFG data
    page.on('response', async (response) => {
      const url = response.url();
      try {
        if (url.includes('practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions')) {
          const json = await response.json();
          if (json.result) {
            const result = json.result;
            const solved = (result.easy || 0) + (result.medium || 0) + (result.hard || 0) + (result.school || 0) + (result.basic || 0);
            if (solved > 0) {
              problemsSolved = solved;
              apiCaptured = true;
            }
          }
        } else if (url.includes('utilapi.geeksforgeeks.org/api/user/profile')) {
          const json = await response.json();
          if (json.score !== undefined) {
            codingScore = json.score;
            apiCaptured = true;
          }
          if (json.instituteRank !== undefined) instituteRank = json.instituteRank;
        }
      } catch (e) {
        // Silent fail for API parsing
      }
    });

    // Load profile page
    const profileUrl = `https://www.geeksforgeeks.org/user/${sanitizedUsername}?tab=practice`;
    await page.goto(profileUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    // Wait for dynamic content to load (GFG is slow)
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Fallback 1: If API capture didn't get everything, try regex on the raw HTML
    // GFG changed to Next.js, so state is embedded in script tags as escaped JSON strings
    if (problemsSolved === 0 || codingScore === 0) {
      const html = await page.content();
      const scoreMatch = html.match(/\\?"score\\?"\s*:\s*(\d+)/);
      const solvedMatch = html.match(/\\?"total_problems_solved\\?"\s*:\s*(\d+)/);
      const rankMatch = html.match(/\\?"institute_rank\\?"\s*:\s*(\d+)/);
      
      if (scoreMatch) codingScore = parseInt(scoreMatch[1], 10);
      if (solvedMatch) problemsSolved = parseInt(solvedMatch[1], 10);
      if (rankMatch) instituteRank = parseInt(rankMatch[1], 10);
    }

    // Fallback 2: Old DOM scraping (in case they revert)
    if (problemsSolved === 0 || codingScore === 0) {
      const domStats = await page.evaluate(() => {
        const stats = { problemsSolved: 0, codingScore: 0, instituteRank: 0 };
        const scoreCards = document.querySelectorAll('.scoreCard_head_left--score__3_B0q');
        scoreCards.forEach(el => {
          const label = el.innerText.toLowerCase();
          const value = parseInt(el.nextElementSibling?.innerText) || 0;
          if (label.includes('solved')) stats.problemsSolved = value;
          if (label.includes('score')) stats.codingScore = value;
          if (label.includes('rank')) stats.instituteRank = value;
        });
        return stats;
      });
      
      if (problemsSolved === 0) problemsSolved = domStats.problemsSolved;
      if (codingScore === 0) codingScore = domStats.codingScore;
      if (instituteRank === 0) instituteRank = domStats.instituteRank;
    }

    if (problemsSolved > 0 || codingScore > 0) {
      console.log(`✅ GFG Success: ${sanitizedUsername} (Solved: ${problemsSolved}, Score: ${codingScore})`);
      return {
        success: true,
        platform: 'geeksforgeeks',
        username: sanitizedUsername,
        stats: {
          problemsSolved,
          totalSolved: problemsSolved,
          codingScore,
          instituteRank,
          rating: codingScore,
          rank: instituteRank,
          topics: [],
          submissionCalendar: []
        },
        lastFetched: new Date()
      };
    }

    throw new Error(`No data found for GFG profile "${sanitizedUsername}". Is it private?`);
  } catch (error) {
    console.error(`❌ GFG Error for ${sanitizedUsername}:`, error.message);
    return {
      success: false,
      platform: 'geeksforgeeks',
      username: sanitizedUsername,
      error: error.message,
      stats: null
    };
  } finally {
    if (page) await page.close().catch(() => {});
  }
};

module.exports = {
  fetchGeeksforGeeksStats
};
