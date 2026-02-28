const puppeteer = require('puppeteer');

/**
 * Classify a problem into DSA topics based on its name/slug
 * Returns an array of topic names the problem belongs to
 */
const classifyProblemTopics = (problemName, problemSlug) => {
  const text = `${problemName} ${problemSlug}`.toLowerCase();
  const matched = [];
  
  // Topic rules: [topicName, [keywords], [negative keywords to avoid false matches]]
  const topicRules = [
    ['Linked List', ['linked list', 'linked-list', 'doubly linked', 'singly linked', 'circular linked', 'merge list', 'node insertion', 'node deletion'], []],
    ['Tree', ['tree', 'bst', 'binary search tree', 'binary-tree', 'inorder', 'preorder', 'postorder', 'leaf', 'subtree', 'root to', 'left view', 'right view', 'top view', 'bottom view', 'boundary traversal', 'level order', 'height of', 'diameter of', 'balanced tree', 'mirror tree', 'symmetric tree'], ['spanning tree']],
    ['Graph', ['graph', 'dijkstra', 'bfs of', 'dfs of', 'cycle in', 'spanning tree', 'floyd', 'bellman', 'shortest path', 'island', 'province', 'topological', 'bipartite', 'word ladder', 'alien dict', 'safe state', 'connected component'], []],
    ['Dynamic Programming', ['knapsack', 'longest increasing sub', 'longest common sub', 'longest bitonic', 'rod cutting', 'coin change', 'perfect sum', 'subset sum', 'partition', 'frog jump', 'geek.s training', 'climbing', 'edit distance', 'egg drop', 'matrix chain', 'fibonacci'], ['binary search', 'linked list']],
    ['Sorting', ['sort', 'bubble sort', 'merge sort', 'quick sort', 'insertion sort', 'selection sort', 'heap sort', 'count inversion'], ['binary search', 'topological sort']],
    ['Searching', ['binary search', 'search', 'lower bound', 'upper bound', 'floor in', 'ceil in', 'kth smallest', 'kth largest', 'kth element', 'nth root', 'square root', 'find peak', 'search pattern'], ['binary search tree', 'search in linked']],
    ['Array', ['array', 'subarray', 'sub-array', 'rotate array', 'reverse array', 'leaders', 'kadane', 'maximum sub array', 'duplicate', 'missing', 'pair', 'triplet', 'stock', 'trapping rain', 'max sum', 'move all', 'rearrange'], []],
    ['Stack', ['stack', 'parenthes', 'bracket', 'next greater', 'stock span', 'celebrity', 'expression', 'postfix', 'infix', 'prefix'], []],
    ['Queue', ['queue', 'circular queue', 'deque', 'first non-repeating', 'stream', 'sliding window'], []],
    ['Hash', ['hash', 'union of', 'frequency', 'count subarray', 'xor', 'largest subarray with 0', 'longest sub-array with sum', 'distinct'], ['binary search']],
    ['String', ['string', 'pattern', 'anagram', 'palindrome', 'rabin-karp', 'kmp', 'reverse string', 'word'], ['subsequence', 'longest common sub']],
    ['Math', ['gcd', 'lcm', 'prime', 'factorial', 'armstrong', 'divisor', 'digit', 'power of', 'sieve', 'modular', 'count digit', 'sum of divisors', 'odd or even'], []],
    ['Bit Manipulation', ['bit', 'xor', 'set bit', 'toggle', 'rightmost', 'kth bit', 'power of 2', 'number of 1 bit'], ['longest bitonic']],
    ['Greedy', ['greedy', 'fractional knapsack', 'gas station', 'minimum cost of ropes', 'job sequencing', 'huffman', 'activity selection', 'minimum platform'], []],
    ['Backtracking', ['backtrack', 'rat in a maze', 'n queen', 'sudoku', 'permutation', 'combination'], []],
    ['Heap', ['heap', 'priority queue', 'median of stream', 'merge k sorted', 'k largest', 'k closest'], []],
    ['Recursion', ['recursion', 'recursive', 'tower of hanoi', 'print 1 to n', 'print n to 1', 'print gfg'], []],
    ['Matrix', ['matrix', 'spiral', 'row-wise', 'row wise', 'rotate matrix', 'median in a row'], ['adjacency']],  
    ['Sliding Window', ['window', 'sliding', 'longest subarray with atmost', 'first negative in every', 'fruit into basket'], []],
    ['Two Pointer', ['two pointer', 'container with most', 'pair sum', '3sum', 'triplet'], []],
    ['Divide and Conquer', ['divide and conquer', 'merge sort', 'count inversion', 'closest pair'], []],
    ['Trie', ['trie', 'prefix tree', 'auto complete'], []],
    ['Segment Tree', ['segment tree', 'range query', 'range update'], []],
    ['Disjoint Set', ['disjoint set', 'union find', 'union-find', 'kruskal'], []],
  ];
  
  for (const [topic, keywords, negKeywords] of topicRules) {
    const hasNeg = negKeywords.length > 0 && negKeywords.some(nk => text.includes(nk));
    if (!hasNeg && keywords.some(kw => text.includes(kw))) {
      matched.push(topic);
    }
  }
  
  return matched;
};

/**
 * Extract topics from GFG submissions data
 * Uses problem names/slugs to classify into DSA topics
 */
