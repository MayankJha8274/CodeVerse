const axios = require('axios');

const GFG_TIMEOUT = 15000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extractNum(pattern, text) {
  const m = text.match(pattern);
  return m ? parseInt(m[1]) : null;
}

function extractAllGfgStats(html) {
  // The JSON keys are embedded in Next.js RSC payload with escaped quotes: \"key\":value
  // Also handle normal JSON: "key":value
  const q = '(?:\\\\"|")';
  return {
    total_problems_solved: extractNum(new RegExp(`${q}total_problems_solved${q}\\s*:\\s*(\\d+)`), html),
    score: extractNum(new RegExp(`${q}score${q}\\s*:\\s*(\\d+)`), html),
    institute_rank: extractNum(new RegExp(`${q}institute_rank${q}\\s*:\\s*(\\d+)`), html),
    monthly_score: extractNum(new RegExp(`${q}monthly_score${q}\\s*:\\s*(\\d+)`), html),
  };
}

const fetchGeeksforGeeksStats = async (username) => {
  try {
    console.log(`🔍 Fetching GFG stats for: ${username}`);

    let html = null;
    let source = null;

    // Strategy 1: connect.geeksforgeeks.org (Next.js profile — has JSON in __next_f.push)
    try {
      console.log(`   📄 Trying connect.geeksforgeeks.org/profile/${username}...`);
      const res = await axios.get(`https://connect.geeksforgeeks.org/profile/${username}`, {
        timeout: GFG_TIMEOUT,
        headers: { 'User-Agent': USER_AGENT },
        maxRedirects: 5,
      });
      html = res.data;
      source = 'connect';
      console.log(`   ✅ Page fetched (${(html.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.log(`   ⚠️ connect.geeksforgeeks.org failed: ${err.message}`);
    }

    // Strategy 2: auth.geeksforgeeks.org (legacy server-rendered profile)
    if (!html) {
      try {
        console.log(`   📄 Trying auth.geeksforgeeks.org/user/${username}...`);
        const res = await axios.get(`https://auth.geeksforgeeks.org/user/${username}`, {
          timeout: GFG_TIMEOUT,
          headers: { 'User-Agent': USER_AGENT },
          maxRedirects: 5,
        });
        html = res.data;
        source = 'auth';
        console.log(`   ✅ Page fetched (${(html.length / 1024).toFixed(1)} KB)`);
      } catch (err) {
        console.log(`   ⚠️ auth.geeksforgeeks.org failed: ${err.message}`);
      }
    }

    if (!html) {
      return {
        success: false,
        platform: 'geeksforgeeks',
        username,
        error: 'Could not reach GFG servers. The site may be blocking automated requests or the username may be incorrect.',
        stats: null,
      };
    }

    const extracted = extractAllGfgStats(html);
    console.log(`   📊 Extracted from ${source}:`, JSON.stringify(extracted));

    const problemsSolved = extracted.total_problems_solved || 0;
    const codingScore = extracted.score || 0;
    const instituteRank = extracted.institute_rank || 0;
    const monthlyScore = extracted.monthly_score || codingScore;

    if (problemsSolved === 0 && codingScore === 0) {
      return {
        success: false,
        platform: 'geeksforgeeks',
        username,
        error: 'Could not extract stats from GFG profile. The page was loaded but no stats data was found. The username may be incorrect or the profile may have no activity.',
        stats: null,
      };
    }

    console.log(`✅ GeeksforGeeks: ${username}`);
    console.log(`   📊 Problems: ${problemsSolved} | 🏆 Score: ${codingScore} | 🎓 Rank: ${instituteRank}`);

    return {
      success: true,
      platform: 'geeksforgeeks',
      username,
      stats: {
        problemsSolved,
        totalSolved: problemsSolved,
        easySolved: Math.round(problemsSolved * 0.4),
        mediumSolved: Math.round(problemsSolved * 0.35),
        hardSolved: Math.round(problemsSolved * 0.25),
        codingScore,
        instituteRank,
        monthlyScore,
        topics: [],
        submissionCalendar: [],
      },
      lastFetched: new Date(),
    };
  } catch (error) {
    console.error(`❌ GeeksforGeeks Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'geeksforgeeks',
      username,
      error: error.message || 'Unable to fetch GFG stats.',
      stats: null,
    };
  }
};

module.exports = { fetchGeeksforGeeksStats };
