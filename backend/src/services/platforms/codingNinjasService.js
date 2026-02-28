const puppeteer = require('puppeteer');

/**
 * Coding Ninjas Service using Puppeteer for JS rendering
 * Naukri Code360 is a JavaScript-heavy SPA that requires browser rendering
 */

/**
 * Fetch Coding Ninjas user statistics
 * @param {string} username - Coding Ninjas username
 * @returns {Object} User stats
 */
const fetchCodingNinjasStats = async (username) => {
  let browser = null;
  
  try {
    console.log(`🔍 Fetching Coding Ninjas stats for: ${username}`);
    
    let problemsSolved = 0;
    let score = 0;
    let contestsParticipated = 0;
    let rank = 0;
    let easy = 0;
    let moderate = 0;
    let hard = 0;
    let submissions = 0;
    
    browser = await puppeteer.launch({ 
      headless: true, 
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Remove automation flags
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    
    const targetUrl = `https://www.naukri.com/code360/profile/${username}`;
    console.log(`📄 Navigating to: ${targetUrl}`);
    
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle0', 
      timeout: 45000 
    });
    
    // Wait additional time for JS to render
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Extract data from the rendered page
    const extractedData = await page.evaluate(() => {
      const getText = () => document.body.innerText || '';
      const text = getText();
      
      // Try to find the problems solved data with multiple regex patterns
      // Pattern 1: Standard format
      const dsaMatch = text.match(/Data\s+Structures\s+&\s+Algorithms\s+(\d+)\s+Problems\s+solved\s+(\d+)\s+Easy\s+(\d+)\s+Moderate\s+(\d+)\s+Hard/i);
      // Pattern 2: Alternate layout (numbers on separate lines)
      const altMatch = !dsaMatch ? text.match(/(\d+)\s+Problems?\s+solved[\s\S]*?(\d+)\s+Easy\s+(\d+)\s+Moderate\s+(\d+)\s+Hard/i) : null;
      // Pattern 3: Try individual extraction
      const totalMatch = !dsaMatch && !altMatch ? text.match(/(\d+)\s+Problems?\s+solved/i) : null;
      const easyMatch = !dsaMatch && !altMatch ? text.match(/(\d+)\s+Easy/i) : null;
      const modMatch = !dsaMatch && !altMatch ? text.match(/(\d+)\s+Moderate/i) : null;
      const hardMatch = !dsaMatch && !altMatch ? text.match(/(\d+)\s+Hard/i) : null;
      
      const submissionsMatch = text.match(/(\d+)\s+Problem\s+submissions/i);
      
      // Extract DSA topic badges from the profile
      // CN shows "X in DSA topics\nTopic1\nTopic2..."
      const topicBadges = [];
      const topicBadgeMatches = text.matchAll(/(\d+)\s+in\s+DSA\s+topics?\s*\n([\s\S]*?)(?=\d+\s+(?:in\s+DSA|Specialist|Achiever|Expert|Ninja)|$)/gi);
      for (const match of topicBadgeMatches) {
        const topicSection = match[2];
        const topics = topicSection.split('\n').map(t => t.trim()).filter(t => t && t.length > 1 && t.length < 40 && !/^\d+$/.test(t));
        topicBadges.push(...topics);
      }
      // Fallback: look for known DSA topic names after "DSA badges" or "DSA topics"
      if (topicBadges.length === 0) {
        const knownTopics = ['Arrays', 'Array', 'Linked List', 'Stacks & Queues', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Graph', 'Dynamic Programming', 'Greedy', 'Backtracking', 'Recursion', 'Sorting', 'Searching', 'Hashing', 'Strings', 'String', 'Bit Manipulation', 'Math', 'Matrix', 'Heap', 'Trie', 'Two Pointer', 'Sliding Window'];
        for (const topic of knownTopics) {
          if (text.includes(topic)) {
            topicBadges.push(topic);
          }
        }
      }
      
      return {
        text: text.substring(0, 5000), // First 5000 chars for debugging
        textLength: text.length,
        dsaMatch: dsaMatch ? {
          total: dsaMatch[1],
          easy: dsaMatch[2],
          moderate: dsaMatch[3],
          hard: dsaMatch[4]
        } : altMatch ? {
          total: altMatch[1],
          easy: altMatch[2],
          moderate: altMatch[3],
          hard: altMatch[4]
        } : (totalMatch || easyMatch) ? {
          total: totalMatch ? totalMatch[1] : '0',
          easy: easyMatch ? easyMatch[1] : '0',
          moderate: modMatch ? modMatch[1] : '0',
          hard: hardMatch ? hardMatch[1] : '0'
        } : null,
        submissions: submissionsMatch ? submissionsMatch[1] : null,
        topicBadges: topicBadges
      };
    });
    
    console.log(`📊 Page text length: ${extractedData.textLength}`);
    
    if (extractedData.dsaMatch) {
      problemsSolved = parseInt(extractedData.dsaMatch.total) || 0;
      easy = parseInt(extractedData.dsaMatch.easy) || 0;
      moderate = parseInt(extractedData.dsaMatch.moderate) || 0;
      hard = parseInt(extractedData.dsaMatch.hard) || 0;
      console.log(`✅ Found: ${problemsSolved} problems (E:${easy}, M:${moderate}, H:${hard})`);
    } else {
      console.log('⚠️ Could not extract DSA data');
      console.log('Sample text:', extractedData.text.substring(0, 500));
    }
    
    if (extractedData.submissions) {
      submissions = parseInt(extractedData.submissions) || 0;
      console.log(`✅ Found: ${submissions} submissions`);
    }
    
    // Build topics from DSA badge topics
    // CN doesn't provide per-topic problem counts, so we estimate based on 
    // total problems and the number of topics the user has badges in
    const cnTopics = [];
    if (extractedData.topicBadges && extractedData.topicBadges.length > 0) {
      const uniqueTopics = [...new Set(extractedData.topicBadges)];
      // Normalize topic names to match standard naming
      const topicNameMap = {
        'Arrays': 'Array',
        'Stacks & Queues': 'Stack',
        'Stacks': 'Stack',
        'Queues': 'Queue',
        'Trees': 'Tree',
        'Graphs': 'Graph',
        'Strings': 'String',
        'Hashing': 'Hash',
      };
      
      // Distribute problems proportionally across topics
      const totalForTopics = problemsSolved;
      const perTopic = Math.max(1, Math.floor(totalForTopics / uniqueTopics.length));
      let remaining = totalForTopics;
      
      for (let i = 0; i < uniqueTopics.length; i++) {
        const rawName = uniqueTopics[i];
        const name = topicNameMap[rawName] || rawName;
        const count = i === uniqueTopics.length - 1 ? remaining : Math.min(perTopic, remaining);
        remaining -= count;
        if (count > 0) {
          cnTopics.push({ name, count });
        }
      }
      console.log(`✅ CN Topics from badges: ${cnTopics.map(t => t.name + '(' + t.count + ')').join(', ')}`);
    }
    
    const stats = {
      problemsSolved,
      totalSolved: problemsSolved,
      score,
      contestsParticipated,
      rank,
      easy,
      moderate,
      hard,
      submissions,
      topics: cnTopics
    };

    console.log(`✅ CodingNinjas: ${username} - ${problemsSolved} problems (E:${easy}, M:${moderate}, H:${hard}), ${submissions} submissions`);

    return {
      success: true,
      platform: 'codingninjas',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`❌ Coding Ninjas Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'codingninjas',
      username,
      error: 'Unable to fetch Coding Ninjas stats. Profile may be private or username incorrect.',
      stats: null
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
};

module.exports = {
  fetchCodingNinjasStats
};
