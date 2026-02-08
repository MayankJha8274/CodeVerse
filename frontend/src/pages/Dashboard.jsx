import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PLATFORM_CONFIG, { PlatformIcon, getPlatformName, getPlatformColor } from '../utils/platformConfig';
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
  ChevronDown,
  Users,
  Zap
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ContributionCalendar from '../components/ContributionCalendar';



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
  const [allRatingHistory, setAllRatingHistory] = useState({ chartData: [], platforms: [] });
  const [cooldownRemaining, setCooldownRemaining] = useState(0); // seconds remaining
  const [showPlatformStats, setShowPlatformStats] = useState(false);
  const [openProblemStats, setOpenProblemStats] = useState(true);
  const [openDevStats, setOpenDevStats] = useState(true);
  const [selectedRatingPlatform, setSelectedRatingPlatform] = useState('all'); // 'all' or specific platform
  const [topicAnalysis, setTopicAnalysis] = useState([]);
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [contributionCalendar, setContributionCalendar] = useState(null);

  const SYNC_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour in ms

  // Platform colors for rating graph
  const platformRatingColors = {
    leetcode: '#FFA116',  // Orange
    codeforces: '#1F8ACB', // Blue
    codechef: '#5B4638',   // Brown
    codingninjas: '#F96D00' // Orange-red
  };

  // ── Cooldown timer (persisted in localStorage per user) ──
  const getSyncKey = () => `codeverse_lastSync_${authUser?._id || authUser?.id || 'default'}`;

  useEffect(() => {
    // On mount / user change: check remaining cooldown
    const stored = localStorage.getItem(getSyncKey());
    if (stored) {
      const elapsed = Date.now() - Number(stored);
      const remaining = Math.max(0, Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000));
      setCooldownRemaining(remaining);
    } else {
      setCooldownRemaining(0);
    }
  }, [authUser?._id, authUser?.id]);

  useEffect(() => {
    // Tick the cooldown every second
    if (cooldownRemaining <= 0) return;
    const id = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownRemaining]);

  const formatCooldown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // On first load: fetch dashboard data. If user has never synced (no stored data), auto-sync.
    const loadData = async () => {
      await fetchDashboardData();
      // Auto-sync on first visit if there's no cooldown stored (never synced before)
      const stored = localStorage.getItem(getSyncKey());
      if (!stored) {
        handleAutoSync();
      }
    };
    loadData();
  }, [authUser?._id || authUser?.id]);

  const handleAutoSync = async () => {
    try {
      setSyncing(true);
      await api.syncPlatforms();
      // Re-fetch but don't show full-page loading spinner
      await fetchDashboardData(true);
      const now = Date.now();
      localStorage.setItem(getSyncKey(), String(now));
      setCooldownRemaining(Math.ceil(SYNC_COOLDOWN_MS / 1000));
    } catch (error) {
      console.error('Auto-sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const fetchDashboardData = async (skipLoadingSpinner = false) => {
    try {
      if (!skipLoadingSpinner) setLoading(true);
      const [summaryData, allStats, ratingsData, allRatingsData, topicsData, badgesData, achievementsData, calendarData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getAllPlatformStats().catch(() => ({})),
        api.getRatingGrowth().catch(() => []),
        api.getAllRatingHistory().catch(() => ({ chartData: [], platforms: [] })),
        api.getTopicAnalysis().catch(() => []),
        api.getBadges().catch(() => []),
        api.getAchievements().catch(() => []),
        api.getContributionCalendar().catch(() => null)
      ]);

      setUserData(summaryData);
      setPlatformStats(allStats || {});
      setRatingHistory(ratingsData || []);
      setAllRatingHistory(allRatingsData || { chartData: [], platforms: [] });
      setTopicAnalysis(topicsData || []);
      setBadges(badgesData || []);
      setAchievements(achievementsData || []);
      setContributionCalendar(calendarData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      if (!skipLoadingSpinner) setLoading(false);
    }
  };

  const handleSync = async () => {
    if (cooldownRemaining > 0) return; // block if cooldown active
    try {
      setSyncing(true);
      // 1. Tell the backend to re-fetch fresh data from all platforms
      await api.syncPlatforms();
      // 2. Re-fetch all dashboard data (now reflects the fresh sync, no full-page spinner)
      await fetchDashboardData(true);
      // 3. Start cooldown timer (1 hour)
      const now = Date.now();
      localStorage.setItem(getSyncKey(), String(now));
      setCooldownRemaining(Math.ceil(SYNC_COOLDOWN_MS / 1000));
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Calculate totals — use summary which has actual unique problems solved
  const getTotalProblems = () => {
    // Summary endpoint (userData) provides actual unique problems solved per platform
    // NOT calendar which counts submissions (can count same problem multiple times)
    if (userData?.totalProblemsSolved !== undefined) {
      return userData.totalProblemsSolved;
    }
    // Fallback to stored platform stats
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
      contests.push({ platform: 'leetcode', name: 'LeetCode', count: platformStats.leetcode.contestsParticipated });
    }
    if (platformStats.codechef?.contestsParticipated) {
      contests.push({ platform: 'codechef', name: 'CodeChef', count: platformStats.codechef.contestsParticipated });
    }
    if (platformStats.codeforces?.contestsParticipated) {
      contests.push({ platform: 'codeforces', name: 'Codeforces', count: platformStats.codeforces.contestsParticipated });
    }
    return contests;
  };

  const getConnectedPlatforms = () => {
    const connected = [];
    const userPlatforms = authUser?.platforms || userData?.user?.platforms || {};
    
    Object.entries(userPlatforms).forEach(([platform, username]) => {
      if (username && PLATFORM_CONFIG[platform]) {
        const cfg = PLATFORM_CONFIG[platform];
        connected.push({
          key: platform,
          name: cfg.name,
          color: cfg.color,
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

  // Compute activity count for a platform: prefer submissions, fall back to problemsSolved/totalSolved
  function getPlatformActivityCount(key, stats = {}) {
    if (!stats) return 0;
    const v = stats.submissions || stats.totalSubmissions || stats.totalSolved || stats.problemsSolved || stats.submitted || 0;
    if (key === 'github') {
      return stats.contributions || stats.totalContributions || stats.contribs || stats.activeContributions || v || 0;
    }
    return v;
  }

  // Combined submissions + contributions across all platforms
  function getCombinedSubmissionsContributions() {
    let total = 0;
    Object.entries(platformStats || {}).forEach(([key, stats]) => {
      total += Number(getPlatformActivityCount(key, stats) || 0);
    });
    return total;
  }

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

              {/* Problem Solving Stats (non-GitHub) */}
              <div className="mb-4">
                <button
                  onClick={() => setOpenProblemStats(prev => !prev)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <h3 className="text-sm font-semibold text-white">Problem Solving Stats</h3>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openProblemStats ? 'rotate-180' : ''}`} />
                </button>
                {openProblemStats && (
                  <div className="space-y-2">
                    {connectedPlatforms.filter(p => p.key !== 'github').map(platform => {
                      return (
                        <div key={platform.key} className="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={platform.key} className="w-5 h-5" color={PLATFORM_CONFIG[platform.key]?.color} />
                            <span className="text-sm text-white">{platform.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
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
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Development Stats (GitHub) */}
              <div className="mb-4">
                <button
                  onClick={() => setOpenDevStats(prev => !prev)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <h3 className="text-sm font-semibold text-white">Development Stats</h3>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openDevStats ? 'rotate-180' : ''}`} />
                </button>
                {openDevStats && (
                  <div className="space-y-2">
                    {connectedPlatforms.filter(p => p.key === 'github').map(platform => {
                      return (
                        <div key={platform.key} className="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={platform.key} className="w-5 h-5" color={PLATFORM_CONFIG[platform.key]?.color} />
                            <span className="text-sm text-white">{platform.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
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
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/settings')}
                className="w-full text-center text-amber-500 text-sm py-2 hover:text-amber-400 transition-colors"
              >
                + Add Platform
              </button>
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
                <p className="text-4xl font-bold text-white">{contributionCalendar?.stats?.activeDays || userData?.totals?.activeDays || 0}</p>
              </div>
            </div>

            {/* Contribution Calendar */}
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              <ContributionCalendar calendarData={contributionCalendar} connectedPlatforms={connectedPlatforms} />
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
                          <PlatformIcon platform={item.platform} className="w-4 h-4" color={getPlatformColor(item.platform)} />
                          <span className="text-sm text-gray-300">{item.name}</span>
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

            {/* Rating Chart - Multi-Platform (Codolio Style) */}
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              {/* Header with current rating */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-400">Rating</p>
                  <p className="text-3xl font-bold text-white">
                    {selectedRatingPlatform === 'all' 
                      ? (platformStats.leetcode?.rating || platformStats.codeforces?.rating || platformStats.codechef?.rating || 0)
                      : (platformStats[selectedRatingPlatform]?.rating || 0)
                    }
                  </p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs">Latest Update</p>
                </div>
              </div>

              {/* Platform Toggle Tabs */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedRatingPlatform('all')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedRatingPlatform === 'all' 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-[#1a1a2e] text-gray-400 hover:bg-[#252536] border border-gray-700'
                  }`}
                >
                  All Platforms
                </button>
                {['leetcode', 'codeforces', 'codechef'].map(platform => {
                  const hasData = allRatingHistory.byPlatform?.[platform]?.length > 0;
                  const platformName = PLATFORM_CONFIG[platform]?.name || platform;
                  return (
                    <button
                      key={platform}
                      onClick={() => setSelectedRatingPlatform(platform)}
                      disabled={!hasData}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        selectedRatingPlatform === platform 
                          ? 'text-black' 
                          : hasData 
                            ? 'bg-[#1a1a2e] text-gray-400 hover:bg-[#252536] border border-gray-700'
                            : 'bg-[#1a1a2e] text-gray-600 cursor-not-allowed opacity-50'
                      }`}
                      style={selectedRatingPlatform === platform ? { backgroundColor: platformRatingColors[platform] } : {}}
                    >
                      <PlatformIcon platform={platform} className="w-4 h-4" /> {platformName}
                    </button>
                  );
                })}
              </div>

              {/* Legend for All Platforms view */}
              {selectedRatingPlatform === 'all' && allRatingHistory.platforms?.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-3">
                  {allRatingHistory.platforms.map(platform => (
                    <div key={platform} className="flex items-center gap-2">
                      <PlatformIcon platform={platform} className="w-3.5 h-3.5" color={platformRatingColors[platform]} />
                      <span className="text-xs text-gray-400">{PLATFORM_CONFIG[platform]?.name || platform}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Chart */}
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={allRatingHistory.chartData?.length ? allRatingHistory.chartData : (ratingHistory.length ? ratingHistory : generateDemoRatingData())}>
                    <defs>
                      {/* Gradient definitions for each platform */}
                      <linearGradient id="gradientLeetcode" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFA116" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#FFA116" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradientCodeforces" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1F8ACB" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#1F8ACB" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradientCodechef" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B4638" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#5B4638" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradientDefault" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666" 
                      tick={{ fontSize: 10 }} 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      }}
                    />
                    <YAxis stroke="#666" tick={{ fontSize: 10 }} domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#1a1a2e', 
                        border: '1px solid #333', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                      }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}
                      formatter={(value, name) => {
                        if (value === null) return ['-', PLATFORM_CONFIG[name]?.name || name];
                        return [value, PLATFORM_CONFIG[name]?.name || name];
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                        day: 'numeric', month: 'short', year: 'numeric' 
                      })}
                    />
                    
                    {/* Render areas for each platform */}
                    {selectedRatingPlatform === 'all' ? (
                      (allRatingHistory.platforms || []).map(platform => (
                        <Area 
                          key={platform}
                          type="natural" 
                          dataKey={platform}
                          name={platform}
                          stroke={platformRatingColors[platform]}
                          strokeWidth={2} 
                          fill={`url(#gradient${platform.charAt(0).toUpperCase() + platform.slice(1)})`}
                          dot={false}
                          activeDot={{ r: 4, fill: platformRatingColors[platform] }}
                          connectNulls
                        />
                      ))
                    ) : allRatingHistory.byPlatform?.[selectedRatingPlatform]?.length > 0 ? (
                      <Area 
                        type="natural" 
                        dataKey={selectedRatingPlatform}
                        name={selectedRatingPlatform}
                        stroke={platformRatingColors[selectedRatingPlatform]}
                        strokeWidth={2.5} 
                        fill={`url(#gradient${selectedRatingPlatform.charAt(0).toUpperCase() + selectedRatingPlatform.slice(1)})`}
                        dot={false}
                        activeDot={{ r: 5, fill: platformRatingColors[selectedRatingPlatform] }}
                        connectNulls
                      />
                    ) : (
                      <Area 
                        type="natural" 
                        dataKey="rating" 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        fill="url(#gradientDefault)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#f59e0b' }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Current Ratings Summary */}
              <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-gray-800">
                {platformStats.leetcode?.rating > 0 && (
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: platformRatingColors.leetcode }}>{platformStats.leetcode.rating}</div>
                    <div className="text-xs text-gray-500">LeetCode</div>
                  </div>
                )}
                {platformStats.codeforces?.rating > 0 && (
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: platformRatingColors.codeforces }}>{platformStats.codeforces.rating}</div>
                    <div className="text-xs text-gray-500">Codeforces</div>
                  </div>
                )}
                {platformStats.codechef?.rating > 0 && (
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: platformRatingColors.codechef }}>{platformStats.codechef.rating}</div>
                    <div className="text-xs text-gray-500">CodeChef</div>
                  </div>
                )}
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

            {/* Contest Achievements/Titles */}
            {achievements.length > 0 ? (
              <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-xl">🏆</span> Contest Rankings
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement, idx) => {
                    return (
                      <div 
                        key={idx}
                        className="relative bg-gradient-to-br from-[#1a1a2e] to-[#12121a] rounded-xl p-5 border border-gray-700/50 text-center hover:border-gray-600 transition-all group overflow-hidden"
                      >
                        {/* Glow effect */}
                        <div 
                          className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                          style={{ 
                            background: `radial-gradient(circle at 50% 0%, ${achievement.color}40, transparent 70%)` 
                          }}
                        />
                        
                        <div className="relative z-10">
                          {/* Platform icon */}
                          <div className="flex justify-center mb-3">
                            <PlatformIcon platform={achievement.platform} className="w-8 h-8" color={achievement.color} />
                          </div>
                          
                          {/* Title/Rank */}
                          <div 
                            className="text-xl font-bold mb-1"
                            style={{ color: achievement.color }}
                          >
                            {achievement.title}
                          </div>
                          
                          {/* Platform name */}
                          <div className="text-sm text-gray-400 mb-2 flex items-center justify-center gap-1.5">
                            <PlatformIcon platform={achievement.platform} className="w-4 h-4" />
                            {getPlatformName(achievement.platform)}
                          </div>
                          
                          {/* Rating */}
                          <div className="bg-[#0d0d14] rounded-lg py-2 px-3 inline-block">
                            <span className="text-xs text-gray-500">Rating</span>
                            <div className="text-lg font-semibold text-white">{achievement.rating}</div>
                            {achievement.maxRating && (
                              <span className="text-xs text-gray-500">Max: {achievement.maxRating}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <span className="text-xl">🏆</span> Contest Rankings
                </h3>
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-gray-400 text-sm mb-2">No contest ratings yet</p>
                  <p className="text-gray-500 text-xs">Participate in LeetCode, Codeforces, or CodeChef contests to see your rankings</p>
                </div>
              </div>
            )}

            {/* DSA Topic Analysis */}
            {topicAnalysis.length > 0 ? (
              <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <PlatformIcon platform="leetcode" className="w-5 h-5" color="#FFA116" /> DSA Topic Analysis
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{topicAnalysis.length} topics</span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      <span className="text-[10px] text-green-400">Live</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar-thin">
                  {topicAnalysis.slice(0, 15).map((topic, idx) => {
                    const maxCount = topicAnalysis[0]?.total || 1;
                    const percentage = (topic.total / maxCount) * 100;
                    // Different colors based on ranking
                    const barColors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
                    const barColor = barColors[idx % barColors.length];
                    return (
                      <div key={idx} className="group">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                            {idx < 3 && <span className="mr-1">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>}
                            {topic.name}
                          </span>
                          <span className="text-sm font-semibold" style={{ color: barColor }}>{topic.total}</span>
                        </div>
                        <div className="h-2.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: barColor,
                              boxShadow: `0 0 8px ${barColor}40`
                            }}
                          />
                        </div>
                        {Object.keys(topic.platforms || {}).length > 1 && (
                          <div className="flex gap-3 mt-1">
                            {topic.platforms?.leetcode && (
                              <span className="text-xs text-orange-400 flex items-center gap-1">
                                <PlatformIcon platform="leetcode" className="w-3 h-3" /> {topic.platforms.leetcode}
                              </span>
                            )}
                            {topic.platforms?.codeforces && (
                              <span className="text-xs text-blue-400 flex items-center gap-1">
                                <PlatformIcon platform="codeforces" className="w-3 h-3" /> {topic.platforms.codeforces}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <PlatformIcon platform="leetcode" className="w-5 h-5" color="#FFA116" /> DSA Topic Analysis
                </h3>
                <div className="text-center py-6">
                  <div className="flex justify-center mb-3"><BookOpen className="w-10 h-10 text-gray-600" /></div>
                  <p className="text-gray-400 text-sm mb-2">No topic data available</p>
                  <p className="text-gray-500 text-xs">Connect LeetCode or Codeforces and sync to see your topic-wise progress</p>
                </div>
              </div>
            )}

            {/* Badges/Awards */}
            {badges.length > 0 && (
              <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-xl">🎖️</span> Badges & Awards
                  </h3>
                  <span className="text-xs text-gray-500">{badges.length} earned</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {badges.slice(0, 9).map((badge, idx) => (
                    <div 
                      key={idx}
                      className="group relative bg-gradient-to-br from-[#1a1a2e] to-[#12121a] rounded-xl p-4 border border-gray-700/50 text-center hover:border-amber-500/30 transition-all cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                      <div className="relative z-10">
                        {badge.icon ? (
                          <img 
                            src={badge.icon} 
                            alt={badge.name}
                            className="w-12 h-12 mx-auto mb-2 drop-shadow-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-amber-500/30 to-orange-600/20 rounded-full flex items-center justify-center border border-amber-500/30">
                            <span className="text-2xl">🏅</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-300 truncate font-medium">{badge.name}</div>
                        <div className="text-[10px] text-gray-500 capitalize mt-0.5">{badge.platform}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Problem Breakdown */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Problems Solved */}
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Problems Solved</h3>
              
              {/* Fundamentals */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Fundamentals</p>
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
                      <PlatformIcon platform="hackerrank" className="w-5 h-5 text-green-500" color={PLATFORM_CONFIG['hackerrank']?.color} />
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
                      <PlatformIcon platform="codechef" className="w-5 h-5" color={PLATFORM_CONFIG['codechef']?.color} />
                      <span className="text-sm text-gray-300">Codechef</span>
                      <span className="text-sm font-semibold text-white">{cpProblems.codechef}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform="codeforces" className="w-5 h-5" color={PLATFORM_CONFIG['codeforces']?.color} />
                      <span className="text-sm text-gray-300">Codeforces</span>
                      <span className="text-sm font-semibold text-white">{cpProblems.codeforces}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Button with Cooldown Timer */}
            <div className="space-y-2">
              <button
                onClick={handleSync}
                disabled={syncing || cooldownRemaining > 0}
                className={`w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  cooldownRemaining > 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing 
                  ? 'Syncing all platforms...' 
                  : cooldownRemaining > 0 
                    ? `Sync available in ${formatCooldown(cooldownRemaining)}` 
                    : 'Sync All Platforms'}
              </button>
              {cooldownRemaining > 0 && (
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-amber-500/60 rounded-full transition-all duration-1000"
                    style={{ width: `${((SYNC_COOLDOWN_MS / 1000 - cooldownRemaining) / (SYNC_COOLDOWN_MS / 1000)) * 100}%` }}
                  />
                </div>
              )}
              {/* Last synced info */}
              {(() => {
                const stored = localStorage.getItem(getSyncKey());
                if (!stored) return <p className="text-xs text-gray-500 text-center">Never synced — syncing automatically...</p>;
                const mins = Math.floor((Date.now() - Number(stored)) / 60000);
                const label = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
                return <p className="text-xs text-gray-500 text-center">Last synced: {label}</p>;
              })()}
              <p className="text-[10px] text-gray-600 text-center">Refreshes problem counts, ratings, and contest data from all platforms</p>
            </div>

            {/* Quick Links */}
            <div className="bg-[#16161f] rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/platforms')}
                  className="w-full text-left p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-gray-300 flex items-center gap-2"><Code className="w-4 h-4" /> Platforms</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={() => navigate('/rooms')}
                  className="w-full text-left p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-gray-300 flex items-center gap-2"><Users className="w-4 h-4" /> Societies</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={() => navigate('/daily-challenge')}
                  className="w-full text-left p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#252538] transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-gray-300 flex items-center gap-2"><Zap className="w-4 h-4" /> Daily Challenge</span>
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
  const cfg = PLATFORM_CONFIG[platform];
  if (cfg?.url) return cfg.url(username);
  return '#';
};

export default Dashboard;
