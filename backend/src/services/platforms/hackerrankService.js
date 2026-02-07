const axios = require('axios');
const cheerio = require('cheerio');

/**
 * HackerRank Service with axios + cheerio
 * HackerRank has a public API that can be used for some data
 */

/**
 * Fetch HackerRank user statistics
 * @param {string} username - HackerRank username
 * @returns {Object} User stats
 */
const fetchHackerRankStats = async (username) => {
  try {
    // Try HackerRank API first
    let badges = [];
    let submissions = [];
    let profileData = null;
    
    // Fetch badges
    try {
      const badgesRes = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      if (badgesRes.data?.models) {
        badges = badgesRes.data.models;
      }
    } catch (e) {}
    
    // Fetch submissions
    let submissionCalendar = [];
    try {
      const subsRes = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/submission_histories`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      if (subsRes.data && typeof subsRes.data === 'object') {
        // subsRes.data is { "YYYY-MM-DD": count, ... } or nested
        // Build calendar from the response
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);
        
        const processEntries = (obj) => {
          if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
              if (typeof value === 'number' && key.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Direct date:count mapping
                const d = new Date(key + 'T00:00:00');
                if (d >= oneYearAgo && d <= now && value > 0) {
                  submissionCalendar.push({ date: key, count: value });
                }
              } else if (typeof value === 'object' && value !== null) {
                // Nested object, recurse
                processEntries(value);
              }
            });
          }
        };
        processEntries(subsRes.data);
        submissionCalendar.sort((a, b) => a.date.localeCompare(b.date));
        submissions = Object.values(subsRes.data).flat();
        console.log(`✅ HackerRank calendar: ${submissionCalendar.length} active days extracted`);
      }
    } catch (e) {}
    
    // Fetch profile page for more data
    try {
      const profileRes = await axios.get(`https://www.hackerrank.com/profile/${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(profileRes.data);
      const pageText = $('body').text();
      
      // Try to extract problems solved from page
      const problemMatch = pageText.match(/(\d+)\s*problems?\s*solved/i) ||
                           pageText.match(/solved[:\s]*(\d+)/i);
      if (problemMatch) {
        profileData = { problemsSolved: parseInt(problemMatch[1]) || 0 };
      }
      
      // Try to extract score
      const scoreMatch = pageText.match(/score[:\s]*(\d+)/i) ||
                         pageText.match(/points[:\s]*(\d+)/i);
      if (scoreMatch && profileData) {
        profileData.score = parseInt(scoreMatch[1]) || 0;
      }
    } catch (e) {}
    
    // Calculate total submissions
    const totalSubmissions = submissions.length;
    const uniqueProblems = new Set(submissions.map(s => s.challenge_id || s)).size;
    
    const stats = {
      totalScore: profileData?.score || 0,
      problemsSolved: profileData?.problemsSolved || uniqueProblems || 0,
      totalSolved: profileData?.problemsSolved || uniqueProblems || 0,
      badges: badges.length,
      totalSubmissions,
      rank: 0,
      submissionCalendar: submissionCalendar.length > 0 ? submissionCalendar : null
    };

    console.log(`✅ HackerRank: ${username} - ${stats.problemsSolved} problems, ${stats.badges} badges`);

    return {
      success: true,
      platform: 'hackerrank',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`❌ HackerRank Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'hackerrank',
      username,
      error: 'Unable to fetch HackerRank stats. Profile may be private.',
      stats: null
    };
  }
};

module.exports = {
  fetchHackerRankStats
};
