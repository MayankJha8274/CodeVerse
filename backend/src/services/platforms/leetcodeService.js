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
    // Query to get current rating and contest history for max rating
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
        userContestRankingHistory(username: $username) {
          rating
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
      const contestRanking = response.data.data.userContestRanking;
      const contestHistory = response.data.data.userContestRankingHistory;
      
      const currentRating = Math.round(contestRanking?.rating || 0);
      
      // Calculate max rating from contest history
      let maxRating = currentRating;
      if (contestHistory && Array.isArray(contestHistory)) {
        contestHistory.forEach(entry => {
          if (entry && entry.rating) {
            maxRating = Math.max(maxRating, Math.round(entry.rating));
          }
        });
      } else if (contestHistory && typeof contestHistory === 'object' && contestHistory.rating) {
        // In case it returns a single object
        maxRating = Math.max(maxRating, Math.round(contestHistory.rating));
      }
      
      const stats = {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        ranking: matchedUser.profile?.ranking || 0,
        rating: currentRating,
        maxRating: maxRating,
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

      console.log(`✅ LeetCode: ${username} - ${stats.totalSolved} problems (E:${stats.easySolved}, M:${stats.mediumSolved}, H:${stats.hardSolved}), Rating: ${stats.rating}/${stats.maxRating}`);

      // Also fetch submission calendar and embed in stats
      try {
        const calendarResult = await fetchLeetCodeSubmissionCalendar(username);
        if (calendarResult.success) {
          stats.submissionCalendar = calendarResult.data;
          stats.leetcodeStreak = calendarResult.streak;
          stats.leetcodeActiveDays = calendarResult.totalActiveDays;
        }
      } catch (calErr) {
        console.warn(`⚠️ LeetCode calendar fetch failed during stats: ${calErr.message}`);
      }

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

/**
 * Fetch LeetCode contest rating history (real data)
 * @param {string} username - LeetCode username
 * @returns {Array} Rating history with dates
 */
const fetchLeetCodeRatingHistory = async (username) => {
  try {
    const query = `
      query userContestRankingHistory($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          trendDirection
          problemsSolved
          totalProblems
          finishTimeInSeconds
          contest {
            title
            startTime
          }
        }
      }
    `;

    const response = await axios.post(LEETCODE_API_ENDPOINT, {
      query,
      variables: { username }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const historyData = response.data?.data?.userContestRankingHistory;
    
    if (!historyData || !Array.isArray(historyData)) {
      return { success: false, data: [] };
    }

    // Filter only attended contests and transform data
    const history = historyData
      .filter(contest => contest.attended)
      .map(contest => ({
        date: new Date(contest.contest.startTime * 1000).toISOString().split('T')[0],
        rating: Math.round(contest.rating),
        contestName: contest.contest.title,
        rank: contest.ranking,
        problemsSolved: contest.problemsSolved,
        totalProblems: contest.totalProblems
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`✅ LeetCode rating history: ${username} - ${history.length} contests`);
    return { success: true, data: history };
  } catch (error) {
    console.error(`❌ LeetCode rating history error for ${username}:`, error.message);
    return { success: false, data: [] };
  }
};

/**
 * Fetch LeetCode topic-wise statistics (skill stats)
 * @param {string} username - LeetCode username
 * @returns {Object} Topic stats with counts
 */
const fetchLeetCodeSkillStats = async (username) => {
  try {
    const query = `
      query skillStats($username: String!) {
        matchedUser(username: $username) {
          tagProblemCounts {
            advanced {
              tagName
              tagSlug
              problemsSolved
            }
            intermediate {
              tagName
              tagSlug
              problemsSolved
            }
            fundamental {
              tagName
              tagSlug
              problemsSolved
            }
          }
        }
      }
    `;

    const response = await axios.post(LEETCODE_API_ENDPOINT, {
      query,
      variables: { username }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const tagCounts = response.data?.data?.matchedUser?.tagProblemCounts;
    
    if (!tagCounts) {
      return { success: false, data: [] };
    }

    // Combine all skill levels into one array
    const allTopics = [
      ...(tagCounts.fundamental || []),
      ...(tagCounts.intermediate || []),
      ...(tagCounts.advanced || [])
    ];

    // Aggregate by tag name (some topics might appear in multiple levels)
    const topicMap = {};
    allTopics.forEach(topic => {
      if (!topicMap[topic.tagName]) {
        topicMap[topic.tagName] = 0;
      }
      topicMap[topic.tagName] += topic.problemsSolved;
    });

    // Convert to array and sort by count
    const topics = Object.entries(topicMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    console.log(`✅ LeetCode skills: ${username} - ${topics.length} topics`);
    return { success: true, data: topics };
  } catch (error) {
    console.error(`❌ LeetCode skills error for ${username}:`, error.message);
    return { success: false, data: [] };
  }
};

/**
 * Fetch LeetCode badges and achievements
 * @param {string} username - LeetCode username
 * @returns {Object} Badges and achievements data
 */
const fetchLeetCodeBadges = async (username) => {
  try {
    const query = `
      query userBadges($username: String!) {
        matchedUser(username: $username) {
          badges {
            id
            displayName
            icon
            creationDate
          }
          upcomingBadges {
            name
            icon
          }
        }
      }
    `;

    const response = await axios.post(LEETCODE_API_ENDPOINT, {
      query,
      variables: { username }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const badgesData = response.data?.data?.matchedUser;
    
    if (!badgesData) {
      return { success: false, data: { badges: [], upcomingBadges: [] } };
    }

    const badges = (badgesData.badges || []).map(badge => ({
      id: badge.id,
      name: badge.displayName,
      icon: badge.icon,
      earnedDate: badge.creationDate
    }));

    const upcomingBadges = (badgesData.upcomingBadges || []).map(badge => ({
      name: badge.name,
      icon: badge.icon
    }));

    console.log(`✅ LeetCode badges: ${username} - ${badges.length} badges`);
    return { success: true, data: { badges, upcomingBadges } };
  } catch (error) {
    console.error(`❌ LeetCode badges error for ${username}:`, error.message);
    return { success: false, data: { badges: [], upcomingBadges: [] } };
  }
};

/**
 * Get LeetCode rank title based on rating
 * @param {number} rating - Contest rating
 * @returns {Object} Rank info with title and color
 */
const getLeetCodeRankTitle = (rating) => {
  if (!rating || rating === 0) return { title: 'Unrated', color: '#808080' };
  if (rating < 1400) return { title: 'Beginner', color: '#808080' };
  if (rating < 1600) return { title: 'Knight', color: '#2DB55D' };
  if (rating < 1800) return { title: 'Knight', color: '#2DB55D' };
  if (rating < 2000) return { title: 'Knight', color: '#2DB55D' };
  if (rating < 2200) return { title: 'Guardian', color: '#3366CC' };
  if (rating < 2400) return { title: 'Guardian', color: '#3366CC' };
  if (rating < 2600) return { title: 'Guardian', color: '#3366CC' };
  if (rating < 2850) return { title: 'Emperor', color: '#AB55FF' };
  return { title: 'Emperor', color: '#FF7F00' };
};

/**
 * Fetch all accepted submissions for a LeetCode user (to check solved problems)
 * @param {string} username - LeetCode username
 * @returns {Object} List of solved problem slugs/titles
 */
const fetchLeetCodeSolvedProblems = async (username) => {
  try {
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `;

    const response = await axios.post(LEETCODE_API_ENDPOINT, {
      query,
      variables: { username, limit: 500 }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const submissions = response.data?.data?.recentAcSubmissionList;
    
    if (!submissions || !Array.isArray(submissions)) {
      return { success: false, data: [] };
    }

    // Map submissions to unique solved problem titles and slugs
    const solvedMap = new Map();
    submissions.forEach(sub => {
      if (!solvedMap.has(sub.titleSlug)) {
        solvedMap.set(sub.titleSlug, {
          title: sub.title,
          titleSlug: sub.titleSlug,
          lastSolvedAt: new Date(sub.timestamp * 1000)
        });
      }
    });

    const solvedProblems = Array.from(solvedMap.values());
    console.log(`✅ LeetCode solved problems: ${username} - ${solvedProblems.length} unique problems`);
    return { success: true, data: solvedProblems };
  } catch (error) {
    console.error(`❌ LeetCode solved problems error for ${username}:`, error.message);
    return { success: false, data: [] };
  }
};

/**
 * Fetch today's submissions to check if a problem was solved today
 * @param {string} username - LeetCode username
 * @returns {Object} List of problems solved today
 */
const fetchLeetCodeTodaySubmissions = async (username) => {
  try {
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `;

    const response = await axios.post(LEETCODE_API_ENDPOINT, {
      query,
      variables: { username, limit: 50 }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const submissions = response.data?.data?.recentAcSubmissionList;
    
    if (!submissions || !Array.isArray(submissions)) {
      return { success: false, data: [] };
    }

    // Filter to only today's submissions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayProblems = submissions
      .filter(sub => {
        const subDate = new Date(sub.timestamp * 1000);
        return subDate >= today;
      })
      .map(sub => ({
        title: sub.title,
        titleSlug: sub.titleSlug,
        solvedAt: new Date(sub.timestamp * 1000)
      }));

    // Deduplicate by titleSlug
    const uniqueProblems = [...new Map(todayProblems.map(p => [p.titleSlug, p])).values()];
    
    console.log(`✅ LeetCode today's problems: ${username} - ${uniqueProblems.length} problems`);
    return { success: true, data: uniqueProblems };
  } catch (error) {
    console.error(`❌ LeetCode today's submissions error for ${username}:`, error.message);
    return { success: false, data: [] };
  }
};

/**
 * Fetch LeetCode submission calendar (daily submission counts for past year)
 * This powers the contribution heatmap
 * @param {string} username - LeetCode username
 * @returns {Object} submissionCalendar array of {date, count}
 */
const fetchLeetCodeSubmissionCalendar = async (username) => {
  try {
    // NOTE: Omitting 'year' parameter returns rolling 365-day window (not just current year)
    const query = `
      query userProfileCalendar($username: String!) {
        matchedUser(username: $username) {
          userCalendar {
            activeYears
            streak
            totalActiveDays
            submissionCalendar
          }
        }
      }
    `;

    const response = await axios.post(LEETCODE_API_ENDPOINT, {
      query,
      variables: { username }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': `${LEETCODE_PROFILE_URL}/${username}/`,
      },
      timeout: 15000
    });

    const calendarData = response.data?.data?.matchedUser?.userCalendar;
    
    if (!calendarData || !calendarData.submissionCalendar) {
      console.log(`⚠️ LeetCode calendar: No data for ${username}`);
      return { success: false, data: [], streak: 0, totalActiveDays: 0 };
    }

    // submissionCalendar is a JSON string: {"unix_timestamp": count, ...}
    const calendarJson = JSON.parse(calendarData.submissionCalendar);
    
    // Helper: local date string from Date object
    const toLocalDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    // Convert to array of {date, count} objects using LOCAL dates
    // (ensures consistency with the calendar display which uses local dates)
    const calendarArray = Object.entries(calendarJson).map(([timestamp, count]) => {
      const date = new Date(parseInt(timestamp) * 1000);
      return {
        date: toLocalDate(date),
        count: count
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate OUR OWN streak from calendar data (don't trust LeetCode's API streak)
    const todayLocal = toLocalDate(new Date());
    let calculatedCurrentStreak = 0;
    let calculatedMaxStreak = 0;
    let calculatedActiveDays = calendarArray.filter(d => d.count > 0).length;
    
    // Build a Set of active dates for O(1) lookup
    const activeDateSet = new Set(calendarArray.filter(d => d.count > 0).map(d => d.date));
    
    // Current streak: walk backwards from today/yesterday
    let checkDate = new Date();
    if (!activeDateSet.has(todayLocal)) {
      checkDate.setDate(checkDate.getDate() - 1); // Skip today if no activity
    }
    while (true) {
      const key = toLocalDate(checkDate);
      if (activeDateSet.has(key)) {
        calculatedCurrentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Max streak: walk through all dates in order, checking for gaps
    if (calendarArray.length > 0) {
      let tempStreak = 1;
      calculatedMaxStreak = 1;
      for (let i = 1; i < calendarArray.length; i++) {
        const prevDate = new Date(calendarArray[i-1].date + 'T00:00:00');
        const currDate = new Date(calendarArray[i].date + 'T00:00:00');
        const dayGap = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
        if (dayGap === 1 && calendarArray[i].count > 0) {
          tempStreak++;
          if (tempStreak > calculatedMaxStreak) calculatedMaxStreak = tempStreak;
        } else {
          tempStreak = calendarArray[i].count > 0 ? 1 : 0;
        }
      }
    }
    
    console.log(`✅ LeetCode calendar: ${username} - ${calendarArray.length} days, streak: ${calculatedCurrentStreak}/${calculatedMaxStreak}, active: ${calculatedActiveDays} (API reported: streak=${calendarData.streak}, active=${calendarData.totalActiveDays})`);
    
    return { 
      success: true, 
      data: calendarArray,
      streak: calculatedCurrentStreak,
      maxStreak: calculatedMaxStreak,
      totalActiveDays: calculatedActiveDays,
      activeYears: calendarData.activeYears || [],
      leetcodeApiStreak: calendarData.streak || 0,
      leetcodeApiActiveDays: calendarData.totalActiveDays || 0
    };
  } catch (error) {
    console.error(`❌ LeetCode calendar error for ${username}:`, error.message);
    return { success: false, data: [], streak: 0, totalActiveDays: 0 };
  }
};

module.exports = {
  fetchLeetCodeStats,
  fetchLeetCodeRatingHistory,
  fetchLeetCodeSkillStats,
  fetchLeetCodeBadges,
  getLeetCodeRankTitle,
  fetchLeetCodeSolvedProblems,
  fetchLeetCodeTodaySubmissions,
  fetchLeetCodeSubmissionCalendar
};
