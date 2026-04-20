import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Trophy, Medal, Crown, Loader2, Target, Users, Zap, Search, ChevronLeft, ChevronRight, Globe, Star, Award, BarChart3
} from 'lucide-react';
import api from '../../services/api';
import ProfileLink from '../ProfileLink';
import UserAvatar from '../UserAvatar';
import SkeletonLoader from '../SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import { PlatformIcon } from '../../utils/platformConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_COLORS = [
  { stroke: 'rgba(255, 99, 132, 1)', fill: 'rgba(255, 99, 132, 0.2)' },
  { stroke: 'rgba(255, 159, 64, 1)', fill: 'rgba(255, 159, 64, 0.2)' },
  { stroke: 'rgba(255, 205, 86, 1)', fill: 'rgba(255, 205, 86, 0.2)' },
  { stroke: 'rgba(75, 192, 192, 1)', fill: 'rgba(75, 192, 192, 0.2)' },
  { stroke: 'rgba(54, 162, 235, 1)', fill: 'rgba(54, 162, 235, 0.2)' },
  { stroke: 'rgba(153, 102, 255, 1)', fill: 'rgba(153, 102, 255, 0.2)' },
  { stroke: 'rgba(201, 203, 207, 1)', fill: 'rgba(201, 203, 207, 0.2)' }
];

const rankingTypes = [
  { id: 'codingScore', label: 'Coding Score', icon: Zap, color: 'amber', description: 'Comprehensive Coding Score' },
  { id: 'problems', label: 'Total Questions', icon: Target, color: 'green', description: 'Total Questions Solved' },
  { id: 'leetcode', label: 'LeetCode', icon: null, color: 'orange', description: 'LeetCode Rating' },
  { id: 'codeforces', label: 'Codeforces', icon: null, color: 'blue', description: 'Codeforces Rating' },
  { id: 'codechef', label: 'CodeChef', icon: null, color: 'amber', description: 'CodeChef Rating' },
  { id: 'github', label: 'GitHub', icon: null, color: 'gray', description: 'GitHub Contributions' }
];

const TIME_FILTERS = [
  { key: 'daily', label: '1 Day' },
  { key: 'weekly', label: '1 Week' },
  { key: 'monthly', label: '1 Month' },
  { key: 'yearly', label: '1 Year' },
  { key: 'alltime', label: 'All Time' },
];