const extractTopicsFromSubmissions = (submissionsObj) => {
  const topicMap = {};
  const difficulties = ['School', 'Basic', 'Easy', 'Medium', 'Hard'];
  
  difficulties.forEach(difficulty => {
    if (submissionsObj[difficulty] && typeof submissionsObj[difficulty] === 'object') {
      const problems = submissionsObj[difficulty];
      for (const [id, detail] of Object.entries(problems)) {
        const pname = detail.pname || '';
        const slug = detail.slug || '';
        const topics = classifyProblemTopics(pname, slug);
        for (const topic of topics) {
          topicMap[topic] = (topicMap[topic] || 0) + 1;
        }
      }
    }
  });
  
  // Convert to array format [{name, count}] sorted by count desc
  const topics = Object.entries(topicMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  console.log(`   📊 GFG Topics extracted: ${topics.length} topics from problem names`);
  topics.slice(0, 10).forEach(t => console.log(`      ${t.name}: ${t.count}`));
  
  return topics;
};

/**
 * Generate estimated calendar from total problems solved
 * Since GFG doesn't provide submission calendar API, we create an estimated distribution
 * This spreads problems over the last 180 days for visualization purposes
 */
const generateEstimatedCalendar = (totalProblems) => {
  const calendar = [];
  const days = 180; // Last 6 months
  const problemsPerDay = Math.max(1, Math.floor(totalProblems / days));
  const today = new Date();
  
  // Distribute problems over past days with some randomness
  for (let i = 0; i < days && totalProblems > 0; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const count = Math.min(problemsPerDay, totalProblems);
    
    if (count > 0) {
      calendar.push({
        date: date.toISOString().split('T')[0],
        count: count
      });
      totalProblems -= count;
    }
  }
  
  return calendar;
};

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
    page.on('response', async (response) => {
      try {
        const url = response.url();
        // GFG loads user data from API endpoints
        if (url.includes('/api/') && 
            (url.includes('user') || url.includes('profile') || url.includes('submissions'))) {
          const text = await response.text();
          // For submissions endpoint, keep the LARGEST response (the difficulty-based one, not the date-count one)
          if (url.includes('submissions') && apiData[url] && apiData[url].length > text.length) {
            console.log(`📡 Skipping smaller submissions response (${text.length} vs ${apiData[url].length} bytes)`);
            return;
          }
          apiData[url] = text;
          console.log(`📡 Captured API response from: ${url.substring(0, 80)}... (${text.length} bytes)`);
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
        console.log(`   🔍 Parsing API response from: ${apiUrl.substring(0, 60)}...`);
        
        // Check if this is the submissions API
        if (apiUrl.includes('submissions')) {
          console.log(`   📝 Submissions API found, keys:`, Object.keys(json).join(', '));
          
          // Helper to count per-difficulty from a results/result object
          const countFromObj = (obj) => {
            const uniqueProblems = new Set();
            const counts = { school: 0, basic: 0, easy: 0, medium: 0, hard: 0 };
            const difficulties = ['School', 'Basic', 'Easy', 'Medium', 'Hard'];
            difficulties.forEach(difficulty => {
              if (obj[difficulty]) {
                const problems = Object.keys(obj[difficulty]);
                problems.forEach(id => uniqueProblems.add(id));
                counts[difficulty.toLowerCase()] = problems.length;
                console.log(`   📊 ${difficulty}: ${problems.length} problems`);
              }
            });
            return { unique: uniqueProblems.size, counts };
          };

          if (json.results) {
            const { unique, counts } = countFromObj(json.results);
            if (unique > 0) {
              data.jsonData.totalProblemsSolved = unique;
              // Map: School+Basic+Easy → easySolved, Medium → mediumSolved, Hard → hardSolved
              data.jsonData.easySolved = (counts.school || 0) + (counts.basic || 0) + (counts.easy || 0);
              data.jsonData.mediumSolved = counts.medium || 0;
              data.jsonData.hardSolved = counts.hard || 0;
              console.log(`   ✅ Found ${unique} total unique problems from submissions API (E:${data.jsonData.easySolved} M:${data.jsonData.mediumSolved} H:${data.jsonData.hardSolved})`);
              // Extract topics from problem names
              data.jsonData.topics = extractTopicsFromSubmissions(json.results);
            }
          } else if (json.result && typeof json.result === 'object' && !Array.isArray(json.result)) {
            // Check if result has difficulty keys (not just date:count mapping)
            const hasDifficultyKeys = ['School', 'Basic', 'Easy', 'Medium', 'Hard'].some(d => json.result[d]);
            if (hasDifficultyKeys) {
              const { unique, counts } = countFromObj(json.result);
              if (unique > 0) {
                data.jsonData.totalProblemsSolved = unique;
                data.jsonData.easySolved = (counts.school || 0) + (counts.basic || 0) + (counts.easy || 0);
                data.jsonData.mediumSolved = counts.medium || 0;
                data.jsonData.hardSolved = counts.hard || 0;
                console.log(`   ✅ Found ${unique} total unique problems (alternate structure) (E:${data.jsonData.easySolved} M:${data.jsonData.mediumSolved} H:${data.jsonData.hardSolved})`);
                // Extract topics from problem names
                data.jsonData.topics = extractTopicsFromSubmissions(json.result);
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
    
    const easySolved = data.jsonData.easySolved || 0;
    const mediumSolved = data.jsonData.mediumSolved || 0;
    const hardSolved = data.jsonData.hardSolved || 0;

    const stats = {
      problemsSolved,
      totalSolved: problemsSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      codingScore,
      instituteRank,
      monthlyScore: monthlyScore || codingScore,
      // Topics extracted from problem names via keyword classification
      topics: data.jsonData.topics || [],
      // DO NOT create estimated calendar - it adds fake activity on zero days
      // This breaks streak calculations with incorrect data
      submissionCalendar: []
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
