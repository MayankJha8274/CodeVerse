const axios = require('axios');
const cheerio = require('cheerio');

const GFG_TIMEOUT = 15000;

const classifyProblemTopics = (problemName, problemSlug) => {
  const text = `${problemName} ${problemSlug}`.toLowerCase();
  const matched = [];
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

const extractTopicsFromSubmissions = (submissionsObj) => {
  const topicMap = {};
  const difficulties = ['School', 'Basic', 'Easy', 'Medium', 'Hard'];
  difficulties.forEach(difficulty => {
    if (submissionsObj[difficulty] && typeof submissionsObj[difficulty] === 'object') {
      const problems = submissionsObj[difficulty];
      for (const [, detail] of Object.entries(problems)) {
        const pname = detail.pname || '';
        const slug = detail.slug || '';
        const topics = classifyProblemTopics(pname, slug);
        for (const topic of topics) {
          topicMap[topic] = (topicMap[topic] || 0) + 1;
        }
      }
    }
  });
  const topics = Object.entries(topicMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  return topics;
};

const generateEstimatedCalendar = (totalProblems) => {
  const calendar = [];
  const days = 180;
  const problemsPerDay = Math.max(1, Math.floor(totalProblems / days));
  const today = new Date();
  for (let i = 0; i < days && totalProblems > 0; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const count = Math.min(problemsPerDay, totalProblems);
    if (count > 0) {
      calendar.push({ date: date.toISOString().split('T')[0], count });
      totalProblems -= count;
    }
  }
  return calendar;
};

const extractFromAuthProfile = ($) => {
  const stats = { problemsSolved: null, codingScore: null, instituteRank: null, monthlyScore: null };
  const text = $('body').text();

  const scoreMatch = text.match(/Coding\s*Score\s*:?\s*(\d+)/i);
  if (scoreMatch) stats.codingScore = parseInt(scoreMatch[1]);

  const solvedMatch = text.match(/(?:Total\s+)?Problems?\s*Solved\s*:?\s*(\d+)/i);
  if (solvedMatch) stats.problemsSolved = parseInt(solvedMatch[1]);

  const rankMatch = text.match(/(?:Institute|Institution)\s*Rank\s*:?\s*(\d+)/i);
  if (rankMatch) stats.instituteRank = parseInt(rankMatch[1]);

  const monthlyMatch = text.match(/Monthly\s*Score\s*:?\s*(\d+)/i);
  if (monthlyMatch) stats.monthlyScore = parseInt(monthlyMatch[1]);

  return stats;
};

const extractFromMainProfile = ($) => {
  const stats = { problemsSolved: null, codingScore: null, instituteRank: null, monthlyScore: null };
  const text = $('body').text();

  const scoreMatch = text.match(/Coding\s*Score\s*:?\s*(\d+)/i) || text.match(/score["\s:]+(\d+)/i);
  if (scoreMatch) stats.codingScore = parseInt(scoreMatch[1]);

  const solvedMatch = text.match(/(?:Total\s+)?Problems?\s*(?:Solved)?\s*:?\s*(\d+)/i);
  if (solvedMatch) stats.problemsSolved = parseInt(solvedMatch[1]);

  const rankMatch = text.match(/(?:Institute|Institution)\s*Rank\s*:?\s*(\d+)/i);
  if (rankMatch) stats.instituteRank = parseInt(rankMatch[1]);

  return stats;
};

const extractFromEmbeddedJson = ($, stats) => {
  const scripts = $('script').toArray();
  for (const script of scripts) {
    const content = $(script).html() || '';
    const jsonMatch = content.match(/\{.*"total_problems_solved".*\}/s);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        stats.problemsSolved = stats.problemsSolved || data.total_problems_solved || data.problemsSolved || data.totalProblems;
        stats.codingScore = stats.codingScore || data.score || data.codingScore;
        stats.instituteRank = stats.instituteRank || data.institute_rank || data.instituteRank;
        stats.monthlyScore = stats.monthlyScore || data.monthly_score || data.monthlyScore;
      } catch {
        // ignore
      }
    }
    if (content.includes('"School"') || content.includes('"Easy"')) {
      try {
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          const json = JSON.parse(content.substring(start, end + 1));
          stats.schoolSolved = json.School ? Object.keys(json.School).length : 0;
          stats.basicSolved = json.Basic ? Object.keys(json.Basic).length : 0;
          stats.easySolved = json.Easy ? Object.keys(json.Easy).length : 0;
          stats.mediumSolved = json.Medium ? Object.keys(json.Medium).length : 0;
          stats.hardSolved = json.Hard ? Object.keys(json.Hard).length : 0;
        }
      } catch {
        // ignore
      }
    }
    if (content.includes('total_problems_solved')) {
      const nums = [...content.matchAll(/"total_problems_solved"\s*:\s*(\d+)/g)];
      if (nums.length > 0) {
        const val = parseInt(nums[nums.length - 1][1]);
        if (val > 0) stats.problemsSolved = stats.problemsSolved || val;
      }
    }
    if (content.includes('"score"') || content.includes('"codingScore"')) {
      const nums = [...content.matchAll(/"(?:score|codingScore)"\s*:\s*(\d+)/g)];
      if (nums.length > 0) {
        const val = parseInt(nums[nums.length - 1][1]);
        if (val > 0) stats.codingScore = stats.codingScore || val;
      }
    }
  }
};

const fetchGeeksforGeeksStats = async (username) => {
  try {
    console.log(`🔍 Fetching GFG stats for: ${username}`);

    const stats = { problemsSolved: null, codingScore: null, instituteRank: null, monthlyScore: null };

    // Strategy 1: Try auth.geeksforgeeks.org (server-rendered HTML)
    try {
      console.log(`   📄 Trying auth.geeksforgeeks.org/user/${username}...`);
      const authRes = await axios.get(`https://auth.geeksforgeeks.org/user/${username}`, {
        timeout: GFG_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const $auth = cheerio.load(authRes.data);
      const authStats = extractFromAuthProfile($auth);
      extractFromEmbeddedJson($auth, authStats);
      Object.assign(stats, authStats);
      if (stats.problemsSolved > 0 || stats.codingScore > 0) {
        console.log(`   ✅ Auth profile parsed: Solved=${stats.problemsSolved} Score=${stats.codingScore}`);
      }
    } catch (err) {
      console.log(`   ⚠️ auth.geeksforgeeks.org failed: ${err.message}`);
    }

    // Strategy 2: Try www.geeksforgeeks.org/user/{username} (new site)
    if (!stats.problemsSolved) {
      try {
        console.log(`   📄 Trying www.geeksforgeeks.org/user/${username}...`);
        const mainRes = await axios.get(`https://www.geeksforgeeks.org/user/${username}`, {
          timeout: GFG_TIMEOUT,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const $main = cheerio.load(mainRes.data);
        const mainStats = extractFromMainProfile($main);
        extractFromEmbeddedJson($main, mainStats);
        Object.assign(stats, mainStats);
        if (stats.problemsSolved > 0 || stats.codingScore > 0) {
          console.log(`   ✅ Main profile parsed: Solved=${stats.problemsSolved} Score=${stats.codingScore}`);
        }
      } catch (err) {
        console.log(`   ⚠️ www.geeksforgeeks.org failed: ${err.message}`);
      }
    }

    // Strategy 3: Try the practice API endpoint
    if (!stats.problemsSolved) {
      try {
        console.log(`   📄 Trying practice.geeksforgeeks.org API...`);
        const apiRes = await axios.get(`https://practice.geeksforgeeks.org/api/v1/user/profile/${username}`, {
          timeout: GFG_TIMEOUT,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (apiRes.data?.data) {
          const d = apiRes.data.data;
          stats.problemsSolved = stats.problemsSolved || d.total_problems_solved || d.totalProblems || d.problemsSolved;
          stats.codingScore = stats.codingScore || d.score || d.codingScore;
          stats.instituteRank = stats.instituteRank || d.institute_rank || d.instituteRank;
          console.log(`   ✅ API parsed: Solved=${stats.problemsSolved} Score=${stats.codingScore}`);
        }
      } catch (err) {
        console.log(`   ⚠️ API failed: ${err.message}`);
      }
    }

    const problemsSolved = stats.problemsSolved || 0;
    const codingScore = stats.codingScore || 0;
    const instituteRank = stats.instituteRank || 0;
    const monthlyScore = stats.monthlyScore || codingScore;

    if (problemsSolved === 0 && codingScore === 0) {
      return {
        success: false,
        platform: 'geeksforgeeks',
        username,
        error: 'Could not fetch GFG stats. Profile may be private, username may be incorrect, or GFG is blocking requests.',
        stats: null
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
        easySolved: stats.easySolved || Math.round(problemsSolved * 0.4),
        mediumSolved: stats.mediumSolved || Math.round(problemsSolved * 0.35),
        hardSolved: stats.hardSolved || Math.round(problemsSolved * 0.25),
        codingScore,
        instituteRank,
        monthlyScore,
        topics: [],
        submissionCalendar: []
      },
      lastFetched: new Date()
    };
  } catch (error) {
    console.error(`❌ GeeksforGeeks Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'geeksforgeeks',
      username,
      error: error.message || 'Unable to fetch GFG stats.',
      stats: null
    };
  }
};

module.exports = { fetchGeeksforGeeksStats };
