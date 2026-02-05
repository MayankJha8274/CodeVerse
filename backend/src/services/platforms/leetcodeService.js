const axios = require('axios');
const puppeteer = require('puppeteer');

/**
 * LeetCode Service with Puppeteer fallback
 * Tries GraphQL API first, falls back to web scraping
 */

const LEETCODE_API_ENDPOINT = 'https://leetcode.com/graphql';
const LEETCODE_PROFILE_URL = 'https://leetcode.com';

let browser = null;

/**
 * Get or create browser instance
 */
const getBrowser = async () => {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browser;
};

/**
 * Scrape LeetCode profile using Puppeteer
 */
const scrapeLeetCodeProfile = async (username) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(`${LEETCODE_PROFILE_URL}/${username}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the stats to load
    await page.waitForSelector('.text-label-1', { timeout: 10000 }).catch(() => {});
    
    // Extract stats from the page
    const stats = await page.evaluate(() => {
      const getText = (selector) => {
        const elem = document.querySelector(selector);
        return elem ? elem.innerText.trim() : '0';
      };
      
      const getNumber = (selector) => {
        const text = getText(selector);
        return parseInt(text.replace(/,/g, '')) || 0;
      };
      
      // Try to find problem counts
      const solvedElements = document.querySelectorAll('.text-label-1');
      let totalSolved = 0;
      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;
      
      // Parse the solved problems section
      const problemText = document.body.innerText;
      const easyMatch = problemText.match(/Easy\s*(\d+)/);
      const mediumMatch = problemText.match(/Medium\s*(\d+)/);
      const hardMatch = problemText.match(/Hard\s*(\d+)/);
      
      if (easyMatch) easySolved = parseInt(easyMatch[1]) || 0;
      if (mediumMatch) mediumSolved = parseInt(mediumMatch[1]) || 0;
      if (hardMatch) hardSolved = parseInt(hardMatch[1]) || 0;
      
      totalSolved = easySolved + mediumSolved + hardSolved;
      
      return {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        ranking: 0,
        rating: 0,
        contestsParticipated: 0
      };
    });
    
    await page.close();
    return stats;
    
  } catch (error) {
    await page.close().catch(() => {});
    throw error;
  }
};

/**
 * Fetch LeetCode user statistics
 * @param {string} username - LeetCode username
 * @returns {Object} User stats
 */
const fetchLeetCodeStats = async (username) => {
  try {
    // Fixed GraphQL query - userContestRanking is a separate top-level query
    const query = `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          globalRanking
          topPercentage
        }
      }
    `;

    const response = await axios.post(
      LEETCODE_API_ENDPOINT,
      {
        query,
        variables: { username }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': `${LEETCODE_PROFILE_URL}/${username}/`,
        },
        timeout: 15000
      }
    );

    if (response.data?.data?.matchedUser?.submitStatsGlobal) {
      const matchedUser = response.data.data.matchedUser;
      const submissions = matchedUser.submitStatsGlobal.acSubmissionNum;
      const contestRanking = response.data.data.userContestRanking; // Separate from matchedUser
      
      const stats = {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        ranking: matchedUser.profile?.ranking || 0,
        rating: Math.round(contestRanking?.rating || 0),
        contestsParticipated: contestRanking?.attendedContestsCount || 0
      };

      submissions.forEach(sub => {
        const count = sub.count || 0;
        
        if (sub.difficulty === 'Easy') {
          stats.easySolved = count;
          stats.totalSolved += count;
        } else if (sub.difficulty === 'Medium') {
          stats.mediumSolved = count;
          stats.totalSolved += count;
        } else if (sub.difficulty === 'Hard') {
          stats.hardSolved = count;
          stats.totalSolved += count;
        }
        // Skip 'All' difficulty to avoid double counting
      });

      console.log(`✅ LeetCode: ${username} - ${stats.totalSolved} problems (E:${stats.easySolved}, M:${stats.mediumSolved}, H:${stats.hardSolved}), Rating: ${stats.rating}`);

      return {
        success: true,
        platform: 'leetcode',
        username,
        stats,
        lastFetched: new Date()
      };
    }
    
    throw new Error('API response invalid');

  } catch (apiError) {
    console.log(`⚠️ LeetCode API failed for ${username}: ${apiError.message}, trying web scraping...`);
    
    // Fallback to Puppeteer scraping
    try {
      const stats = await scrapeLeetCodeProfile(username);
      console.log(`✅ LeetCode (scrape): ${username} - ${stats.totalSolved} problems`);
      
      return {
        success: true,
        platform: 'leetcode',
        username,
        stats,
        lastFetched: new Date()
      };
      
    } catch (scrapeError) {
      console.error(`❌ LeetCode scraping failed for ${username}:`, scrapeError.message);
      return {
        success: false,
        platform: 'leetcode',
        username,
        error: 'Unable to fetch LeetCode stats. Please check username.',
        stats: null
      };
    }
  }
};

module.exports = {
  fetchLeetCodeStats
};
