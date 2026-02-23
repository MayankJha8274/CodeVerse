const axios = require('axios');

/**
 * Codeforces API Service
 * Fetches user stats from Codeforces public API
 */

const CODEFORCES_API = 'https://codeforces.com/api';

/**
 * Fetch Codeforces user statistics
 * @param {string} handle - Codeforces handle
 * @returns {Object} User stats
 */
const fetchCodeforcesStats = async (handle) => {
  try {
    // Fetch user info
    const userResponse = await axios.get(`${CODEFORCES_API}/user.info`, {
      params: { handles: handle },
      timeout: 15000
    });

    if (userResponse.data.status !== 'OK') {
      throw new Error('User not found on Codeforces');
    }

    const user = userResponse.data.result[0];

    // Fetch ALL user submissions (increase count to get more)
    const submissionsResponse = await axios.get(`${CODEFORCES_API}/user.status`, {
      params: { handle, from: 1, count: 10000 },
      timeout: 15000
    });

    let acceptedProblems = new Set();
    let totalSubmissions = 0;
    let submissionCalendar = [];

    if (submissionsResponse.data.status === 'OK') {
      const submissions = submissionsResponse.data.result;
      totalSubmissions = submissions.length;

      // Count unique accepted problems + extract topics
      const topicMap = {};
      const solvedSet = new Set();
      submissions.forEach(submission => {
        if (submission.verdict === 'OK' && submission.problem) {
          // Create unique problem ID
          const problemId = `${submission.problem.contestId || 'gym'}-${submission.problem.index}`;
          acceptedProblems.add(problemId);

          // Extract topic tags from unique solved problems
          if (!solvedSet.has(problemId)) {
            solvedSet.add(problemId);
            (submission.problem.tags || []).forEach(tag => {
              const formattedTag = tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              topicMap[formattedTag] = (topicMap[formattedTag] || 0) + 1;
            });
          }
        }
      });

      // Build submission calendar (daily submission counts for last 365 days)
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      oneYearAgo.setHours(0, 0, 0, 0);
      
      const dailyCounts = {};
      submissions.forEach(submission => {
        if (submission.verdict === 'OK' && submission.creationTimeSeconds) {
          const date = new Date(submission.creationTimeSeconds * 1000);
          if (date >= oneYearAgo) {
            const dateKey = date.toISOString().split('T')[0];
            dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
          }
        }
      });
      
      submissionCalendar = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // Fetch contest participation
    let contestsParticipated = 0;
    try {
      const ratingResponse = await axios.get(`${CODEFORCES_API}/user.rating`, {
        params: { handle },
        timeout: 10000
      });

      if (ratingResponse.data.status === 'OK') {
        contestsParticipated = ratingResponse.data.result.length;
      }
    } catch (ratingError) {
      console.warn(`⚠️ Codeforces rating API failed for ${handle}, using 0 contests`);
    }

    // Build sorted topics array from tag map
    const topics = Object.entries(topicMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const stats = {
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || 'unrated',
      maxRank: user.maxRank || 'unrated',
      problemsSolved: acceptedProblems.size,
      totalSubmissions,
      contestsParticipated,
      friendsCount: user.friendOfCount || 0,
      submissionCalendar,
      topics
    };

    if (topics.length > 0) {
      console.log(`✅ Codeforces topics: ${handle} - ${topics.length} topics`);
    }

    console.log(`✅ Codeforces: ${handle} - ${stats.problemsSolved} problems, Rating: ${stats.rating} (${stats.rank})`);

    return {
      success: true,
      platform: 'codeforces',
      username: handle,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`❌ Codeforces API Error for ${handle}:`, error.message);
    return {
      success: false,
      platform: 'codeforces',
      username: handle,
      error: error.response?.data?.comment || error.message,
      stats: null
    };
  }
};

/**
 * Fetch Codeforces rating history (real data from API)
 * @param {string} handle - Codeforces handle
 * @returns {Array} Rating history with dates
 */
const fetchCodeforcesRatingHistory = async (handle) => {
  try {
    const response = await axios.get(`${CODEFORCES_API}/user.rating`, {
      params: { handle },
      timeout: 15000
    });

    if (response.data.status !== 'OK') {
      throw new Error('Could not fetch rating history');
    }

    // Transform to chart-friendly format
    const history = response.data.result.map(contest => ({
      date: new Date(contest.ratingUpdateTimeSeconds * 1000).toISOString().split('T')[0],
      rating: contest.newRating,
      contestName: contest.contestName,
      rank: contest.rank,
      oldRating: contest.oldRating,
      change: contest.newRating - contest.oldRating
    }));

    console.log(`✅ Codeforces rating history: ${handle} - ${history.length} contests`);
    return { success: true, data: history };
  } catch (error) {
    console.error(`❌ Codeforces rating history error for ${handle}:`, error.message);
    return { success: false, data: [] };
  }
};

/**
 * Fetch Codeforces topic-wise statistics from solved problems
 * @param {string} handle - Codeforces handle
 * @returns {Object} Topic stats with counts
 */
const fetchCodeforcesTopicStats = async (handle) => {
  try {
    const submissionsResponse = await axios.get(`${CODEFORCES_API}/user.status`, {
      params: { handle, from: 1, count: 10000 },
      timeout: 15000
    });

    if (submissionsResponse.data.status !== 'OK') {
      return { success: false, data: [] };
    }

    const submissions = submissionsResponse.data.result;
    const topicMap = {};
    const solvedProblems = new Set();

    submissions.forEach(submission => {
      if (submission.verdict === 'OK' && submission.problem) {
        const problemId = `${submission.problem.contestId || 'gym'}-${submission.problem.index}`;
        
        // Only count unique solved problems
        if (!solvedProblems.has(problemId)) {
          solvedProblems.add(problemId);
          
          // Count tags
          const tags = submission.problem.tags || [];
          tags.forEach(tag => {
            const formattedTag = tag.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            topicMap[formattedTag] = (topicMap[formattedTag] || 0) + 1;
          });
        }
      }
    });

    const topics = Object.entries(topicMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    console.log(`✅ Codeforces topics: ${handle} - ${topics.length} topics`);
    return { success: true, data: topics };
  } catch (error) {
    console.error(`❌ Codeforces topics error for ${handle}:`, error.message);
    return { success: false, data: [] };
  }
};

/**
 * Get Codeforces rank info with color
 * @param {string} rank - Codeforces rank string
 * @param {number} rating - User rating
 * @returns {Object} Rank info with color
 */
const getCodeforcesRankInfo = (rank, rating) => {
  const rankColors = {
    'newbie': '#808080',
    'pupil': '#008000',
    'specialist': '#03A89E',
    'expert': '#0000FF',
    'candidate master': '#AA00AA',
    'master': '#FF8C00',
    'international master': '#FF8C00',
    'grandmaster': '#FF0000',
    'international grandmaster': '#FF0000',
    'legendary grandmaster': '#FF0000',
    'unrated': '#000000'
  };

  const displayRank = rank ? rank.charAt(0).toUpperCase() + rank.slice(1) : 'Unrated';
  const color = rankColors[rank?.toLowerCase()] || '#808080';

  return {
    title: displayRank,
    color,
    rating: rating || 0
  };
};

/**
 * Fetch list of solved problems with their names from Codeforces
 * @param {string} handle - Codeforces handle
 * @returns {Object} List of solved problem names
 */
const fetchCodeforcesSolvedProblems = async (handle) => {
  try {
    const response = await axios.get(`${CODEFORCES_API}/user.status`, {
      params: { handle, from: 1, count: 10000 },
      timeout: 15000
    });

    if (response.data.status !== 'OK') {
      return { success: false, data: [] };
    }

    const submissions = response.data.result;
    const solvedMap = new Map();

    submissions.forEach(submission => {
      if (submission.verdict === 'OK' && submission.problem) {
        const problemId = `${submission.problem.contestId || 'gym'}-${submission.problem.index}`;
        if (!solvedMap.has(problemId)) {
          solvedMap.set(problemId, {
            name: submission.problem.name,
            problemId,
            contestId: submission.problem.contestId,
            index: submission.problem.index,
            rating: submission.problem.rating,
            tags: submission.problem.tags,
            lastSolvedAt: new Date(submission.creationTimeSeconds * 1000)
          });
        }
      }
    });

    const solvedProblems = Array.from(solvedMap.values());
    console.log(`✅ Codeforces solved problems: ${handle} - ${solvedProblems.length} problems`);
    return { success: true, data: solvedProblems };
  } catch (error) {
    console.error(`❌ Codeforces solved problems error for ${handle}:`, error.message);
    return { success: false, data: [] };
  }
};

/**
 * Fetch today's submissions from Codeforces
 * @param {string} handle - Codeforces handle
 * @returns {Object} List of problems solved today
 */
const fetchCodeforcesTodaySubmissions = async (handle) => {
  try {
    const response = await axios.get(`${CODEFORCES_API}/user.status`, {
      params: { handle, from: 1, count: 100 },
      timeout: 15000
    });

    if (response.data.status !== 'OK') {
      return { success: false, data: [] };
    }

    const submissions = response.data.result;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayProblems = [];
    const seen = new Set();

    submissions.forEach(submission => {
      if (submission.verdict === 'OK' && submission.problem) {
        const subDate = new Date(submission.creationTimeSeconds * 1000);
        if (subDate >= today) {
          const problemId = `${submission.problem.contestId || 'gym'}-${submission.problem.index}`;
          if (!seen.has(problemId)) {
            seen.add(problemId);
            todayProblems.push({
              name: submission.problem.name,
              problemId,
              solvedAt: subDate
            });
          }
        }
      }
    });

    console.log(`✅ Codeforces today's problems: ${handle} - ${todayProblems.length} problems`);
    return { success: true, data: todayProblems };
  } catch (error) {
    console.error(`❌ Codeforces today's submissions error for ${handle}:`, error.message);
    return { success: false, data: [] };
  }
};

module.exports = {
  fetchCodeforcesStats,
  fetchCodeforcesRatingHistory,
  fetchCodeforcesTopicStats,
  getCodeforcesRankInfo,
  fetchCodeforcesSolvedProblems,
  fetchCodeforcesTodaySubmissions
};
