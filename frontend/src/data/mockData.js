// Mock user data
export const mockUser = {
  id: '1',
  name: 'Alex Johnson',
  username: 'alexj',
  email: 'alex@codeverse.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  bio: 'Passionate competitive programmer | Full Stack Developer',
  location: 'San Francisco, CA',
  joinedDate: '2023-01-15',
  platforms: {
    leetcode: 'alexj_codes',
    codeforces: 'alex_cf',
    codechef: 'alexj',
    github: 'alexjohnson',
    geeksforgeeks: 'alexj',
    hackerrank: 'alexj'
  },
  settings: {
    theme: 'dark',
    publicProfile: true,
    showEmail: false,
    emailNotifications: true
  }
};

// Mock stats data
export const mockStats = {
  totalProblems: 1247,
  activeDays: 342,
  currentStreak: 15,
  longestStreak: 45,
  totalCommits: 892,
  avgRating: 1654,
  maxRating: 1789,
  contestsParticipated: 67
};

// Mock platform stats
export const mockPlatformStats = {
  leetcode: {
    totalSolved: 567,
    easy: 234,
    medium: 267,
    hard: 66,
    rating: 2145,
    ranking: '12,345',
    recentActivity: [
      { id: 1, problem: 'Two Sum', difficulty: 'easy', date: '2026-01-20', status: 'solved' },
      { id: 2, problem: 'Longest Substring', difficulty: 'medium', date: '2026-01-20', status: 'solved' },
      { id: 3, problem: 'Median of Two Sorted Arrays', difficulty: 'hard', date: '2026-01-19', status: 'attempted' },
      { id: 4, problem: 'Container With Most Water', difficulty: 'medium', date: '2026-01-19', status: 'solved' },
      { id: 5, problem: 'Regular Expression Matching', difficulty: 'hard', date: '2026-01-18', status: 'solved' }
    ],
    submissions: [
      { date: '2026-01-15', count: 12 },
      { date: '2026-01-16', count: 8 },
      { date: '2026-01-17', count: 15 },
      { date: '2026-01-18', count: 10 },
      { date: '2026-01-19', count: 14 },
      { date: '2026-01-20', count: 9 }
    ]
  },
  codeforces: {
    rating: 1654,
    maxRating: 1789,
    rank: 'Expert',
    contestsParticipated: 45,
    problemsSolved: 387,
    recentActivity: [
      { id: 1, problem: 'Div2 A - Array Sum', difficulty: '800', date: '2026-01-19', status: 'solved' },
      { id: 2, problem: 'Div2 B - String Operations', difficulty: '1200', date: '2026-01-19', status: 'solved' },
      { id: 3, problem: 'Div2 C - Graph Theory', difficulty: '1600', date: '2026-01-18', status: 'attempted' },
      { id: 4, problem: 'Div1 A - Dynamic Programming', difficulty: '2000', date: '2026-01-17', status: 'solved' }
    ],
    ratingHistory: [
      { contest: 'Round 850', rating: 1543, date: '2025-12-15' },
      { contest: 'Round 851', rating: 1589, date: '2025-12-22' },
      { contest: 'Round 852', rating: 1612, date: '2026-01-05' },
      { contest: 'Round 853', rating: 1654, date: '2026-01-15' }
    ]
  },
  codechef: {
    rating: 1832,
    maxRating: 1932,
    stars: '4Γÿà',
    contestsParticipated: 34,
    problemsSolved: 198,
    globalRank: 8745,
    recentActivity: [
      { id: 1, problem: 'Chef and Array', difficulty: 'medium', date: '2026-01-18', status: 'solved' },
      { id: 2, problem: 'Binary Search Problems', difficulty: 'easy', date: '2026-01-17', status: 'solved' },
      { id: 3, problem: 'Tree Queries', difficulty: 'hard', date: '2026-01-16', status: 'attempted' }
    ]
  },
  github: {
    totalCommits: 892,
    totalPRs: 67,
    totalIssues: 23,
    totalRepos: 34,
    contributions: [
      { date: '2026-01-15', count: 5 },
      { date: '2026-01-16', count: 3 },
      { date: '2026-01-17', count: 8 },
      { date: '2026-01-18', count: 4 },
      { date: '2026-01-19', count: 6 },
      { date: '2026-01-20', count: 7 }
    ],
    languages: {
      JavaScript: 35,
      Python: 28,
      Java: 18,
      TypeScript: 12,
      Go: 7
    },
    topRepos: [
      { name: 'awesome-algorithms', stars: 234, language: 'Python' },
      { name: 'web-scraper', stars: 89, language: 'JavaScript' },
      { name: 'api-gateway', stars: 56, language: 'Go' }
    ]
  },
  geeksforgeeks: {
    totalScore: 2341,
    problemsSolved: 234,
    streak: 15,
    rank: 'Expert',
    recentActivity: [
      { id: 1, problem: 'Array Rotation', difficulty: 'easy', date: '2026-01-20', status: 'solved' },
      { id: 2, problem: 'Linked List Reversal', difficulty: 'medium', date: '2026-01-19', status: 'solved' }
    ]
  },
  hackerrank: {
    badges: 23,
    stars: '5Γÿà',
    problemsSolved: 145,
    globalRank: 4532,
    recentActivity: [
      { id: 1, problem: 'SQL Advanced Join', difficulty: 'hard', date: '2026-01-18', status: 'solved' },
      { id: 2, problem: 'Python Collections', difficulty: 'medium', date: '2026-01-17', status: 'solved' }
    ]
  }
};

