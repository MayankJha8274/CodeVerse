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

    if (submissionsResponse.data.status === 'OK') {
      const submissions = submissionsResponse.data.result;
      totalSubmissions = submissions.length;

      // Count unique accepted problems
      submissions.forEach(submission => {
        if (submission.verdict === 'OK' && submission.problem) {
          // Create unique problem ID
          const problemId = `${submission.problem.contestId || 'gym'}-${submission.problem.index}`;
          acceptedProblems.add(problemId);
        }
      });
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

    const stats = {
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || 'unrated',
      maxRank: user.maxRank || 'unrated',
      problemsSolved: acceptedProblems.size,
      totalSubmissions,
      contestsParticipated,
      friendsCount: user.friendOfCount || 0
    };

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

module.exports = {
  fetchCodeforcesStats,
  fetchCodeforcesRatingHistory
};
