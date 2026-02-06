const axios = require('axios');
const Contest = require('../models/Contest');

/**
 * Fetch Codeforces contests
 */
const fetchCodeforcesContests = async () => {
  try {
    const response = await axios.get('https://codeforces.com/api/contest.list', {
      timeout: 15000
    });

    if (response.data.status !== 'OK') {
      throw new Error('Codeforces API error');
    }

    const now = new Date();
    const contests = response.data.result
      .filter(c => c.phase === 'BEFORE') // Only upcoming contests
      .slice(0, 20) // Limit to 20 upcoming
      .map(c => ({
        name: c.name,
        platform: 'codeforces',
        url: `https://codeforces.com/contest/${c.id}`,
        startTime: new Date(c.startTimeSeconds * 1000),
        endTime: new Date((c.startTimeSeconds + c.durationSeconds) * 1000),
        duration: Math.floor(c.durationSeconds / 60),
        contestId: `cf_${c.id}`
      }));

    console.log(`✅ Fetched ${contests.length} Codeforces contests`);
    return contests;
  } catch (error) {
    console.error('❌ Codeforces contests fetch error:', error.message);
    return [];
  }
};

/**
 * Fetch LeetCode contests
 */
const fetchLeetCodeContests = async () => {
  try {
    const query = `
      query {
        allContests {
          title
          titleSlug
          startTime
          duration
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const allContests = response.data?.data?.allContests || [];
    const now = new Date();

    const contests = allContests
      .filter(c => new Date(c.startTime * 1000) > now)
      .slice(0, 10)
      .map(c => ({
        name: c.title,
        platform: 'leetcode',
        url: `https://leetcode.com/contest/${c.titleSlug}`,
        startTime: new Date(c.startTime * 1000),
        endTime: new Date((c.startTime + c.duration) * 1000),
        duration: Math.floor(c.duration / 60),
        contestId: `lc_${c.titleSlug}`
      }));

    console.log(`✅ Fetched ${contests.length} LeetCode contests`);
    return contests;
  } catch (error) {
    console.error('❌ LeetCode contests fetch error:', error.message);
    return [];
  }
};

/**
 * Fetch CodeChef contests
 */
const fetchCodeChefContests = async () => {
  try {
    const response = await axios.get('https://www.codechef.com/api/list/contests/all', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const futureContests = response.data?.future_contests || [];
    const presentContests = response.data?.present_contests || [];

    const contests = [...futureContests, ...presentContests].map(c => {
      const startTime = new Date(c.contest_start_date_iso || c.contest_start_date);
      const endTime = new Date(c.contest_end_date_iso || c.contest_end_date);
      const duration = Math.floor((endTime - startTime) / (1000 * 60));

      return {
        name: c.contest_name,
        platform: 'codechef',
        url: `https://www.codechef.com/${c.contest_code}`,
        startTime,
        endTime,
        duration,
        contestId: `cc_${c.contest_code}`
      };
    });

    console.log(`✅ Fetched ${contests.length} CodeChef contests`);
    return contests;
  } catch (error) {
    console.error('❌ CodeChef contests fetch error:', error.message);
    return [];
  }
};

/**
 * Fetch AtCoder contests
 */
const fetchAtCoderContests = async () => {
  try {
    // Use a public API for AtCoder contests
    const response = await axios.get('https://kenkoooo.com/atcoder/resources/contests.json', {
      timeout: 15000
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const contests = response.data
      .filter(c => {
        const startTime = new Date(c.start_epoch_second * 1000);
        return startTime > now && startTime < thirtyDaysFromNow;
      })
      .slice(0, 15)
      .map(c => ({
        name: c.title,
        platform: 'atcoder',
        url: `https://atcoder.jp/contests/${c.id}`,
        startTime: new Date(c.start_epoch_second * 1000),
        endTime: new Date((c.start_epoch_second + c.duration_second) * 1000),
        duration: Math.floor(c.duration_second / 60),
        contestId: `ac_${c.id}`
      }));

    console.log(`✅ Fetched ${contests.length} AtCoder contests`);
    return contests;
  } catch (error) {
    console.error('❌ AtCoder contests fetch error:', error.message);
    return [];
  }
};

/**
 * Fetch all contests from all platforms
 */
const fetchAllContests = async () => {
  try {
    const [codeforces, leetcode, codechef, atcoder] = await Promise.all([
      fetchCodeforcesContests(),
      fetchLeetCodeContests(),
      fetchCodeChefContests(),
      fetchAtCoderContests()
    ]);

    const allContests = [...codeforces, ...leetcode, ...codechef, ...atcoder];

    // Save to database (upsert)
    for (const contest of allContests) {
      try {
        await Contest.findOneAndUpdate(
          { contestId: contest.contestId, platform: contest.platform },
          contest,
          { upsert: true, new: true }
        );
      } catch (err) {
        // Ignore duplicate key errors
        if (err.code !== 11000) {
          console.error(`Error saving contest ${contest.name}:`, err.message);
        }
      }
    }

    console.log(`✅ Total ${allContests.length} contests fetched and saved`);
    return allContests;
  } catch (error) {
    console.error('❌ Error fetching all contests:', error.message);
    return [];
  }
};

/**
 * Get upcoming contests from database
 */
const getUpcomingContests = async (platform = null, limit = 50) => {
  const query = { startTime: { $gt: new Date() } };
  if (platform && platform !== 'all') {
    query.platform = platform;
  }

  const contests = await Contest.find(query)
    .sort({ startTime: 1 })
    .limit(limit);

  return contests;
};

module.exports = {
  fetchCodeforcesContests,
  fetchLeetCodeContests,
  fetchCodeChefContests,
  fetchAtCoderContests,
  fetchAllContests,
  getUpcomingContests
};
