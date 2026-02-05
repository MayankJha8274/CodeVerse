import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code, 
  ExternalLink,
  Check,
  MapPin,
  Building,
  Mail,
  Linkedin,
  Twitter,
  Globe,
  RefreshCw,
  ChevronRight,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Platform icons/colors
const platformConfig = {
  leetcode: { name: 'LeetCode', color: '#FFA116', icon: '📊' },
  codeforces: { name: 'CodeForces', color: '#1F8ACB', icon: '🏆' },
  codechef: { name: 'CodeChef', icon: '👨‍🍳', color: '#5B4638' },
  github: { name: 'GitHub', color: '#333', icon: '🐙' },
  geeksforgeeks: { name: 'GeeksForGeeks', color: '#2F8D46', icon: '🧑‍💻' },
  hackerrank: { name: 'HackerRank', color: '#00EA64', icon: '💚' },
  codingninjas: { name: 'Coding Ninjas', color: '#F96D00', icon: '🥷' }
};

// Contribution Heatmap Component
const ContributionHeatmap = ({ submissions = 0 }) => {
  const generateHeatmapData = () => {
    const weeks = [];
    const today = new Date();
    for (let w = 0; w < 26; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (25 - w) * 7 - (6 - d));
        const activity = Math.random() > 0.4 ? Math.floor(Math.random() * 4) + 1 : 0;
        week.push({ date, activity });
      }
      weeks.push(week);
    }
    return weeks;
  };

  const weeks = generateHeatmapData();
  
  const getColor = (level) => {
    const colors = ['#1a1a2e', '#2d4a3e', '#3d6b4f', '#4d8c60', '#5dad71'];
    return colors[level] || colors[0];
  };

  return (
    <div className="flex gap-1">
      {weeks.map((week, i) => (
        <div key={i} className="flex flex-col gap-1">
          {week.map((day, j) => (
            <div
              key={j}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getColor(day.activity) }}
              title={`${day.date.toDateString()}: ${day.activity} contributions`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Circular Progress Component
const CircularProgress = ({ value, max, size = 120, strokeWidth = 10, color = '#f59e0b' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = max > 0 ? (value / max) * 100 : 0;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2a2a3e"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [platformStats, setPlatformStats] = useState({});
  const [ratingHistory, setRatingHistory] = useState([]);
  const [refreshTimer, setRefreshTimer] = useState(null);
  const [showPlatformStats, setShowPlatformStats] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryData, allStats, ratingsData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getAllPlatformStats().catch(() => ({})),
        api.getRatingGrowth().catch(() => [])
      ]);

      setUserData(summaryData);
      setPlatformStats(allStats || {});
      setRatingHistory(ratingsData || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await api.syncPlatforms();
      await fetchDashboardData();
      setRefreshTimer(900);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Calculate totals
  const getTotalProblems = () => {
    let total = 0;
    Object.values(platformStats).forEach(stats => {
      total += stats?.totalSolved || stats?.problemsSolved || 0;
    });
    return total;
  };

  const getTotalContests = () => {
    let total = 0;
    Object.values(platformStats).forEach(stats => {
      total += stats?.contestsParticipated || 0;
    });
    return total;
  };

  const getContestsByPlatform = () => {
    const contests = [];
    if (platformStats.leetcode?.contestsParticipated) {
      contests.push({ platform: 'LeetCode', count: platformStats.leetcode.contestsParticipated, icon: '📊' });
    }
    if (platformStats.codechef?.contestsParticipated) {
      contests.push({ platform: 'CodeChef', count: platformStats.codechef.contestsParticipated, icon: '👨‍🍳' });
    }
    if (platformStats.codeforces?.contestsParticipated) {
      contests.push({ platform: 'CodeForces', count: platformStats.codeforces.contestsParticipated, icon: '🏆' });
    }
    return contests;
  };

  const getConnectedPlatforms = () => {
    const connected = [];
    const userPlatforms = authUser?.platforms || userData?.user?.platforms || {};
    
    Object.entries(userPlatforms).forEach(([platform, username]) => {
      if (username && platformConfig[platform]) {
        connected.push({
          key: platform,
          ...platformConfig[platform],
          username,
          stats: platformStats[platform] || {}
        });
      }
    });
    return connected;
  };

  // Problems breakdown
  const getDSAProblems = () => {
    const lc = platformStats.leetcode || {};
    return {
      easy: lc.easySolved || lc.easy || 0,
      medium: lc.mediumSolved || lc.medium || 0,
      hard: lc.hardSolved || lc.hard || 0,
      total: (lc.easySolved || lc.easy || 0) + (lc.mediumSolved || lc.medium || 0) + (lc.hardSolved || lc.hard || 0)
    };
  };

  const getCPProblems = () => {
    const cf = platformStats.codeforces || {};
    const cc = platformStats.codechef || {};
    return {
      codechef: cc.problemsSolved || 0,
      codeforces: cf.problemsSolved || 0,
      total: (cc.problemsSolved || 0) + (cf.problemsSolved || 0)
    };
  };

  const connectedPlatforms = getConnectedPlatforms();
  const dsaProblems = getDSAProblems();
  const cpProblems = getCPProblems();

  // Helper to generate demo rating data
  const generateDemoRatingData = () => {
    const data = [];
    let rating = 1500;
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      rating += Math.floor(Math.random() * 100) - 30;
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short' }),
        rating: Math.max(rating, 1200)
      });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Empty state for new users
  if (!connectedPlatforms.length) {
    return (
      <div className="min-h-screen bg-[#0d0d14] p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-amber-500/10 rounded-full flex items-center justify-center">
            <Code className="w-12 h-12 text-amber-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Welcome to CodeVerse!</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Connect your coding platforms to see your comprehensive stats, track progress, and compete with friends!
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3 rounded-lg text-lg transition-colors"
          >
            Connect Your Platforms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Profile Section */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              {/* Public Profile Toggle */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">Public Profile</span>
                <div className="w-12 h-6 bg-amber-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Next Refresh */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>Next Refresh: {refreshTimer ? `${Math.floor(refreshTimer / 60)}m ${refreshTimer % 60}s` : 'Ready'}</span>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-1 mb-4">
                  <div className="w-full h-full rounded-full bg-[#1a1a2e] flex items-center justify-center overflow-hidden">
                    {authUser?.avatar ? (
                      <img src={authUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{authUser?.fullName?.[0] || authUser?.username?.[0] || '👤'}</span>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white">{authUser?.fullName || 'User'}</h2>
                <p className="text-amber-500 text-sm flex items-center gap-1">
                  @{authUser?.username} <Check className="w-4 h-4 text-green-500" />
                </p>
              </div>

              {/* Get Card Button */}
              <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold py-2.5 rounded-lg mb-6 hover:from-amber-600 hover:to-orange-600 transition-all">
                Get your CodeVerse Card
              </button>

              {/* Social Links */}
              <div className="flex justify-center gap-4 mb-6">
                <button className="p-2 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors">
                  <Mail className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors">
                  <Linkedin className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors">
                  <Twitter className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors">
                  <Globe className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Location Info */}
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>India</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Building className="w-4 h-4" />
                  <span className="truncate">Coding Enthusiast</span>
                </div>
              </div>

              {/* About Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-2">About</h3>
                <p className="text-sm text-gray-400">{authUser?.bio || 'Passionate about competitive programming and software development.'}</p>
              </div>

              {/* Problem Solving Stats - Accordion */}
              <div className="bg-[#1a1a2e] rounded-lg overflow-hidden mb-4">
                <button 
                  onClick={() => setShowPlatformStats(!showPlatformStats)}
                  className="w-full flex items-center justify-between p-3 hover:bg-[#252538] transition-colors"
                >
                  <span className="text-sm font-semibold text-white">Problem Solving Stats</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPlatformStats ? 'rotate-180' : ''}`} />
                </button>
                {showPlatformStats && (
                  <div className="p-3 border-t border-gray-700 space-y-2">
                    {connectedPlatforms.map(platform => (
                      <div key={platform.key} className="flex justify-between text-sm">
                        <span className="text-gray-400">{platform.name}</span>
                        <span className="text-white font-semibold">{platform.stats?.totalSolved || platform.stats?.problemsSolved || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Platforms */}
              <div className="space-y-2">
                {connectedPlatforms.map(platform => (
                  <div key={platform.key} className="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{platform.icon}</span>
                      <span className="text-sm text-white">{platform.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <a 
                        href={getPlatformUrl(platform.key, platform.username)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full text-center text-amber-500 text-sm py-2 hover:text-amber-400 transition-colors"
                >
                  + Add Platform
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column - Stats & Charts */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
                <p className="text-gray-400 text-sm mb-1">Total Questions</p>
                <p className="text-4xl font-bold text-white">{getTotalProblems()}</p>
              </div>
              <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
                <p className="text-gray-400 text-sm mb-1">Total Active Days</p>
                <p className="text-4xl font-bold text-white">{userData?.totals?.activeDays || 142}</p>
              </div>
            </div>

            {/* Submissions Heatmap */}
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-gray-400">Submissions <span className="text-white font-semibold">{getTotalProblems()}</span></span>
                  <span className="text-sm text-gray-400">Max.Streak <span className="text-white font-semibold">{userData?.totals?.maxStreak || 45}</span></span>
                  <span className="text-sm text-gray-400">Current.Streak <span className="text-white font-semibold">{userData?.totals?.currentStreak || 7}</span></span>
                </div>
                <select className="bg-[#1a1a2e] text-white text-sm px-3 py-1 rounded-lg border border-gray-700">
                  <option>Current</option>
                  <option>Last Year</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <ContributionHeatmap submissions={getTotalProblems()} />
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
                <span>Jan</span>
                <span>Feb</span>
              </div>
            </div>

            {/* Total Contests */}
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Total Contests</p>
                  <p className="text-5xl font-bold text-white">{getTotalContests()}</p>
                </div>
                <div className="space-y-3">
                  {getContestsByPlatform().length > 0 ? (
                    getContestsByPlatform().map(item => (
                      <div key={item.platform} className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span className="text-sm text-gray-300">{item.platform}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">Participate in contests to see breakdown</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rating Chart */}
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-white">Rating</p>
                  <p className="text-4xl font-bold text-amber-500">{platformStats.leetcode?.rating || platformStats.codeforces?.rating || 0}</p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p>Latest Update</p>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ratingHistory.length ? ratingHistory : generateDemoRatingData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                    <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#666" tick={{ fontSize: 12 }} domain={['dataMin - 50', 'dataMax + 50']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rating" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sheets Section Promo */}
            <div 
              onClick={() => navigate('/sheets')}
              className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/30 cursor-pointer hover:border-amber-500/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">DSA Sheets</h3>
                  <p className="text-sm text-gray-400">Track your progress on popular DSA sheets like Striver's A to Z</p>
                </div>
                <ChevronRight className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Right Column - Problem Breakdown */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Problems Solved */}
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Problems Solved</h3>
              
              {/* Fundamentals */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Fundamentals ℹ️</p>
                <div className="flex items-center gap-4">
                  <CircularProgress 
                    value={platformStats.hackerrank?.problemsSolved || 0} 
                    max={100} 
                    size={80} 
                    strokeWidth={8}
                    color="#00EA64"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">💚</span>
                      <span className="text-sm text-gray-300">HackerRank</span>
                      <span className="text-sm font-semibold text-white">{platformStats.hackerrank?.problemsSolved || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DSA */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">DSA</p>
                <div className="flex items-center gap-4">
                  <CircularProgress 
                    value={dsaProblems.total} 
                    max={500} 
                    size={80} 
                    strokeWidth={8}
                    color="#f59e0b"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-sm text-gray-300">Easy</span>
                      <span className="text-sm font-semibold text-white">{dsaProblems.easy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span className="text-sm text-gray-300">Medium</span>
                      <span className="text-sm font-semibold text-white">{dsaProblems.medium}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <span className="text-sm text-gray-300">Hard</span>
                      <span className="text-sm font-semibold text-white">{dsaProblems.hard}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Competitive Programming */}
              <div>
                <p className="text-sm text-gray-400 mb-3">Competitive Programming</p>
                <div className="flex items-center gap-4">
                  <CircularProgress 
                    value={cpProblems.total} 
                    max={500} 
                    size={80} 
                    strokeWidth={8}
                    color="#f59e0b"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-700"></span>
                      <span className="text-sm text-gray-300">Codechef</span>
                      <span className="text-sm font-semibold text-white">{cpProblems.codechef}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      <span className="text-sm text-gray-300">Codeforces</span>
                      <span className="text-sm font-semibold text-white">{cpProblems.codeforces}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync All Platforms'}
            </button>

            {/* Quick Links */}
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/rooms')}
                  className="w-full text-left p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-gray-300">🏆 Leaderboards</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={() => navigate('/compare')}
                  className="w-full text-left p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-gray-300">🔄 Compare</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={() => navigate('/sheets')}
                  className="w-full text-left p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-gray-300">📚 DSA Sheets</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get platform URLs
const getPlatformUrl = (platform, username) => {
  const urls = {
    leetcode: `https://leetcode.com/${username}`,
    codeforces: `https://codeforces.com/profile/${username}`,
    codechef: `https://www.codechef.com/users/${username}`,
    github: `https://github.com/${username}`,
    geeksforgeeks: `https://auth.geeksforgeeks.org/user/${username}`,
    hackerrank: `https://www.hackerrank.com/${username}`,
    codingninjas: `https://www.codingninjas.com/studio/profile/${username}`
  };
  return urls[platform] || '#';
};

export default Dashboard;
