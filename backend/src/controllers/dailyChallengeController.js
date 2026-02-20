const { DailyChallenge, Streak } = require('../models/DailyChallenge');
const User = require('../models/User');
const { fetchLeetCodeSolvedProblems, fetchLeetCodeTodaySubmissions } = require('../services/platforms/leetcodeService');
const { fetchCodeforcesSolvedProblems, fetchCodeforcesTodaySubmissions } = require('../services/platforms/codeforcesService');

// Import comprehensive problem bank
const { 
  problemsBank, 
  getAllTopics, 
  getProblemsForTopic,
  getRandomProblemFromTopics,
  getRandomProblem 
} = require('../data/problemsBank');

// Use the comprehensive problem bank
const dsaProblems = problemsBank;

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
// Now smarter - prioritizes topics user has been practicing
const selectDailyProblem = async (userId, solvedProblems, userTopics = []) => {
  // Get previously assigned challenges to avoid repetition
  const previousChallenges = await DailyChallenge.find({ 
    user: userId 
  }).select('problemName topic').lean();
  
  const previousNames = new Set(previousChallenges.map(c => c.problemName.toLowerCase()));
  
  // Analyze which topics user has been practicing
  const topicFrequency = {};
  previousChallenges.forEach(c => {
    topicFrequency[c.topic] = (topicFrequency[c.topic] || 0) + 1;
  });
  
  // Get all available topics
  const allTopics = getAllTopics();
  
  // Determine which topics to prioritize:
  // 1. If user has practiced topics, prefer those (70% of the time)
  // 2. Also introduce new topics gradually (30% of the time)
  const practicedTopics = Object.keys(topicFrequency).filter(t => topicFrequency[t] >= 1);
  const newTopics = allTopics.filter(t => !practicedTopics.includes(t));
  
  // Build priority topic list
  let priorityTopics = [];
  
  if (practicedTopics.length > 0 && Math.random() > 0.3) {
    // 70% chance: pick from practiced topics
    // Sort by frequency (less practiced topics get priority)
    priorityTopics = practicedTopics.sort((a, b) => topicFrequency[a] - topicFrequency[b]);
  } else if (newTopics.length > 0) {
    // 30% chance or if no practiced topics: introduce new topic
    priorityTopics = newTopics.sort(() => Math.random() - 0.5);
  } else {
    // Fallback: all topics
    priorityTopics = allTopics.sort(() => Math.random() - 0.5);
  }
  
  // Add remaining topics at the end
  const remainingTopics = allTopics.filter(t => !priorityTopics.includes(t));
  const allOrderedTopics = [...priorityTopics, ...remainingTopics.sort(() => Math.random() - 0.5)];
  
  // Try to find an unsolved problem from prioritized topics
  for (const topic of allOrderedTopics) {
    const problems = dsaProblems[topic] || [];
    const shuffledProblems = [...problems].sort(() => Math.random() - 0.5);
    
    for (const problem of shuffledProblems) {
      // Skip if already solved
      if (isProblemSolved(problem, solvedProblems)) continue;
      // Skip if recently assigned
      if (previousNames.has(problem.name.toLowerCase())) continue;
      
      return { ...problem, topic };
    }
  }
  
  // If all problems are solved, pick a random one from less practiced topics for revision
  for (const topic of allOrderedTopics) {
    const problems = dsaProblems[topic] || [];
    const shuffledProblems = [...problems].sort(() => Math.random() - 0.5);
    
    for (const problem of shuffledProblems) {
      if (!previousNames.has(problem.name.toLowerCase())) {
        return { ...problem, topic, isRevision: true };
      }
    }
  }
  
  // Ultimate fallback: random problem
  const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
  const problems = dsaProblems[randomTopic] || [];
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
