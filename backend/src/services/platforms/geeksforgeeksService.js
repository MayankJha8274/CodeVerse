const puppeteer = require('puppeteer');

let _gfgBrowser = null;
const getGfgBrowser = async () => {
  if (!_gfgBrowser) {
    _gfgBrowser = await puppeteer.launch({ 
      headless: true, 
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ] 
    });
  }
  return _gfgBrowser;
};

/**
 * GeeksforGeeks Service - Pure Puppeteer approach
 * GFG loads all data dynamically via JavaScript/API, so we need browser rendering
 */

/**
 * Fetch GeeksforGeeks user statistics via Puppeteer
 * @param {string} username - GFG username
 * @returns {Object} User stats with problemsSolved, codingScore, instituteRank
 */
const fetchGeeksforGeeksStats = async (username) => {
  let page = null;
  try {
    console.log(`🔍 Fetching GFG stats for: ${username}`);
    
    const browser = await getGfgBrowser();
    page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Intercept API responses to capture user data
    const apiData = {};
    await page.on('response', async (response) => {
      try {
        const url = response.url();
        // GFG loads user data from API endpoints
        if (url.includes('/api/') && 
            (url.includes('user') || url.includes('profile') || url.includes('submissions'))) {
          const text = await response.text();
          apiData[url] = text;
          console.log(`📡 Captured API response from: ${url.substring(0, 80)}...`);
        }
      } catch (e) {
        // Ignore errors from reading response bodies
      }
    });
    
    // Navigate to profile page (use www.geeksforgeeks.org/profile for best data)
    // Adding ?tab=practice ensures we get the problems data
    let url = `https://www.geeksforgeeks.org/profile/${username}?tab=practice`;
    console.log(`📄 Loading: ${url}`);
    
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
    } catch (e) {
      console.log(`   ❌ Error loading profile: ${e.message}`);
      throw e;
    }
    
    // Wait for dynamic content to load (GFG loads data via JavaScript/API)
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Take screenshot for debugging (optional, can be removed in production)
    // try {
    //   await page.screenshot({ path: 'gfg-debug.png', fullPage: false });
    // } catch (e) {
    //   // Ignore screenshot errors
    // }
    
    // Extract all data from the rendered page
    const data = await page.evaluate(() => {
      const html = document.body.innerHTML || '';
      const text = document.body.innerText || '';
      
      // Method 1: Extract from JSON embedded in HTML
      const jsonData = {
        score: null,
        totalProblemsSolved: null,
        instituteRank: null,
        monthlyScore: null
      };
      
      // Extract from JSON in HTML
      const scoreMatch = html.match(/"score"\s*:\s*(\d+)/);
      if (scoreMatch) jsonData.score = parseInt(scoreMatch[1]);
      
      const totalSolvedMatch = html.match(/"total_problems_solved"\s*:\s*(\d+)/);
      if (totalSolvedMatch) jsonData.totalProblemsSolved = parseInt(totalSolvedMatch[1]);
      
      const instituteRankMatch = html.match(/"institute_rank"\s*:\s*(\d+)/);
      if (instituteRankMatch) jsonData.instituteRank = parseInt(instituteRankMatch[1]);
      
      const monthlyScoreMatch = html.match(/"monthly_score"\s*:\s*(\d+)/);
      if (monthlyScoreMatch) jsonData.monthlyScore = parseInt(monthlyScoreMatch[1]);
      
      // Method 2: Look for profile stat cards (GFG uses specific structure)
      const profileStats = {
        score: null,
        problemsSolved: null,
        instituteRank: null
      };
      
      // GFG profile has stat cards - look for all numeric values with context
      const statContainers = [
        ...document.querySelectorAll('[class*="profile"]'),
        ...document.querySelectorAll('[class*="stat"]'),
        ...document.querySelectorAll('[class*="score"]'),
        ...document.querySelectorAll('[class*="education"]'),
        ...document.querySelectorAll('[class*="rank"]')
      ];
      
      const foundStats = [];
      statContainers.forEach((el) => {
        const fullText = el.textContent || '';
        // Look for numbers followed by or preceded by keywords
        const matches = fullText.matchAll(/(\d+)\s*(problem|solve|score|rank|total)|(\bproblem|\bsolve|\bscore|\brank|\btotal)\s*[:\-]?\s*(\d+)/gi);
        for (const match of matches) {
          const num = parseInt(match[1] || match[4]);
          const keyword = (match[2] || match[3] || '').toLowerCase();
          if (!isNaN(num) && num > 0) {
            foundStats.push({ value: num, keyword, text: fullText.substring(0, 100) });
          }
        }
      });
      
      // Analyze found stats
      foundStats.forEach(stat => {
        if (!profileStats.problemsSolved && (stat.keyword.includes('problem') || stat.keyword.includes('solve') || (stat.keyword.includes('total') && !stat.keyword.includes('score')))) {
          profileStats.problemsSolved = stat.value;
        }
        if (!profileStats.score && stat.keyword.includes('score')) {
          profileStats.score = stat.value;
        }
        if (!profileStats.instituteRank && stat.keyword.includes('rank')) {
          profileStats.instituteRank = stat.value;
        }
      });
      
      // Also look for "XXX problems solved" text pattern anywhere on the page
      const problemsTextMatch = text.match(/(\d+)\s+(?:problems?|total)\s+solved/i);
      if (problemsTextMatch && !profileStats.problemsSolved) {
        profileStats.problemsSolved = parseInt(problemsTextMatch[1]);
      }
      
      // Method 3: Text extraction with better context matching
      const textStats = {
        problemsSolved: null,
        codingScore: null,
        instituteRank: null
      };
      
      // Split into lines and analyze each
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        const nextLine = lines[i + 1] ? lines[i + 1].toLowerCase() : '';
        const prevLine = lines[i - 1] ? lines[i - 1].toLowerCase() : '';
        
        // Check if line contains a number
        const numMatch = line.match(/^(\d+)$/) || line.match(/(\d+)/);
        if (numMatch) {
          const num = parseInt(numMatch[1]);
          const context = `${prevLine} ${line} ${nextLine}`;
          
          // Problems solved
          if (!textStats.problemsSolved && 
              (context.includes('problem') && context.includes('solved'))) {
            textStats.problemsSolved = num;
          }
          
          // Coding score  
          if (!textStats.codingScore && 
              context.includes('score') && 
              !context.includes('monthly') && 
              !context.includes('problem')) {
            textStats.codingScore = num;
          }
          
          // Institute rank
          if (!textStats.instituteRank && 
              (context.includes('institute') || 
               (context.includes('rank') && !context.includes('overall')))) {
            textStats.instituteRank = num;
          }
        }
      }
      
      return {
        jsonData,
        profileStats,
        textStats,
        pageTitle: document.title,
        hasProfileContent: text.includes('Profile') || text.includes('Solved') || text.includes('Score'),
        allNumbers: lines.filter(l => /^\d+$/.test(l)).map(l => parseInt(l)).slice(0, 20) // First 20 numbers on page for debug
      };
    });
    
    await page.close();
    page = null;
    
    // Parse API data if captured (submissions API contains problem count)
    for (const [apiUrl, responseText] of Object.entries(apiData)) {
      try {
        const json = JSON.parse(responseText);
        
        // Check if this is the submissions API
        if (apiUrl.includes('submissions')) {
          if (json.result) {
            // Count unique problems from submissions (all difficulty levels)
            const uniqueProblems = new Set();
            ['School', 'Basic', 'Easy', 'Medium', 'Hard'].forEach(difficulty => {
              if (json.result[difficulty]) {
                Object.keys(json.result[difficulty]).forEach(id => uniqueProblems.add(id));
              }
            });
            
            if (uniqueProblems.size > 0) {
              // Use API count if we don't have it or API has more
              if (!data.jsonData.totalProblemsSolved || uniqueProblems.size > data.jsonData.totalProblemsSolved) {
                data.jsonData.totalProblemsSolved = uniqueProblems.size;
                console.log(`   ✅ Found ${uniqueProblems.size} problems from submissions API`);
              }
            }
          }
        }
        
        // Look for user stats in various JSON structures
        const checkObj = (obj) => {
          if (!obj || typeof obj !== 'object') return;
          
          // Check for problemsSolved fields
          if (obj.total_problems_solved && !data.jsonData.totalProblemsSolved) {
            data.jsonData.totalProblemsSolved = parseInt(obj.total_problems_solved);
            console.log(`   ✅ Found total_problems_solved: ${data.jsonData.totalProblemsSolved}`);
          }
          if (obj.problemsSolved && !data.jsonData.totalProblemsSolved) {
            data.jsonData.totalProblemsSolved = parseInt(obj.problemsSolved);
            console.log(`   ✅ Found problemsSolved: ${data.jsonData.totalProblemsSolved}`);
          }
          
          // Check for coding score
          if (obj.score && !data.jsonData.score) {
            data.jsonData.score = parseInt(obj.score);
            console.log(`   ✅ Found score: ${data.jsonData.score}`);
          }
          if (obj.codingScore && !data.jsonData.score) {
            data.jsonData.score = parseInt(obj.codingScore);
            console.log(`   ✅ Found codingScore: ${data.jsonData.score}`);
          }
          
          // Check for institute rank
          if (obj.institute_rank && !data.jsonData.instituteRank) {
            data.jsonData.instituteRank = parseInt(obj.institute_rank);
            console.log(`   ✅ Found institute_rank: ${data.jsonData.instituteRank}`);
          }
          if (obj.instituteRank && !data.jsonData.instituteRank) {
            data.jsonData.instituteRank = parseInt(obj.instituteRank);
            console.log(`   ✅ Found instituteRank: ${data.jsonData.instituteRank}`);
          }
          
          // Check for monthly score
          if (obj.monthly_score && !data.jsonData.monthlyScore) {
            data.jsonData.monthlyScore = parseInt(obj.monthly_score);
          }
          
          // Recursively check nested objects
          for (const key in obj) {
            if (typeof obj[key] === 'object') {
              checkObj(obj[key]);
            }
          }
        };
        
        checkObj(json);
      } catch (e) {
        // Not JSON or parsing error, skip
      }
    }
    
    // Combine data from all methods with priority: JSON/API > profileStats > textStats
    let problemsSolved = data.jsonData.totalProblemsSolved || data.profileStats.problemsSolved || data.textStats.problemsSolved || 0;
    let codingScore = data.jsonData.score || data.profileStats.score || data.textStats.codingScore || 0;
    let instituteRank = data.jsonData.instituteRank || data.profileStats.instituteRank || data.textStats.instituteRank || 0;
    let monthlyScore = data.jsonData.monthlyScore || 0;
    
    const stats = {
      problemsSolved,
      totalSolved: problemsSolved,
      codingScore,
      instituteRank,
      monthlyScore: monthlyScore || codingScore
    };
    
    console.log(`✅ GeeksforGeeks: ${username}`);
    console.log(`   📊 Problems: ${problemsSolved} | 🏆 Score: ${codingScore} | 🎓 Rank: ${instituteRank}`);

    return {
      success: true,
      platform: 'geeksforgeeks',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`❌ GeeksforGeeks Error for ${username}:`, error.message);
    
    // Close page if still open
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // ignore
      }
    }
    
    return {
      success: false,
      platform: 'geeksforgeeks',
      username,
      error: 'Unable to fetch GFG stats. Profile may be private or username incorrect.',
      stats: null
    };
  }
};

module.exports = {
  fetchGeeksforGeeksStats
};
