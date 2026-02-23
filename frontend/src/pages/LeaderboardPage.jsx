import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users, 
  Search,
  ChevronLeft,
  ChevronRight,
  Globe,
  Star,
  Zap,
  Award,
  Target
} from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PlatformIcon } from '../utils/platformConfig';

// Ranking type configurations
const rankingTypes = [
  { id: 'codingScore', label: 'Coding-Score', icon: Zap, color: 'amber', description: 'Comprehensive Score' },
  { id: 'problems', label: 'Problems', icon: Target, color: 'green', description: 'Total Questions Solved' },
  { id: 'leetcode', label: 'LeetCode', icon: null, color: 'orange', description: 'LeetCode Rating' },
  { id: 'codeforces', label: 'Codeforces', icon: null, color: 'blue', description: 'Codeforces Rating' },
  { id: 'codechef', label: 'CodeChef', icon: null, color: 'amber', description: 'CodeChef Rating' },
  { id: 'github', label: 'GitHub', icon: null, color: 'gray', description: 'GitHub Contributions' }
];

const LeaderboardPage = () => {
  const { user: authUser } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rankingType, setRankingType] = useState('codingScore'); // codingScore, problems, leetcode, codeforces, codechef, github

  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage, rankingType]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getGlobalLeaderboard(currentPage, rankingType);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get the value to display based on ranking type
  const getRankingValue = (entry) => {
    switch (rankingType) {
      case 'codingScore': return entry.codingScore;
      case 'problems': return entry.totalProblems;
      case 'leetcode': return entry.leetcodeRating;
      case 'codeforces': return entry.codeforcesRating;
      case 'codechef': return entry.codechefRating;
      case 'github': return entry.githubContributions;
      default: return entry.codingScore;
    }
  };

  // Get the label for the ranking value
  const getRankingLabel = () => {
    const type = rankingTypes.find(t => t.id === rankingType);
    return type?.label || 'Score';
  };

  // Get the color for the ranking type
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

  const filteredLeaderboard = leaderboardData?.leaderboard?.filter(entry =>
    entry.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.institution?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading && !leaderboardData) {
    return (
      <div className="min-h-full bg-white dark:bg-[#0d0d14] transition-colors">
        <SkeletonLoader type="list" />
      </div>
    );
  }

  const topThree = leaderboardData?.topThree || [];
  const currentUser = leaderboardData?.currentUser;

  return (
    <div className="min-h-full bg-white dark:bg-[#0d0d14] text-gray-900 dark:text-white transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Global Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compete with coders worldwide and climb the ranks
          </p>
        </div>

        {/* Current User Stats Card */}
        {currentUser && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <UserAvatar user={{ avatar: currentUser.avatar, name: currentUser.fullName }} size="lg" />
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
                    <Star className="w-4 h-4 text-black" />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-amber-400 font-medium mb-1">Your Rank</div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">#{currentUser.rank}</span>
                    <div className="text-sm text-gray-400">
                      out of {leaderboardData?.pagination?.totalUsers || 0} coders
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">{currentUser.codingScore}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Coding-Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentUser.totalProblems}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Problems</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{currentUser.percentile || Math.round(((leaderboardData?.pagination?.totalUsers - currentUser.rank) / leaderboardData?.pagination?.totalUsers) * 100)}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Top Percentile</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranking Type Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-[#16161f] rounded-xl p-3 transition-colors">
            {rankingTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => { setRankingType(type.id); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  rankingType === type.id 
                    ? type.id === 'codingScore' ? 'bg-amber-500 text-black font-semibold' :
                      type.id === 'problems' ? 'bg-green-500 text-black font-semibold' :
                      type.id === 'leetcode' ? 'bg-orange-500 text-black font-semibold' :
                      type.id === 'codeforces' ? 'bg-blue-500 text-black font-semibold' :
                      type.id === 'codechef' ? 'bg-amber-600 text-black font-semibold' :
                      'bg-gray-400 text-black font-semibold'
                    : 'bg-gray-100 dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252536] transition-colors'
                }`}
              >
                {type.icon ? <type.icon className="w-4 h-4" /> : 
                  ['leetcode', 'codeforces', 'github', 'codechef'].includes(type.id) 
                    ? <PlatformIcon platform={type.id} className="w-4 h-4" />
                    : null
                }
                {type.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2 ml-2">
            {rankingTypes.find(t => t.id === rankingType)?.description}
          </p>
        </div>

        {/* Top 3 Podium */}
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
                    <UserAvatar user={{ avatar: topThree[1]?.avatar, name: topThree[1]?.fullName }} size="xl" />
                    <div className="absolute -top-2 -right-2">
                      <Medal className="w-8 h-8 text-gray-300" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-300 mb-1">#2</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{topThree[1]?.fullName || topThree[1]?.username}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">@{topThree[1]?.username}</div>
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
                    <UserAvatar user={{ avatar: topThree[0]?.avatar, name: topThree[0]?.fullName }} size="xl" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">#1</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{topThree[0]?.fullName || topThree[0]?.username}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">@{topThree[0]?.username}</div>
                  <div className={`text-3xl font-bold ${getRankingColor().split(' ')[0]}`}>{getRankingValue(topThree[0])}</div>
                  <div className="text-xs text-gray-500">{getRankingLabel()}</div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className={`bg-gradient-to-br ${getRankColor(3)} border rounded-xl p-6 order-2 md:order-3`}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <UserAvatar user={{ avatar: topThree[2]?.avatar, name: topThree[2]?.fullName }} size="xl" />
                    <div className="absolute -top-2 -right-2">
                      <Medal className="w-8 h-8 text-amber-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-amber-600 mb-1">#3</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{topThree[2]?.fullName || topThree[2]?.username}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">@{topThree[2]?.username}</div>
                  <div className={`text-2xl font-bold ${getRankingColor().split(' ')[0]}`}>{getRankingValue(topThree[2])}</div>
                  <div className="text-xs text-gray-500">{getRankingLabel()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-gray-50 dark:bg-[#16161f] rounded-xl p-4 mb-6 transition-colors">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filter Type Label */}
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-lg flex items-center gap-2 bg-amber-500 text-black"
              >
                <Globe className="w-4 h-4" />
                Global
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 md:max-w-xs relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-[#16161f] rounded-xl overflow-hidden transition-colors">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-gray-100 dark:bg-[#1a1a2e] text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 transition-colors">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">User</div>
            <div className="col-span-2 text-center">{getRankingLabel()}</div>
            <div className="col-span-2 text-center">{rankingType === 'problems' ? 'Coding-Score' : 'Problems'}</div>
            <div className="col-span-3 text-center">Platform Stats</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredLeaderboard.map((entry, index) => (
              <div 
                key={entry.id || index}
                className={`grid grid-cols-3 sm:grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-gray-50 dark:hover:bg-[#1a1a2e] transition-colors ${
                  entry.id === authUser?.id ? 'bg-amber-500/10 border-l-4 border-amber-500' : ''
                }`}
              >
                {/* Rank */}
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    {getRankBadge(entry.rank)}
                    <span className={`font-bold ${
                      entry.rank === 1 ? 'text-yellow-400' :
                      entry.rank === 2 ? 'text-gray-300' :
                      entry.rank === 3 ? 'text-amber-600' :
                      'text-gray-900 dark:text-white'
                    }`}>
                      #{entry.rank}
                    </span>
                  </div>
                </div>

                {/* User Info */}
                <div className="col-span-2 sm:col-span-4 flex items-center gap-2 sm:gap-3 min-w-0">
                  <UserAvatar user={{ avatar: entry.avatar, name: entry.fullName }} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{entry.fullName || entry.username}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      @{entry.username}
                      {entry.institution && (
                        <span className="ml-2 text-gray-500">• {entry.institution}</span>
                      )}
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
                        <span className="font-semibold text-amber-500">{entry.codingScore}</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 text-green-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">{entry.totalProblems}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Platform Stats */}
                <div className="hidden sm:block col-span-3">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {entry.platforms?.leetcode > 0 && (
                      <div className="flex items-center gap-1 text-orange-400" title={`LeetCode: ${entry.platforms.leetcode} solved`}>
                        <PlatformIcon platform="leetcode" className="w-4 h-4" />
                        <span className="text-sm">{entry.platforms.leetcode}</span>
                      </div>
                    )}
                    {entry.platforms?.codeforces > 0 && (
                      <div className="flex items-center gap-1 text-blue-400" title={`Codeforces: ${entry.platforms.codeforces} solved`}>
                        <PlatformIcon platform="codeforces" className="w-4 h-4" />
                        <span className="text-sm">{entry.platforms.codeforces}</span>
                      </div>
                    )}
                    {entry.platforms?.codechef > 0 && (
                      <div className="flex items-center gap-1 text-amber-500" title={`CodeChef: ${entry.platforms.codechef} solved`}>
                        <PlatformIcon platform="codechef" className="w-4 h-4" />
                        <span className="text-sm">{entry.platforms.codechef}</span>
                      </div>
                    )}
                    {entry.platforms?.geeksforgeeks > 0 && (
                      <div className="flex items-center gap-1 text-green-500" title={`GFG: ${entry.platforms.geeksforgeeks} solved`}>
                        <PlatformIcon platform="geeksforgeeks" className="w-4 h-4" />
                        <span className="text-sm">{entry.platforms.geeksforgeeks}</span>
                      </div>
                    )}
                    {entry.platforms?.hackerrank > 0 && (
                      <div className="flex items-center gap-1 text-emerald-400" title={`HackerRank: ${entry.platforms.hackerrank} solved`}>
                        <PlatformIcon platform="hackerrank" className="w-4 h-4" />
                        <span className="text-sm">{entry.platforms.hackerrank}</span>
                      </div>
                    )}
                    {entry.platforms?.github > 0 && (
                      <div className="flex items-center gap-1 text-gray-400 dark:text-gray-300" title={`GitHub: ${entry.platforms.github} contributions`}>
                        <PlatformIcon platform="github" className="w-4 h-4" />
                        <span className="text-sm">{entry.platforms.github}</span>
                      </div>
                    )}
                    {(!entry.platforms?.leetcode && !entry.platforms?.codeforces && !entry.platforms?.codechef && !entry.platforms?.geeksforgeeks && !entry.platforms?.hackerrank && !entry.platforms?.github) && (
                      <span className="text-gray-500 text-sm">No platforms linked</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredLeaderboard.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {leaderboardData?.pagination && leaderboardData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Page {leaderboardData.pagination.page} of {leaderboardData.pagination.totalPages}
              {' '}• {leaderboardData.pagination.totalUsers} total users
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
                onClick={() => setCurrentPage(p => Math.min(leaderboardData.pagination.totalPages, p + 1))}
                disabled={currentPage >= leaderboardData.pagination.totalPages}
                className="px-4 py-2 bg-gray-50 dark:bg-[#16161f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a2e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Score Breakdown Info */}
        <div className="mt-8 bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            How Coding-Score is Calculated
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-[#1a1a2e] rounded-lg p-4 transition-colors">
              <div className="text-amber-500 font-bold mb-1">Problems Solved</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Up to 400 points based on total problems solved across all platforms</div>
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
              <div className="text-sm text-gray-600 dark:text-gray-400">Up to 150 points from streaks and contest participation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