// Mock problems solved over time
export const mockProblemsOverTime = [
  { month: 'Jul', problems: 78 },
  { month: 'Aug', problems: 95 },
  { month: 'Sep', problems: 112 },
  { month: 'Oct', problems: 98 },
  { month: 'Nov', problems: 134 },
  { month: 'Dec', problems: 156 },
  { month: 'Jan', problems: 89 }
];

// Mock rating growth
export const mockRatingGrowth = [
  { month: 'Jul', leetcode: 1980, codeforces: 1432, codechef: 1654 },
  { month: 'Aug', leetcode: 2034, codeforces: 1489, codechef: 1702 },
  { month: 'Sep', leetcode: 2078, codeforces: 1523, codechef: 1756 },
  { month: 'Oct', leetcode: 2089, codeforces: 1567, codechef: 1789 },
  { month: 'Nov', leetcode: 2112, codeforces: 1598, codechef: 1823 },
  { month: 'Dec', leetcode: 2134, codeforces: 1621, codechef: 1867 },
  { month: 'Jan', leetcode: 2145, codeforces: 1654, codechef: 1832 }
];

// Mock topic heatmap data
export const mockTopicHeatmap = [
  { topic: 'Arrays', problems: 145, percentage: 85 },
  { topic: 'Strings', problems: 123, percentage: 78 },
  { topic: 'Trees', problems: 89, percentage: 65 },
  { topic: 'Graphs', problems: 76, percentage: 58 },
  { topic: 'DP', problems: 98, percentage: 72 },
  { topic: 'Greedy', problems: 67, percentage: 55 },
  { topic: 'Binary Search', problems: 54, percentage: 48 },
  { topic: 'Backtracking', problems: 43, percentage: 40 }
];

// Mock daily challenge
export const mockDailyChallenge = {
  id: 1,
  title: 'Longest Palindromic Substring',
  difficulty: 'medium',
  platform: 'leetcode',
  description: 'Given a string s, return the longest palindromic substring in s.',
  acceptanceRate: 32.5,
  completed: false
};

// Mock room/society data
export const mockRooms = [
  {
    id: '1',
    name: 'Bay Area Coders',
    description: 'Competitive programmers from San Francisco Bay Area',
    members: 45,
    owner: mockUser.id,
    isPublic: true,
    createdAt: '2025-06-15'
  },
  {
    id: '2',
    name: 'Algorithm Masters',
    description: 'Advanced algorithm problem solving group',
    members: 89,
    owner: 'other-user',
    isPublic: true,
    createdAt: '2025-03-20'
  }
];

// Mock room leaderboard
export const mockRoomLeaderboard = [
  {
    rank: 1,
    user: { id: '2', name: 'Sarah Chen', username: 'sarahc', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    totalProblems: 1456,
    weeklyProblems: 34,
    avgRating: 1823,
    score: 9876
  },
  {
    rank: 2,
    user: { id: '1', name: 'Alex Johnson', username: 'alexj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    totalProblems: 1247,
    weeklyProblems: 28,
    avgRating: 1654,
    score: 8542
  },
  {
    rank: 3,
    user: { id: '3', name: 'Michael Brown', username: 'mikeb', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
    totalProblems: 1189,
    weeklyProblems: 25,
    avgRating: 1598,
    score: 8123
  },
  {
    rank: 4,
    user: { id: '4', name: 'Emma Wilson', username: 'emmaw', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
    totalProblems: 1034,
    weeklyProblems: 22,
    avgRating: 1512,
    score: 7456
  },
  {
    rank: 5,
    user: { id: '5', name: 'David Lee', username: 'davidl', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    totalProblems: 987,
    weeklyProblems: 19,
    avgRating: 1487,
    score: 7089
  }
];

// Mock comparison users
export const mockComparisonUsers = [
  {
    id: '1',
    name: 'Alex Johnson',
    username: 'alexj',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    stats: {
      totalProblems: 1247,
      leetcode: 567,
      codeforces: 387,
      codechef: 198,
      avgRating: 1654,
      skills: {
        arrays: 85,
        strings: 78,
        trees: 65,
        graphs: 58,
        dp: 72,
        greedy: 55
      }
    }
  },
  {
    id: '2',
    name: 'Sarah Chen',
    username: 'sarahc',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    stats: {
      totalProblems: 1456,
      leetcode: 678,
      codeforces: 445,
      codechef: 234,
      avgRating: 1823,
      skills: {
        arrays: 92,
        strings: 88,
        trees: 78,
        graphs: 72,
        dp: 85,
        greedy: 68
      }
    }
  }
];
