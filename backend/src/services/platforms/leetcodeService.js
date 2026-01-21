const axios = require('axios');

/**
 * LeetCode API Service
 * Fetches user stats from LeetCode GraphQL API
 */

const LEETCODE_API_ENDPOINT = 'https://leetcode.com/graphql';
const LEETCODE_PROFILE_URL = 'https://leetcode.com';

/**
 * Fetch LeetCode user statistics
 * @param {string} username - LeetCode username
 * @returns {Object} User stats
 */
const fetchLeetCodeStats = async (username) => {
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            userAvatar
            realName
            aboutMe
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
          userContestRanking {
            rating
            globalRanking
            topPercentage
            attendedContestsCount
          }
        }
        recentAcSubmissionList(username: $username, limit: 15) {
          title
          timestamp
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
          'Referer': LEETCODE_PROFILE_URL
        },
        timeout: 10000
      }
    );

    if (!response.data || !response.data.data || !response.data.data.matchedUser) {
      throw new Error('User not found on LeetCode');
    }

    const userData = response.data.data.matchedUser;
    const submissions = userData.submitStats.acSubmissionNum;

    // Parse submission counts
    const stats = {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: userData.profile?.ranking || 0,
      rating: userData.userContestRanking?.rating || 0,
      contestsParticipated: userData.userContestRanking?.attendedContestsCount || 0,
      globalRank: userData.userContestRanking?.globalRanking || 0
    };

    submissions.forEach(sub => {
      if (sub.difficulty === 'All') stats.totalSolved = sub.count;
      if (sub.difficulty === 'Easy') stats.easySolved = sub.count;
      if (sub.difficulty === 'Medium') stats.mediumSolved = sub.count;
      if (sub.difficulty === 'Hard') stats.hardSolved = sub.count;
    });

    return {
      success: true,
      platform: 'leetcode',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`LeetCode API Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'leetcode',
      username,
      error: error.message,
      stats: null
    };
  }
};

module.exports = {
  fetchLeetCodeStats
};
