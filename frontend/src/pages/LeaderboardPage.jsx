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
  Building2,
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

// Platform icons mapping
const platformIcons = {
  leetcode: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
    </svg>
  ),
  codeforces: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 7.5A1.5 1.5 0 0 1 6 9v10.5a1.5 1.5 0 0 1-3 0V9a1.5 1.5 0 0 1 1.5-1.5zm5.25-3a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-3 0V6a1.5 1.5 0 0 1 1.5-1.5zm5.25 6a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-3 0v-6a1.5 1.5 0 0 1 1.5-1.5zM19.5 3a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-3 0v-15A1.5 1.5 0 0 1 19.5 3z"/>
    </svg>
  ),
  github: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
};

// Ranking type configurations
const rankingTypes = [
  { id: 'cScore', label: 'C-Score', icon: Zap, color: 'amber', description: 'Comprehensive Score' },
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
  const [filterType, setFilterType] = useState('global'); // global, institution
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [rankingType, setRankingType] = useState('cScore'); // cScore, problems, leetcode, codeforces, codechef, github

  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage, filterType, institutionFilter, rankingType]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let data;
      if (filterType === 'institution' && institutionFilter) {
        data = await api.getInstitutionLeaderboard(institutionFilter, currentPage, rankingType);
        // Transform institution data to match global structure
        data = {
          leaderboard: data.leaderboard,
          topThree: data.leaderboard.slice(0, 3),
          currentUser: leaderboardData?.currentUser,
          sortBy: rankingType,
          pagination: { page: currentPage, totalPages: Math.ceil(data.totalUsers / 100) }
        };
      } else {
        data = await api.getGlobalLeaderboard(currentPage, rankingType);
      }
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
      case 'cScore': return entry.cScore;
      case 'problems': return entry.totalProblems;
      case 'leetcode': return entry.leetcodeRating;
      case 'codeforces': return entry.codeforcesRating;
      case 'codechef': return entry.codechefRating;
      case 'github': return entry.githubContributions;
      default: return entry.cScore;
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
      <div className="min-h-screen bg-[#0d0d14] p-6">
        <SkeletonLoader type="list" />
      </div>
    );
  }

  const topThree = leaderboardData?.topThree || [];
  const currentUser = leaderboardData?.currentUser;

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Global Leaderboard
          </h1>
          <p className="text-gray-400">
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
                    <span className="text-4xl font-bold text-white">#{currentUser.rank}</span>
                    <div className="text-sm text-gray-400">
                      out of {leaderboardData?.pagination?.totalUsers || 0} coders
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">{currentUser.cScore}</div>
                  <div className="text-sm text-gray-400">C-Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{currentUser.totalProblems}</div>
                  <div className="text-sm text-gray-400">Problems</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{currentUser.percentile || Math.round(((leaderboardData?.pagination?.totalUsers - currentUser.rank) / leaderboardData?.pagination?.totalUsers) * 100)}%</div>
                  <div className="text-sm text-gray-400">Top Percentile</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranking Type Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 bg-[#16161f] rounded-xl p-3">
            {rankingTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => { setRankingType(type.id); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  rankingType === type.id 
                    ? type.id === 'cScore' ? 'bg-amber-500 text-black font-semibold' :
                      type.id === 'problems' ? 'bg-green-500 text-black font-semibold' :
                      type.id === 'leetcode' ? 'bg-orange-500 text-black font-semibold' :
                      type.id === 'codeforces' ? 'bg-blue-500 text-black font-semibold' :
                      type.id === 'codechef' ? 'bg-amber-600 text-black font-semibold' :
                      'bg-gray-400 text-black font-semibold'
                    : 'bg-[#1a1a2e] text-gray-300 hover:bg-[#252536]'
                }`}
              >
                {type.icon ? <type.icon className="w-4 h-4" /> : 
                  type.id === 'leetcode' ? platformIcons.leetcode :
                  type.id === 'codeforces' ? platformIcons.codeforces :
                  type.id === 'github' ? platformIcons.github :
                  type.id === 'codechef' ? <Star className="w-4 h-4" /> : null
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
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top Performers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="text-lg font-semibold text-white mb-1">{topThree[1]?.fullName || topThree[1]?.username}</div>
                  <div className="text-sm text-gray-400 mb-3">@{topThree[1]?.username}</div>
                  <div className={`text-2xl font-bold ${getRankingColor().split(' ')[0]}`}>{getRankingValue(topThree[1])}</div>
                  <div className="text-xs text-gray-500">{getRankingLabel()}</div>
                </div>
              </div>

              {/* 1st Place */}
              <div className={`bg-gradient-to-br ${getRankColor(1)} border rounded-xl p-6 order-0 md:order-2 transform md:scale-110`}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <Crown className="w-10 h-10 text-yellow-400" />
                    </div>
                    <UserAvatar user={{ avatar: topThree[0]?.avatar, name: topThree[0]?.fullName }} size="xl" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">#1</div>
                  <div className="text-xl font-semibold text-white mb-1">{topThree[0]?.fullName || topThree[0]?.username}</div>
                  <div className="text-sm text-gray-400 mb-3">@{topThree[0]?.username}</div>
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
                  <div className="text-lg font-semibold text-white mb-1">{topThree[2]?.fullName || topThree[2]?.username}</div>
                  <div className="text-sm text-gray-400 mb-3">@{topThree[2]?.username}</div>
                  <div className={`text-2xl font-bold ${getRankingColor().split(' ')[0]}`}>{getRankingValue(topThree[2])}</div>
                  <div className="text-xs text-gray-500">{getRankingLabel()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-[#16161f] rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filter Type Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => { setFilterType('global'); setInstitutionFilter(''); }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  filterType === 'global' 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-[#1a1a2e] text-gray-300 hover:bg-[#252536]'
                }`}
              >
                <Globe className="w-4 h-4" />
                Global
              </button>
              <button
                onClick={() => setFilterType('institution')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  filterType === 'institution' 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-[#1a1a2e] text-gray-300 hover:bg-[#252536]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                By Institution
              </button>
            </div>

            {/* Institution Filter Input */}
            {filterType === 'institution' && (
              <input
                type="text"
                placeholder="Enter institution name..."
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLeaderboard()}
                className="flex-1 bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            )}

            {/* Search */}
            <div className="flex-1 md:max-w-xs relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#16161f] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-[#1a1a2e] text-sm font-medium text-gray-400 border-b border-gray-700">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">User</div>
            <div className="col-span-2 text-center">{getRankingLabel()}</div>
            <div className="col-span-2 text-center">{rankingType === 'problems' ? 'C-Score' : 'Problems'}</div>
            <div className="col-span-3 text-center">Platform Stats</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-800">
            {filteredLeaderboard.map((entry, index) => (
              <div 
                key={entry.id || index}
                className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#1a1a2e] transition-colors ${
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
                      'text-white'
                    }`}>
                      #{entry.rank}
                    </span>
                  </div>
                </div>

                {/* User Info */}
                <div className="col-span-4 flex items-center gap-3">
                  <UserAvatar user={{ avatar: entry.avatar, name: entry.fullName }} size="md" />
                  <div>
                    <div className="font-semibold text-white">{entry.fullName || entry.username}</div>
                    <div className="text-sm text-gray-400">
                      @{entry.username}
                      {entry.institution && (
                        <span className="ml-2 text-gray-500">• {entry.institution}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Ranking Value */}
                <div className="col-span-2 text-center">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg ${getRankingColor()}`}>
                    {rankingType === 'cScore' && <Zap className="w-4 h-4" />}
                    {rankingType === 'problems' && <Target className="w-4 h-4" />}
                    <span className="font-bold">{getRankingValue(entry)}</span>
                  </div>
                </div>

                {/* Secondary Value */}
                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {rankingType === 'problems' ? (
                      <>
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-amber-500">{entry.cScore}</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 text-green-500" />
                        <span className="font-semibold text-white">{entry.totalProblems}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Platform Stats */}
                <div className="col-span-3">
                  <div className="flex items-center justify-center gap-4">
                    {entry.platforms?.leetcode > 0 && (
                      <div className="flex items-center gap-1 text-orange-400" title="LeetCode">
                        {platformIcons.leetcode}
                        <span className="text-sm">{entry.platforms.leetcode}</span>
                      </div>
                    )}
                    {entry.platforms?.codeforces > 0 && (
                      <div className="flex items-center gap-1 text-blue-400" title="Codeforces">
                        {platformIcons.codeforces}
                        <span className="text-sm">{entry.platforms.codeforces}</span>
                      </div>
                    )}
                    {entry.platforms?.github > 0 && (
                      <div className="flex items-center gap-1 text-gray-300" title="GitHub Contributions">
                        {platformIcons.github}
                        <span className="text-sm">{entry.platforms.github}</span>
                      </div>
                    )}
                    {(!entry.platforms?.leetcode && !entry.platforms?.codeforces && !entry.platforms?.github) && (
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
        {leaderboardData?.pagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Page {leaderboardData.pagination.page} of {leaderboardData.pagination.totalPages}
              {' '}• {leaderboardData.pagination.totalUsers} total users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#16161f] border border-gray-700 rounded-lg text-white hover:bg-[#1a1a2e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(leaderboardData.pagination.totalPages, p + 1))}
                disabled={currentPage >= leaderboardData.pagination.totalPages}
                className="px-4 py-2 bg-[#16161f] border border-gray-700 rounded-lg text-white hover:bg-[#1a1a2e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Score Breakdown Info */}
        <div className="mt-8 bg-[#16161f] rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            How C-Score is Calculated
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1a1a2e] rounded-lg p-4">
              <div className="text-amber-500 font-bold mb-1">Problems Solved</div>
              <div className="text-sm text-gray-400">Up to 400 points based on total problems solved across all platforms</div>
            </div>
            <div className="bg-[#1a1a2e] rounded-lg p-4">
              <div className="text-amber-500 font-bold mb-1">Platform Ratings</div>
              <div className="text-sm text-gray-400">Up to 300 points from LeetCode, Codeforces, and CodeChef ratings</div>
            </div>
            <div className="bg-[#1a1a2e] rounded-lg p-4">
              <div className="text-amber-500 font-bold mb-1">GitHub Activity</div>
              <div className="text-sm text-gray-400">Up to 150 points based on GitHub contributions</div>
            </div>
            <div className="bg-[#1a1a2e] rounded-lg p-4">
              <div className="text-amber-500 font-bold mb-1">Consistency</div>
              <div className="text-sm text-gray-400">Up to 150 points from streaks and contest participation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
