const { DailyChallenge, Streak } = require('../models/DailyChallenge');
const User = require('../models/User');
const { fetchLeetCodeSolvedProblems, fetchLeetCodeTodaySubmissions } = require('../services/platforms/leetcodeService');
const { fetchCodeforcesSolvedProblems, fetchCodeforcesTodaySubmissions } = require('../services/platforms/codeforcesService');

// Multi-platform DSA problem bank
const dsaProblems = {
  'Arrays': [
    { name: 'Two Sum', link: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy', platform: 'leetcode', slug: 'two-sum' },
    { name: 'Best Time to Buy and Sell Stock', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'Easy', platform: 'leetcode', slug: 'best-time-to-buy-and-sell-stock' },
    { name: 'Contains Duplicate', link: 'https://leetcode.com/problems/contains-duplicate/', difficulty: 'Easy', platform: 'leetcode', slug: 'contains-duplicate' },
    { name: 'Watermelon', link: 'https://codeforces.com/problemset/problem/4/A', difficulty: 'Easy', platform: 'codeforces', problemId: '4-A' },
    { name: 'Product of Array Except Self', link: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'Medium', platform: 'leetcode', slug: 'product-of-array-except-self' },
    { name: 'Maximum Subarray', link: 'https://leetcode.com/problems/maximum-subarray/', difficulty: 'Medium', platform: 'leetcode', slug: 'maximum-subarray' },
    { name: 'Container With Most Water', link: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'Medium', platform: 'leetcode', slug: 'container-with-most-water' },
    { name: '3Sum', link: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium', platform: 'leetcode', slug: '3sum' },
    { name: 'Theatre Square', link: 'https://codeforces.com/problemset/problem/1/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1-A' },
    { name: 'First Missing Positive', link: 'https://leetcode.com/problems/first-missing-positive/', difficulty: 'Hard', platform: 'leetcode', slug: 'first-missing-positive' }
  ],
  'Strings': [
    { name: 'Valid Anagram', link: 'https://leetcode.com/problems/valid-anagram/', difficulty: 'Easy', platform: 'leetcode', slug: 'valid-anagram' },
    { name: 'Valid Palindrome', link: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'Easy', platform: 'leetcode', slug: 'valid-palindrome' },
    { name: 'Way Too Long Words', link: 'https://codeforces.com/problemset/problem/71/A', difficulty: 'Easy', platform: 'codeforces', problemId: '71-A' },
    { name: 'Longest Substring Without Repeating Characters', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-substring-without-repeating-characters' },
    { name: 'Longest Palindromic Substring', link: 'https://leetcode.com/problems/longest-palindromic-substring/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-palindromic-substring' },
    { name: 'Group Anagrams', link: 'https://leetcode.com/problems/group-anagrams/', difficulty: 'Medium', platform: 'leetcode', slug: 'group-anagrams' },
    { name: 'Minimum Window Substring', link: 'https://leetcode.com/problems/minimum-window-substring/', difficulty: 'Hard', platform: 'leetcode', slug: 'minimum-window-substring' }
  ],
  'Linked List': [
    { name: 'Reverse Linked List', link: 'https://leetcode.com/problems/reverse-linked-list/', difficulty: 'Easy', platform: 'leetcode', slug: 'reverse-linked-list' },
    { name: 'Merge Two Sorted Lists', link: 'https://leetcode.com/problems/merge-two-sorted-lists/', difficulty: 'Easy', platform: 'leetcode', slug: 'merge-two-sorted-lists' },
    { name: 'Linked List Cycle', link: 'https://leetcode.com/problems/linked-list-cycle/', difficulty: 'Easy', platform: 'leetcode', slug: 'linked-list-cycle' },
    { name: 'Remove Nth Node From End of List', link: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', difficulty: 'Medium', platform: 'leetcode', slug: 'remove-nth-node-from-end-of-list' },
    { name: 'Reorder List', link: 'https://leetcode.com/problems/reorder-list/', difficulty: 'Medium', platform: 'leetcode', slug: 'reorder-list' },
    { name: 'LRU Cache', link: 'https://leetcode.com/problems/lru-cache/', difficulty: 'Medium', platform: 'leetcode', slug: 'lru-cache' },
    { name: 'Merge k Sorted Lists', link: 'https://leetcode.com/problems/merge-k-sorted-lists/', difficulty: 'Hard', platform: 'leetcode', slug: 'merge-k-sorted-lists' }
  ],
  'Trees': [
    { name: 'Maximum Depth of Binary Tree', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'maximum-depth-of-binary-tree' },
    { name: 'Same Tree', link: 'https://leetcode.com/problems/same-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'same-tree' },
    { name: 'Invert Binary Tree', link: 'https://leetcode.com/problems/invert-binary-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'invert-binary-tree' },
    { name: 'Binary Tree Level Order Traversal', link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', difficulty: 'Medium', platform: 'leetcode', slug: 'binary-tree-level-order-traversal' },
    { name: 'Validate Binary Search Tree', link: 'https://leetcode.com/problems/validate-binary-search-tree/', difficulty: 'Medium', platform: 'leetcode', slug: 'validate-binary-search-tree' },
    { name: 'Lowest Common Ancestor of a Binary Tree', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', difficulty: 'Medium', platform: 'leetcode', slug: 'lowest-common-ancestor-of-a-binary-tree' },
    { name: 'Binary Tree Maximum Path Sum', link: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', difficulty: 'Hard', platform: 'leetcode', slug: 'binary-tree-maximum-path-sum' }
  ],
  'Dynamic Programming': [
    { name: 'Climbing Stairs', link: 'https://leetcode.com/problems/climbing-stairs/', difficulty: 'Easy', platform: 'leetcode', slug: 'climbing-stairs' },
    { name: 'House Robber', link: 'https://leetcode.com/problems/house-robber/', difficulty: 'Medium', platform: 'leetcode', slug: 'house-robber' },
    { name: 'Coin Change', link: 'https://leetcode.com/problems/coin-change/', difficulty: 'Medium', platform: 'leetcode', slug: 'coin-change' },
    { name: 'Longest Increasing Subsequence', link: 'https://leetcode.com/problems/longest-increasing-subsequence/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-increasing-subsequence' },
    { name: 'Word Break', link: 'https://leetcode.com/problems/word-break/', difficulty: 'Medium', platform: 'leetcode', slug: 'word-break' },
    { name: 'Boredom', link: 'https://codeforces.com/problemset/problem/455/A', difficulty: 'Medium', platform: 'codeforces', problemId: '455-A' },
    { name: 'Edit Distance', link: 'https://leetcode.com/problems/edit-distance/', difficulty: 'Hard', platform: 'leetcode', slug: 'edit-distance' }
  ],
  'Graphs': [
    { name: 'Number of Islands', link: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'Medium', platform: 'leetcode', slug: 'number-of-islands' },
    { name: 'Clone Graph', link: 'https://leetcode.com/problems/clone-graph/', difficulty: 'Medium', platform: 'leetcode', slug: 'clone-graph' },
    { name: 'Course Schedule', link: 'https://leetcode.com/problems/course-schedule/', difficulty: 'Medium', platform: 'leetcode', slug: 'course-schedule' },
    { name: 'Pacific Atlantic Water Flow', link: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', difficulty: 'Medium', platform: 'leetcode', slug: 'pacific-atlantic-water-flow' },
    { name: 'King Escape', link: 'https://codeforces.com/problemset/problem/1033/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1033-A' },
    { name: 'Word Ladder', link: 'https://leetcode.com/problems/word-ladder/', difficulty: 'Hard', platform: 'leetcode', slug: 'word-ladder' }
  ],
  'Binary Search': [
    { name: 'Binary Search', link: 'https://leetcode.com/problems/binary-search/', difficulty: 'Easy', platform: 'leetcode', slug: 'binary-search' },
    { name: 'Search Insert Position', link: 'https://leetcode.com/problems/search-insert-position/', difficulty: 'Easy', platform: 'leetcode', slug: 'search-insert-position' },
    { name: 'Search in Rotated Sorted Array', link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', difficulty: 'Medium', platform: 'leetcode', slug: 'search-in-rotated-sorted-array' },
    { name: 'Find Minimum in Rotated Sorted Array', link: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', difficulty: 'Medium', platform: 'leetcode', slug: 'find-minimum-in-rotated-sorted-array' },
    { name: 'Koko Eating Bananas', link: 'https://leetcode.com/problems/koko-eating-bananas/', difficulty: 'Medium', platform: 'leetcode', slug: 'koko-eating-bananas' },
    { name: 'Median of Two Sorted Arrays', link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', difficulty: 'Hard', platform: 'leetcode', slug: 'median-of-two-sorted-arrays' }
  ],
  'Backtracking': [
    { name: 'Subsets', link: 'https://leetcode.com/problems/subsets/', difficulty: 'Medium', platform: 'leetcode', slug: 'subsets' },
    { name: 'Combination Sum', link: 'https://leetcode.com/problems/combination-sum/', difficulty: 'Medium', platform: 'leetcode', slug: 'combination-sum' },
    { name: 'Permutations', link: 'https://leetcode.com/problems/permutations/', difficulty: 'Medium', platform: 'leetcode', slug: 'permutations' },
    { name: 'Letter Combinations of a Phone Number', link: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', difficulty: 'Medium', platform: 'leetcode', slug: 'letter-combinations-of-a-phone-number' },
    { name: 'Word Search', link: 'https://leetcode.com/problems/word-search/', difficulty: 'Medium', platform: 'leetcode', slug: 'word-search' },
    { name: 'N-Queens', link: 'https://leetcode.com/problems/n-queens/', difficulty: 'Hard', platform: 'leetcode', slug: 'n-queens' }
  ],
  'Heap': [
    { name: 'Kth Largest Element in an Array', link: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', difficulty: 'Medium', platform: 'leetcode', slug: 'kth-largest-element-in-an-array' },
    { name: 'Top K Frequent Elements', link: 'https://leetcode.com/problems/top-k-frequent-elements/', difficulty: 'Medium', platform: 'leetcode', slug: 'top-k-frequent-elements' },
    { name: 'Task Scheduler', link: 'https://leetcode.com/problems/task-scheduler/', difficulty: 'Medium', platform: 'leetcode', slug: 'task-scheduler' },
    { name: 'Find Median from Data Stream', link: 'https://leetcode.com/problems/find-median-from-data-stream/', difficulty: 'Hard', platform: 'leetcode', slug: 'find-median-from-data-stream' }
  ],
  'Stack': [
    { name: 'Valid Parentheses', link: 'https://leetcode.com/problems/valid-parentheses/', difficulty: 'Easy', platform: 'leetcode', slug: 'valid-parentheses' },
    { name: 'Min Stack', link: 'https://leetcode.com/problems/min-stack/', difficulty: 'Medium', platform: 'leetcode', slug: 'min-stack' },
    { name: 'Daily Temperatures', link: 'https://leetcode.com/problems/daily-temperatures/', difficulty: 'Medium', platform: 'leetcode', slug: 'daily-temperatures' },
    { name: 'Largest Rectangle in Histogram', link: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', difficulty: 'Hard', platform: 'leetcode', slug: 'largest-rectangle-in-histogram' }
  ],
  'Math': [
    { name: 'Next Round', link: 'https://codeforces.com/problemset/problem/158/A', difficulty: 'Easy', platform: 'codeforces', problemId: '158-A' },
    { name: 'Team', link: 'https://codeforces.com/problemset/problem/231/A', difficulty: 'Easy', platform: 'codeforces', problemId: '231-A' },
    { name: 'Beautiful Matrix', link: 'https://codeforces.com/problemset/problem/263/A', difficulty: 'Easy', platform: 'codeforces', problemId: '263-A' },
    { name: 'Boy or Girl', link: 'https://codeforces.com/problemset/problem/236/A', difficulty: 'Easy', platform: 'codeforces', problemId: '236-A' },
    { name: 'Nearly Lucky Number', link: 'https://codeforces.com/problemset/problem/110/A', difficulty: 'Easy', platform: 'codeforces', problemId: '110-A' }
  ]
};

// Helper: Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper: Get yesterday's date
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Fetch all solved problems from user's connected platforms
const fetchUserSolvedProblems = async (user) => {
  const solvedProblems = {
    leetcode: new Set(),
    codeforces: new Set()
  };

  try {
    // Fetch LeetCode solved problems
    if (user.platforms?.leetcode) {
      const lcResult = await fetchLeetCodeSolvedProblems(user.platforms.leetcode);
      if (lcResult.success) {
        lcResult.data.forEach(p => {
          solvedProblems.leetcode.add(p.titleSlug);
          solvedProblems.leetcode.add(p.title.toLowerCase());
        });
      }
    }

    // Fetch Codeforces solved problems
    if (user.platforms?.codeforces) {
      const cfResult = await fetchCodeforcesSolvedProblems(user.platforms.codeforces);
      if (cfResult.success) {
        cfResult.data.forEach(p => {
          solvedProblems.codeforces.add(p.problemId);
          solvedProblems.codeforces.add(p.name.toLowerCase());
        });
      }
    }
  } catch (error) {
    console.error('Error fetching solved problems:', error.message);
  }

  return solvedProblems;
};

// Check if a problem is already solved by the user
const isProblemSolved = (problem, solvedProblems) => {
  if (problem.platform === 'leetcode') {
    return solvedProblems.leetcode.has(problem.slug) || 
           solvedProblems.leetcode.has(problem.name.toLowerCase());
  } else if (problem.platform === 'codeforces') {
    return solvedProblems.codeforces.has(problem.problemId) || 
           solvedProblems.codeforces.has(problem.name.toLowerCase());
  }
  return false;
};

// Fetch today's submissions to check if challenge problem was solved today
const fetchTodaySubmissions = async (user) => {
  const todayProblems = {
    leetcode: new Set(),
    codeforces: new Set()
  };

  try {
    if (user.platforms?.leetcode) {
      const lcResult = await fetchLeetCodeTodaySubmissions(user.platforms.leetcode);
      if (lcResult.success) {
        lcResult.data.forEach(p => {
          todayProblems.leetcode.add(p.titleSlug);
          todayProblems.leetcode.add(p.title.toLowerCase());
        });
      }
    }

    if (user.platforms?.codeforces) {
      const cfResult = await fetchCodeforcesTodaySubmissions(user.platforms.codeforces);
      if (cfResult.success) {
        cfResult.data.forEach(p => {
          todayProblems.codeforces.add(p.problemId);
          todayProblems.codeforces.add(p.name.toLowerCase());
        });
      }
    }
  } catch (error) {
    console.error('Error fetching today submissions:', error.message);
  }

  return todayProblems;
};

// Check if challenge problem was solved today
const wasChallengeSolvedToday = (challenge, todayProblems) => {
  const slug = challenge.problemLink.split('/problems/')[1]?.replace(/\/$/, '') || '';
  
  if (challenge.problemLink.includes('leetcode.com')) {
    return todayProblems.leetcode.has(slug) || 
           todayProblems.leetcode.has(challenge.problemName.toLowerCase());
  } else if (challenge.problemLink.includes('codeforces.com')) {
    // Extract problem ID from Codeforces URL
    const match = challenge.problemLink.match(/problem\/(\d+)\/([A-Z])/);
    if (match) {
      const problemId = `${match[1]}-${match[2]}`;
      return todayProblems.codeforces.has(problemId) || 
             todayProblems.codeforces.has(challenge.problemName.toLowerCase());
    }
  }
  return false;
};

// Select a personalized problem that the user hasn't solved
const selectDailyProblem = async (userId, solvedProblems) => {
  // Get previously assigned challenges to avoid repetition
  const previousChallenges = await DailyChallenge.find({ 
    user: userId 
  }).select('problemName').lean();
  
  const previousNames = new Set(previousChallenges.map(c => c.problemName.toLowerCase()));
  
  // Get all topics and shuffle them
  const topics = Object.keys(dsaProblems);
  const shuffledTopics = topics.sort(() => Math.random() - 0.5);
  
  // Try to find an unsolved problem
  for (const topic of shuffledTopics) {
    const problems = dsaProblems[topic];
    const shuffledProblems = [...problems].sort(() => Math.random() - 0.5);
    
    for (const problem of shuffledProblems) {
      // Skip if already solved
      if (isProblemSolved(problem, solvedProblems)) continue;
      // Skip if recently assigned
      if (previousNames.has(problem.name.toLowerCase())) continue;
      
      return { ...problem, topic };
    }
  }
  
  // If all problems are solved, pick a random one for revision (prefer unsolved in previous challenges)
  for (const topic of shuffledTopics) {
    const problems = dsaProblems[topic];
    const shuffledProblems = [...problems].sort(() => Math.random() - 0.5);
    
    for (const problem of shuffledProblems) {
      if (!previousNames.has(problem.name.toLowerCase())) {
        return { ...problem, topic, isRevision: true };
      }
    }
  }
  
  // Fallback: random problem
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const problems = dsaProblems[randomTopic];
  const randomProblem = problems[Math.floor(Math.random() * problems.length)];
  
  return { ...randomProblem, topic: randomTopic, isRevision: true };
};

// Update streak when challenge is completed
const updateStreak = async (userId, challenge) => {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  
  let streak = await Streak.findOne({ user: userId });
  if (!streak) {
    streak = await Streak.create({ user: userId });
  }
  
  // Don't update if already completed today
  if (streak.lastCompletedDate === today) {
    return streak;
  }
  
  // Check if streak continues or resets
  if (streak.lastCompletedDate === yesterday) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }
  
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }
  
  streak.lastCompletedDate = today;
  streak.totalCompleted += 1;
  streak.completionHistory.push({
    date: today,
    problemName: challenge.problemName,
    topic: challenge.topic
  });
  
  await streak.save();
  return streak;
};

// Get today's challenge
exports.getTodayChallenge = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayDate();
    
    // Get user with platform info
    const user = await User.findById(userId);
    
    // Check if challenge already exists for today
    let challenge = await DailyChallenge.findOne({ user: userId, date: today });
    
    // Fetch user's solved problems
    const solvedProblems = await fetchUserSolvedProblems(user);
    
    if (!challenge) {
      // Generate new challenge - personalized based on unsolved problems
      const problem = await selectDailyProblem(userId, solvedProblems);
      
      challenge = await DailyChallenge.create({
        user: userId,
        date: today,
        problemName: problem.name,
        problemLink: problem.link,
        difficulty: problem.difficulty,
        topic: problem.topic,
        platform: problem.platform
      });
    } else if (!challenge.isCompleted) {
      // Challenge exists but not completed - check if the problem was already solved before
      const currentProblem = {
        platform: challenge.problemLink.includes('leetcode') ? 'leetcode' : 'codeforces',
        slug: challenge.problemLink.split('/problems/')[1]?.replace(/\/$/, '') || '',
        problemId: (() => {
          const match = challenge.problemLink.match(/problem\/(\d+)\/([A-Z])/);
          return match ? `${match[1]}-${match[2]}` : '';
        })(),
        name: challenge.problemName
      };
      
      if (isProblemSolved(currentProblem, solvedProblems)) {
        // Problem was already solved, get a new one
        const newProblem = await selectDailyProblem(userId, solvedProblems);
        
        // Update the challenge with new problem
        challenge.problemName = newProblem.name;
        challenge.problemLink = newProblem.link;
        challenge.difficulty = newProblem.difficulty;
        challenge.topic = newProblem.topic;
        await challenge.save();
      }
    }
    
    // Check if challenge was solved today (auto-complete)
    if (!challenge.isCompleted) {
      const todaySubmissions = await fetchTodaySubmissions(user);
      
      if (wasChallengeSolvedToday(challenge, todaySubmissions)) {
        // Auto-complete the challenge
        challenge.isCompleted = true;
        challenge.completedAt = new Date();
        challenge.autoCompleted = true;
        await challenge.save();
        
        // Update streak
        await updateStreak(userId, challenge);
      }
    }
    
    // Get streak info
    let streak = await Streak.findOne({ user: userId });
    if (!streak) {
      streak = await Streak.create({ user: userId });
    }
    
    res.json({
      success: true,
      challenge: {
        problemName: challenge.problemName,
        problemLink: challenge.problemLink,
        difficulty: challenge.difficulty,
        topic: challenge.topic,
        platform: challenge.problemLink.includes('leetcode') ? 'leetcode' : 'codeforces',
        isCompleted: challenge.isCompleted,
        completedAt: challenge.completedAt,
        autoCompleted: challenge.autoCompleted || false
      },
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        total: streak.totalCompleted
      }
    });
  } catch (error) {
    console.error('Error getting daily challenge:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify and complete challenge (checks if user actually solved it)
exports.verifyAndComplete = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayDate();
    
    const user = await User.findById(userId);
    const challenge = await DailyChallenge.findOne({ user: userId, date: today });
    
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'No challenge found for today' });
    }
    
    if (challenge.isCompleted) {
      return res.status(400).json({ success: false, message: 'Challenge already completed' });
    }
    
    // Check user's platforms
    if (!user.platforms?.leetcode && !user.platforms?.codeforces) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please link your LeetCode or Codeforces account to verify submissions' 
      });
    }
    
    // Fetch today's submissions
    const todaySubmissions = await fetchTodaySubmissions(user);
    
    // Check if challenge was solved today
    if (!wasChallengeSolvedToday(challenge, todaySubmissions)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Problem not yet solved today. Solve it on the platform and try again.' 
      });
    }
    
    // Mark as complete
    challenge.isCompleted = true;
    challenge.completedAt = new Date();
    challenge.autoCompleted = false;
    await challenge.save();
    
    // Update streak
    const streak = await updateStreak(userId, challenge);
    
    res.json({
      success: true,
      message: 'Challenge completed! 🎉',
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        total: streak.totalCompleted
      }
    });
  } catch (error) {
    console.error('Error verifying challenge:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark challenge as manually complete (for cases where API can't verify)
exports.completeChallenge = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayDate();
    
    const user = await User.findById(userId);
    const challenge = await DailyChallenge.findOne({ user: userId, date: today });
    
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'No challenge found for today' });
    }
    
    if (challenge.isCompleted) {
      return res.status(400).json({ success: false, message: 'Challenge already completed' });
    }
    
    // Try to verify first
    const todaySubmissions = await fetchTodaySubmissions(user);
    const verified = wasChallengeSolvedToday(challenge, todaySubmissions);
    
    if (!verified) {
      // Check if they have platforms linked
      if (user.platforms?.leetcode || user.platforms?.codeforces) {
        return res.status(400).json({ 
          success: false, 
          message: 'Could not verify submission. Please solve the problem on the platform first.' 
        });
      }
    }
    
    // Mark as complete
    challenge.isCompleted = true;
    challenge.completedAt = new Date();
    challenge.verified = verified;
    await challenge.save();
    
    // Update streak
    const streak = await updateStreak(userId, challenge);
    
    res.json({
      success: true,
      message: verified ? 'Challenge verified and completed! 🎉' : 'Challenge marked complete',
      verified,
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        total: streak.totalCompleted
      }
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Skip today's challenge and get a new one
exports.skipChallenge = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayDate();
    
    const user = await User.findById(userId);
    const challenge = await DailyChallenge.findOne({ user: userId, date: today });
    
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'No challenge found for today' });
    }
    
    if (challenge.isCompleted) {
      return res.status(400).json({ success: false, message: 'Cannot skip completed challenge' });
    }
    
    // Fetch solved problems
    const solvedProblems = await fetchUserSolvedProblems(user);
    
    // Get new problem
    const newProblem = await selectDailyProblem(userId, solvedProblems);
    
    // Update challenge
    challenge.problemName = newProblem.name;
    challenge.problemLink = newProblem.link;
    challenge.difficulty = newProblem.difficulty;
    challenge.topic = newProblem.topic;
    await challenge.save();
    
    res.json({
      success: true,
      message: 'New challenge assigned',
      challenge: {
        problemName: challenge.problemName,
        problemLink: challenge.problemLink,
        difficulty: challenge.difficulty,
        topic: challenge.topic,
        platform: challenge.problemLink.includes('leetcode') ? 'leetcode' : 'codeforces',
        isCompleted: false
      }
    });
  } catch (error) {
    console.error('Error skipping challenge:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get streak history
exports.getStreakHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const streak = await Streak.findOne({ user: userId });
    
    if (!streak) {
      return res.json({
        success: true,
        streak: {
          current: 0,
          longest: 0,
          total: 0,
          history: []
        }
      });
    }
    
    res.json({
      success: true,
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        total: streak.totalCompleted,
        lastCompleted: streak.lastCompletedDate,
        history: streak.completionHistory.slice(-30)
      }
    });
  } catch (error) {
    console.error('Error getting streak history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get challenge history
exports.getChallengeHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 30 } = req.query;
    
    const challenges = await DailyChallenge.find({ user: userId })
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      challenges: challenges.map(c => ({
        date: c.date,
        problemName: c.problemName,
        problemLink: c.problemLink,
        difficulty: c.difficulty,
        topic: c.topic,
        platform: c.problemLink.includes('leetcode') ? 'leetcode' : 'codeforces',
        isCompleted: c.isCompleted,
        completedAt: c.completedAt
      }))
    });
  } catch (error) {
    console.error('Error getting challenge history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get topic stats
exports.getTopicStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const completedChallenges = await DailyChallenge.find({ 
      user: userId, 
      isCompleted: true 
    });
    
    const topicStats = {};
    Object.keys(dsaProblems).forEach(topic => {
      topicStats[topic] = {
        total: dsaProblems[topic].length,
        completed: 0
      };
    });
    
    completedChallenges.forEach(c => {
      if (topicStats[c.topic]) {
        topicStats[c.topic].completed += 1;
      }
    });
    
    res.json({
      success: true,
      topics: topicStats
    });
  } catch (error) {
    console.error('Error getting topic stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
