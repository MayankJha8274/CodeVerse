const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const puppeteer = require('puppeteer');
    const username = 'mayankjha8274';
    
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    let submissionsData = null;
    const apiData = {};
    
    page.on('response', async (response) => {
      try {
        const url = response.url();
        const ct = response.headers()['content-type'] || '';
        if (url.includes('/api/') || ct.includes('json')) {
          const text = await response.text();
          if (text.startsWith('{') || text.startsWith('[')) {
            apiData[url] = text;
            if (url.includes('submissions')) {
              submissionsData = text;
              console.log('✅ Captured submissions API!', text.length, 'bytes');
            }
          }
        }
      } catch(e) {}
    });
    
    // Try navigating to the profile page - use ?tab=practice
    const url = `https://www.geeksforgeeks.org/profile/${username}?tab=practice`;
    console.log('Navigating to:', url);
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('Page loaded, waiting 8s for API calls...');
    await new Promise(r => setTimeout(r, 8000));
    
    // If submissions API wasn't captured, try reloading
    if (!submissionsData) {
      console.log('Submissions not captured yet. Reloading...');
      await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, 8000));
    }
    
    console.log('\n=== Captured URLs ===');
    for (const [apiUrl, text] of Object.entries(apiData)) {
      console.log(apiUrl.substring(0, 80), '(', text.length, 'bytes)');
    }
    
    if (submissionsData) {
      const json = JSON.parse(submissionsData);
      console.log('\nSubmissions keys:', Object.keys(json).join(', '));
      
      // Test topic extraction
      const { classifyProblemTopics, extractTopicsFromSubmissions } = (() => {
        // Inline the classifier for testing
        const classifyProblemTopics = (problemName, problemSlug) => {
          const text = `${problemName} ${problemSlug}`.toLowerCase();
          const matched = [];
          const topicRules = [
            ['Linked List', ['linked list', 'linked-list', 'doubly linked', 'singly linked', 'circular linked'], []],
            ['Tree', ['tree', 'bst', 'binary search tree', 'binary-tree', 'inorder', 'preorder', 'postorder', 'leaf', 'subtree', 'root to', 'left view', 'right view', 'top view', 'bottom view', 'boundary traversal'], ['spanning tree']],
            ['Graph', ['graph', 'dijkstra', 'bfs of', 'dfs of', 'cycle in', 'spanning tree', 'floyd', 'bellman', 'shortest path', 'island', 'province', 'topological', 'bipartite', 'word ladder', 'alien dict', 'safe state'], []],
            ['Dynamic Programming', ['knapsack', 'longest increasing sub', 'longest common sub', 'longest bitonic', 'rod cutting', 'coin change', 'perfect sum', 'subset sum', 'partition', 'frog jump', 'geek.s training', 'climbing', 'edit distance', 'fibonacci'], ['binary search', 'linked list']],
            ['Sorting', ['sort', 'bubble sort', 'merge sort', 'quick sort', 'insertion sort', 'selection sort'], ['binary search', 'topological sort']],
            ['Searching', ['binary search', 'search', 'lower bound', 'upper bound', 'floor in', 'ceil in', 'kth smallest', 'kth largest', 'kth element', 'nth root', 'square root', 'search pattern'], ['binary search tree', 'search in linked']],
            ['Array', ['array', 'subarray', 'sub-array', 'rotate array', 'reverse array', 'leaders', 'kadane', 'maximum sub array', 'duplicate', 'missing', 'stock', 'max sum', 'move all'], []],
            ['Stack', ['stack', 'parenthes', 'bracket', 'next greater', 'stock span', 'celebrity'], []],
            ['Queue', ['queue', 'circular queue', 'deque', 'first non-repeating', 'stream', 'sliding window'], []],
            ['Hash', ['hash', 'union of', 'frequency', 'count subarray', 'xor', 'largest subarray with 0'], ['binary search']],
            ['String', ['string', 'pattern', 'anagram', 'palindrome', 'rabin-karp', 'word'], ['subsequence', 'longest common sub']],
            ['Math', ['gcd', 'lcm', 'prime', 'armstrong', 'divisor', 'digit', 'sieve', 'count digit', 'sum of divisors', 'odd or even'], []],
            ['Bit Manipulation', ['bit manipulation', 'set bit', 'kth bit', 'number of 1 bit', 'xor'], ['longest bitonic']],
            ['Greedy', ['greedy', 'fractional knapsack', 'gas station', 'minimum cost of ropes'], []],
            ['Backtracking', ['backtrack', 'rat in a maze', 'n queen', 'sudoku'], []],
            ['Heap', ['heap', 'priority queue', 'merge k sorted', 'k largest'], []],
            ['Recursion', ['recursion', 'recursive', 'tower of hanoi', 'print 1 to n', 'print n to 1', 'print gfg'], []],
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
          for (const difficulty of ['School', 'Basic', 'Easy', 'Medium', 'Hard']) {
            if (submissionsObj[difficulty] && typeof submissionsObj[difficulty] === 'object') {
              for (const [id, detail] of Object.entries(submissionsObj[difficulty])) {
                const topics = classifyProblemTopics(detail.pname || '', detail.slug || '');
                for (const topic of topics) {
                  topicMap[topic] = (topicMap[topic] || 0) + 1;
                }
              }
            }
          }
          return Object.entries(topicMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        };
        
        return { classifyProblemTopics, extractTopicsFromSubmissions };
      })();
      
      const submData = json.result || json.results;
      if (submData) {
        const topics = extractTopicsFromSubmissions(submData);
        console.log('\n=== Extracted Topics ===');
        console.log('Total topics:', topics.length);
        topics.forEach(t => console.log(`  ${t.name}: ${t.count}`));
        
        // Count total classified vs unclassified
        let classified = 0, total = 0;
        for (const difficulty of ['School', 'Basic', 'Easy', 'Medium', 'Hard']) {
          if (submData[difficulty]) {
            const probs = Object.values(submData[difficulty]);
            total += probs.length;
            for (const p of probs) {
              if (classifyProblemTopics(p.pname, p.slug).length > 0) classified++;
            }
          }
        }
        console.log(`\nClassification rate: ${classified}/${total} (${Math.round(classified/total*100)}%)`);
        
        // Update DB
        const PlatformStats = require('./src/models/PlatformStats');
        const User = require('./src/models/User');
        const user = await User.findOne({ email: 'mayankjha8274@gmail.com' });
        await PlatformStats.findOneAndUpdate(
          { userId: user._id, platform: 'geeksforgeeks' },
          { 'stats.topics': topics },
          { new: true }
        );
        console.log('\n✅ GFG topics updated in DB!');
      }
    } else {
      console.log('\n❌ Submissions API was NOT captured.');
      console.log('Try syncing GFG platform from the frontend instead.');
    }
    
    await browser.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