const SocietyLeaderboardTab = ({ societyId }) => {
  const { user: authUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States mapped from Global Leaderboard
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rankingType, setRankingType] = useState('codingScore');
  const [timeFilter, setTimeFilter] = useState('alltime');
  const [viewMode, setViewMode] = useState('table');

  const limit = 50;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lbRes = await api.getSocietyLeaderboard(societyId, { limit: 1000, period: timeFilter });
      if (!lbRes?.data) throw new Error('Invalid response format');
      setData(lbRes.data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [societyId, timeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const getRankingValue = useCallback((entry) => {
    const cp = entry.codingProfile || {};
    switch (rankingType) {
      case 'codingScore': return Math.round(entry.codingScore ?? entry.score ?? 0);
      case 'problems': return cp.totalSolved ?? entry.totalProblems ?? 0;
      case 'leetcode': return cp.platforms?.leetcode?.rating ?? cp.leetcode?.stats?.rating ?? 0;
      case 'codeforces': return cp.platforms?.codeforces?.rating ?? cp.codeforces?.stats?.rating ?? 0;
      case 'codechef': return cp.platforms?.codechef?.rating ?? cp.codechef?.stats?.rating ?? 0;
      case 'github': return cp.totalContributions ?? cp.totalCommits ?? entry.totalCommits ?? 0;
      default: return Math.round(entry.codingScore ?? entry.score ?? 0);
    }
  }, [rankingType]);

  const sortedRankings = useMemo(() => {
    if (!data?.rankings) return [];
    const sorted = [...data.rankings];
    sorted.sort((a, b) => getRankingValue(b) - getRankingValue(a));
    // Assign display rank sequentially after sort to perfectly mimic global view
    sorted.forEach((r, i) => { r.displayRank = i + 1; });
    return sorted;
  }, [data, getRankingValue]);

  const filteredLeaderboard = useMemo(() => {
    let filtered = sortedRankings;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        (entry.user?.username || entry.username || '').toLowerCase().includes(q) ||
        (entry.user?.fullName || entry.fullName || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [sortedRankings, searchQuery]);

  const paginatedLeaderboard = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredLeaderboard.slice(start, start + limit);
  }, [filteredLeaderboard, currentPage, limit]);

  const totalPages = Math.ceil(filteredLeaderboard.length / limit);

  // Helper functions matching LeaderboardPage.jsx exactly
  const getRankingLabel = () => rankingTypes.find(t => t.id === rankingType)?.label || 'Score';
  
  const getRankingColor = () => {
    const type = rankingTypes.find(t => t.id === rankingType);
    const colorMap = {
      amber: 'text-amber-500 bg-amber-500/20',
      green: 'text-green-500 bg-green-500/20',
      orange: 'text-orange-500 bg-orange-500/20',
      blue: 'text-blue-500 bg-blue-500/20',
      gray: 'text-gray-300 bg-gray-500/20'
    };
    return colorMap[type?.color] || colorMap.amber;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/50';
    if (rank === 3) return 'from-amber-600/20 to-orange-600/20 border-amber-600/50';
    return 'from-transparent to-transparent border-gray-700';
  };

  if (loading && !data) {
    return <div className="py-8"><SkeletonLoader type="list" /></div>;
  }

  if (error && !data) {
    return (
      <div className="text-center py-16">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-red-400 opacity-50" />
        <p className="text-sm font-medium text-red-400 mb-1">Failed to load leaderboard</p>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 text-xs rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-600 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  // Calculate current user's rank specifically from the newly sorted array
  const meRanking = sortedRankings.find(r => (r.user?._id || r.user)?.toString() === authUser?.id);
  const myRank = meRanking?.displayRank || data?.currentUser?.rank;
  const myScore = meRanking ? getRankingValue(meRanking) : (data?.currentUser?.codingScore ?? data?.currentUser?.score ?? 0);
  const myTotal = meRanking?.codingProfile?.totalSolved ?? data?.currentUser?.totalProblems ?? meRanking?.totalProblems ?? 0;
  const percentile = Math.round(((sortedRankings.length - (myRank || sortedRankings.length)) / (sortedRankings.length || 1)) * 100);

  const topThree = sortedRankings.slice(0, 3);

  return (
    <div className="text-gray-900 dark:text-white transition-colors">
      
      {/* Current User Stats Card identical to LeaderboardPage.jsx */}
      {authUser && (myRank || data?.currentUser) && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ProfileLink userId={authUser?.id}>
                  <UserAvatar user={{ avatar: authUser?.avatar, name: authUser?.fullName, username: authUser?.username }} size="lg" />
                </ProfileLink>
                <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
                  <Star className="w-4 h-4 text-black" />
                </div>
              </div>
              <div>
                <div className="text-sm text-amber-400 font-medium mb-1">Your Rank</div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">#{myRank || '—'}</span>
                  <div className="text-sm text-gray-400">
                    out of {data?.totalParticipants || sortedRankings.length} members
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500">{myScore}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{getRankingLabel()}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{myTotal}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Problems</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{percentile}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Top Percentile</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle (kept for society charts compatibility) */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Society Standings</h3>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#111118] p-1 rounded-lg">
          <button onClick={() => setViewMode('charts')} 
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'charts' ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4"/> Charts</span>
          </button>
          <button onClick={() => setViewMode('table')} 
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'table' ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4"/> Table</span>
          </button>
        </div>
      </div>



      {/* Time Filter, Search, and Labels Row */}
      <div className="bg-gray-50 dark:bg-[#16161f] rounded-xl p-4 mb-6 transition-colors">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Scope Tag & Time Filter */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded-lg flex items-center gap-2 bg-amber-500 text-black font-medium text-sm">
                <Globe className="w-4 h-4" /> Society
              </button>
            </div>
            <div className="flex flex-wrap items-center bg-white dark:bg-[#1a1a2e] p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              {TIME_FILTERS.map(tf => (
                <button key={tf.key} onClick={() => { setTimeFilter(tf.key); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    timeFilter === tf.key
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-500'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}>
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
          {/* Search */}
          <div className="flex-1 md:max-w-xs relative ml-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search members..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      {/* Ranking Type Tabs */}
      <div className="mb-4">
        <div className="flex overflow-x-auto no-scrollbar gap-2 bg-gray-50 dark:bg-[#16161f] rounded-xl p-3 transition-colors">
          {rankingTypes.map((type) => (
            <button key={type.id} onClick={() => { setRankingType(type.id); setCurrentPage(1); }}
              className={`px-4 py-2 whitespace-nowrap rounded-lg flex items-center gap-2 transition-all ${
                rankingType === type.id 
                  ? type.id === 'codingScore' ? 'bg-amber-500 text-black font-semibold' :
                    type.id === 'problems' ? 'bg-green-500 text-black font-semibold' :
                    type.id === 'leetcode' ? 'bg-orange-500 text-black font-semibold' :
                    type.id === 'codeforces' ? 'bg-blue-500 text-black font-semibold' :
                    type.id === 'codechef' ? 'bg-amber-600 text-black font-semibold' :
                    'bg-gray-400 text-black font-semibold'
                  : 'bg-white dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252536] border border-gray-200 dark:border-gray-700 transition-colors'
              }`}
            >
              {type.icon && <type.icon className="w-4 h-4" />}
              {!type.icon && ['leetcode', 'codeforces', 'github', 'codechef'].includes(type.id) && (
                <PlatformIcon platform={type.id} className="w-4 h-4" />
              )}
              {type.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2 ml-2">
          {rankingTypes.find(t => t.id === rankingType)?.description} 
          {timeFilter !== 'alltime' ? ' • Time filtered' : ''}
        </p>
      </div>

      {viewMode === 'charts' && (
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-8 mt-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Top Members Breakdown
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={sortedRankings.slice(0, 7).map(item => ({
                  ...item,
                  chartValue: getRankingValue(item),
                  usernameDisplay: item.user?.username || item.username || 'Unknown'
                }))} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="usernameDisplay" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10}
                  interval={0}
                  tickFormatter={(val) => val.length > 10 ? val.substring(0,10) + '...' : val}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="chartValue" name={getRankingLabel()}>
                  {sortedRankings.slice(0, 7).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length].fill} 
                      stroke={CHART_COLORS[index % CHART_COLORS.length].stroke}
                      strokeWidth={2}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <>
          {/* Top 3 Podium matching Global layout exactly */}
          {topThree.length >= 3 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Top Performers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* 2nd Place */}
                <div className={`bg-gradient-to-br ${getRankColor(2)} border rounded-xl p-6 order-1 md:order-1`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <ProfileLink userId={topThree[1].user?._id || topThree[1].user}>
                        <UserAvatar user={{ avatar: topThree[1].user?.avatar, name: topThree[1].user?.fullName, username: topThree[1].user?.username }} size="xl" />
                      </ProfileLink>
                      <div className="absolute -top-2 -right-2">
                        <Medal className="w-8 h-8 text-gray-300" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-300 mb-1">#2</div>
                    <ProfileLink userId={topThree[1].user?._id || topThree[1].user} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-amber-500 mb-1 transition-colors w-full truncate">
                      {topThree[1].user?.fullName || topThree[1].user?.username}
                    </ProfileLink>
                    <ProfileLink userId={topThree[1].user?._id || topThree[1].user} className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-500 mb-3 transition-colors w-full truncate">
                      @{topThree[1].user?.username}
                    </ProfileLink>
                    <div className={`text-2xl font-bold ${getRankingColor().split(' ')[0]}`}>{getRankingValue(topThree[1])}</div>
                    <div className="text-xs text-gray-500">{getRankingLabel()}</div>
                  </div>
                </div>

                {/* 1st Place */}
                <div className={`bg-gradient-to-br ${getRankColor(1)} border-2 rounded-xl p-8 order-0 md:order-2`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <Crown className="w-10 h-10 text-yellow-400" />
                      </div>
                      <ProfileLink userId={topThree[0].user?._id || topThree[0].user}>
                        <UserAvatar user={{ avatar: topThree[0].user?.avatar, name: topThree[0].user?.fullName, username: topThree[0].user?.username }} size="xl" />
                      </ProfileLink>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400 mb-1">#1</div>
                    <ProfileLink userId={topThree[0].user?._id || topThree[0].user} className="text-xl font-semibold text-gray-900 dark:text-white hover:text-amber-500 mb-1 transition-colors w-full truncate">
                      {topThree[0].user?.fullName || topThree[0].user?.username}
                    </ProfileLink>
                    <ProfileLink userId={topThree[0].user?._id || topThree[0].user} className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-500 mb-3 transition-colors w-full truncate">
                      @{topThree[0].user?.username}
                    </ProfileLink>
                    <div className={`text-3xl font-bold ${getRankingColor().split(' ')[0]}`}>{getRankingValue(topThree[0])}</div>
                    <div className="text-xs text-gray-500">{getRankingLabel()}</div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className={`bg-gradient-to-br ${getRankColor(3)} border rounded-xl p-6 order-2 md:order-3`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <ProfileLink userId={topThree[2].user?._id || topThree[2].user}>
                        <UserAvatar user={{ avatar: topThree[2].user?.avatar, name: topThree[2].user?.fullName, username: topThree[2].user?.username }} size="xl" />
                      </ProfileLink>
                      <div className="absolute -top-2 -right-2">
                        <Medal className="w-8 h-8 text-amber-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-600 mb-1">#3</div>
                    <ProfileLink userId={topThree[2].user?._id || topThree[2].user} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-amber-500 mb-1 transition-colors w-full truncate">
                      {topThree[2].user?.fullName || topThree[2].user?.username}
                    </ProfileLink>
                    <ProfileLink userId={topThree[2].user?._id || topThree[2].user} className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-500 mb-3 transition-colors w-full truncate">
                      @{topThree[2].user?.username}
                    </ProfileLink>
                    <div className={`text-2xl font-bold ${getRankingColor().split(' ')[0]}`}>{getRankingValue(topThree[2])}</div>
                    <div className="text-xs text-gray-500">{getRankingLabel()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table (Flat style mirroring Global precisely) */}
          <div className="bg-white dark:bg-[#16161f] rounded-xl overflow-hidden transition-colors">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-gray-100 dark:bg-[#1a1a2e] text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 transition-colors">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">User</div>
              <div className="col-span-2 text-center">{getRankingLabel()}</div>
              <div className="col-span-2 text-center">{rankingType === 'problems' ? 'Coding Score' : 'Questions'}</div>
              <div className="col-span-3 text-center">Platform Stats</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedLeaderboard.map((entry, index) => {
                const isMe = (entry.user?._id || entry.user)?.toString() === authUser?.id;
                const cp = entry.codingProfile || {};
                const platforms = cp.platforms || {};
                
                const lcInfo = platforms.leetcode?.solved || platforms.leetcode?.rating || cp.leetcode?.stats?.totalSolved;
                const cfInfo = platforms.codeforces?.solved || platforms.codeforces?.rating || cp.codeforces?.stats?.rating;
                const ccInfo = platforms.codechef?.solved || platforms.codechef?.rating || cp.codechef?.stats?.rating;
                const ghInfo = platforms.github?.commits || platforms.github?.contributions || cp.totalCommits || cp.totalContributions || entry.totalCommits;
                const hasNoPlatform = !lcInfo && !cfInfo && !ccInfo && !ghInfo;

                return (
                  <div 
                    key={entry.user?._id || index}
                    className={`grid grid-cols-3 sm:grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-gray-50 dark:hover:bg-[#1a1a2e] transition-colors ${
                      isMe ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-2">
                        {getRankBadge(entry.displayRank)}
                        <span className={`font-bold ${
                          entry.displayRank === 1 ? 'text-yellow-400' :
                          entry.displayRank === 2 ? 'text-gray-300' :
                          entry.displayRank === 3 ? 'text-amber-600' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          #{entry.displayRank}
                        </span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="col-span-2 sm:col-span-4 flex items-center gap-2 sm:gap-3 min-w-0">
                      <ProfileLink userId={entry.user?._id || entry.user}>
                        <UserAvatar user={{ avatar: entry.user?.avatar, name: entry.user?.fullName, username: entry.user?.username }} size="md" />
                      </ProfileLink>
                      <div className="min-w-0">
                        <ProfileLink userId={entry.user?._id || entry.user} className="block font-semibold text-gray-900 dark:text-white hover:text-amber-500 truncate transition-colors">
                          {entry.user?.fullName || entry.user?.username}
                          {isMe && <span className="ml-2 text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium align-middle">you</span>}
                        </ProfileLink>
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          <ProfileLink userId={entry.user?._id || entry.user} className="hover:text-amber-500 transition-colors">@{entry.user?.username}</ProfileLink>
                        </div>
                      </div>
                    </div>

                    {/* Primary Ranking Value */}
                    <div className="col-span-1 sm:col-span-2 text-center">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg ${getRankingColor()}`}>
                        {rankingType === 'codingScore' && <Zap className="w-4 h-4" />}
                        {rankingType === 'problems' && <Target className="w-4 h-4" />}
                        <span className="font-bold">{getRankingValue(entry)}</span>
                      </div>
                    </div>

                    {/* Secondary Value */}
                    <div className="hidden sm:block col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {rankingType === 'problems' ? (
                          <>
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold text-amber-500">{entry.codingScore || entry.score || 0}</span>
                          </>
                        ) : (
                          <>
                            <Target className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">{cp.totalSolved || entry.totalProblems || 0}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Platform Stats Display */}
                    <div className="hidden sm:block col-span-3">
                      <div className="flex items-center justify-center gap-3 flex-wrap">
                        {lcInfo ? (
                          <div className="flex items-center gap-1 text-orange-400" title="LeetCode Stat">
                            <PlatformIcon platform="leetcode" className="w-4 h-4" />
                            <span className="text-sm">{platforms.leetcode?.solved || platforms.leetcode?.rating || cp.leetcode?.stats?.totalSolved || cp.leetcode?.stats?.rating || '-'}</span>
                          </div>
                        ) : null}
                        {cfInfo ? (
                          <div className="flex items-center gap-1 text-blue-400" title="Codeforces Stat">
                            <PlatformIcon platform="codeforces" className="w-4 h-4" />
                            <span className="text-sm">{platforms.codeforces?.solved || platforms.codeforces?.rating || cp.codeforces?.stats?.rating || '-'}</span>
                          </div>
                        ) : null}
                        {ccInfo ? (
                          <div className="flex items-center gap-1 text-amber-500" title="CodeChef Stat">
                            <PlatformIcon platform="codechef" className="w-4 h-4" />
                            <span className="text-sm">{platforms.codechef?.solved || platforms.codechef?.rating || cp.codechef?.stats?.rating || '-'}</span>
                          </div>
                        ) : null}
                        {ghInfo ? (
                          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-300" title="GitHub Stat">
                            <PlatformIcon platform="github" className="w-4 h-4" />
                            <span className="text-sm">{platforms.github?.commits || platforms.github?.contributions || cp.totalCommits || cp.totalContributions || entry.totalCommits || '-'}</span>
                          </div>
                        ) : null}
                        {hasNoPlatform && (
                          <span className="text-gray-500 text-sm">No platforms</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {paginatedLeaderboard.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No members found matching your search</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination Component matching Global */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
                {' '}• {filteredLeaderboard.length} members
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-50 dark:bg-[#16161f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a2e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-gray-50 dark:bg-[#16161f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a2e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Informational Footer from Global Leaderboard */}
          <div className="mt-8 bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              How Coding Score is Calculated
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-[#1a1a2e] rounded-lg p-4 transition-colors">
                <div className="text-amber-500 font-bold mb-1">Problems Solved</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Up to 400 points based on total problems solved across platforms</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a1a2e] rounded-lg p-4 transition-colors">
                <div className="text-amber-500 font-bold mb-1">Platform Ratings</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Up to 300 points from LeetCode, Codeforces, and CodeChef ratings</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a1a2e] rounded-lg p-4 transition-colors">
                <div className="text-amber-500 font-bold mb-1">GitHub Activity</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Up to 150 points based on GitHub contributions</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a1a2e] rounded-lg p-4 transition-colors">
                <div className="text-amber-500 font-bold mb-1">Consistency</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Up to 150 points from streaks and metrics delta</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SocietyLeaderboardTab;
