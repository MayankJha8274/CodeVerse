import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Trophy, Flame, Medal, Loader2, Code2, GitCommit,
  Swords, ChevronDown, ChevronUp, Target, Users
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SORT_OPTIONS = [
  { key: 'score', label: 'Overall Score', icon: Trophy },
  { key: 'totalSolved', label: 'Total Solved', icon: Code2 },
  { key: 'contestRating', label: 'Max Rating', icon: Swords },
  { key: 'totalContributions', label: 'Contributions', icon: GitCommit },
  { key: 'totalSubmissions', label: 'Submissions', icon: Target },
  { key: 'currentStreak', label: 'Streak', icon: Flame },
];

const PLATFORM_COLORS = {
  leetcode: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'LeetCode' },
  codeforces: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Codeforces' },
  codechef: { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'CodeChef' },
  github: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'GitHub' },
  geeksforgeeks: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'GFG' },
  hackerrank: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'HackerRank' },
  codingninjas: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'CodingNinjas' },
};

const SocietyLeaderboardTab = ({ societyId }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streak, setStreak] = useState(null);
  const [badges, setBadges] = useState([]);
  const [sortBy, setSortBy] = useState('score');
  const [expandedUser, setExpandedUser] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch leaderboard first (primary data)
      const lbRes = await api.getSocietyLeaderboard(societyId);
      setData(lbRes.data);

      // Fetch secondary data (streak & badges) — don't let failures break the whole tab
      const [streakRes, badgesRes] = await Promise.allSettled([
        api.getSocietyStreak(societyId),
        api.getSocietyBadges(societyId)
      ]);
      setStreak(streakRes.status === 'fulfilled' ? streakRes.value.data : null);
      setBadges(badgesRes.status === 'fulfilled' ? (badgesRes.value.data || []) : []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Re-sort rankings on client side
  const sortedRankings = useMemo(() => {
    if (!data?.rankings) return [];
    const sorted = [...data.rankings];
    if (sortBy === 'score') {
      sorted.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'totalSolved') {
      sorted.sort((a, b) => (b.codingProfile?.totalSolved || 0) - (a.codingProfile?.totalSolved || 0));
    } else if (sortBy === 'contestRating') {
      sorted.sort((a, b) => (b.codingProfile?.contestRating || 0) - (a.codingProfile?.contestRating || 0));
    } else if (sortBy === 'totalContributions') {
      sorted.sort((a, b) => (b.codingProfile?.totalContributions || 0) - (a.codingProfile?.totalContributions || 0));
    } else if (sortBy === 'totalSubmissions') {
      sorted.sort((a, b) => (b.codingProfile?.totalSubmissions || 0) - (a.codingProfile?.totalSubmissions || 0));
    } else if (sortBy === 'currentStreak') {
      sorted.sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));
    }
    sorted.forEach((r, i) => { r.displayRank = i + 1; });
    return sorted;
  }, [data, sortBy]);

  const getRankStyle = (rank) => {
    if (rank === 1) return 'from-yellow-500 to-amber-500 text-black';
    if (rank === 2) return 'from-gray-300 to-gray-400 text-gray-800';
    if (rank === 3) return 'from-amber-700 to-amber-800 text-white';
    return 'from-gray-600 to-gray-700 text-white';
  };

  // Compute max values for comparison bars
  const maxVals = useMemo(() => {
    if (!data?.rankings?.length) return {};
    const r = data.rankings;
    return {
      totalSolved: Math.max(...r.map(e => e.codingProfile?.totalSolved || 0), 1),
      contestRating: Math.max(...r.map(e => e.codingProfile?.contestRating || 0), 1),
      totalContributions: Math.max(...r.map(e => (e.codingProfile?.totalContributions || e.codingProfile?.totalCommits || 0)), 1),
      totalSubmissions: Math.max(...r.map(e => e.codingProfile?.totalSubmissions || 0), 1),
      totalCommits: Math.max(...r.map(e => e.codingProfile?.totalCommits || 0), 1),
      score: Math.max(...r.map(e => e.score || 0), 1),
    };
  }, [data]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;
  }

  if (error) {
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

  return (
    <div>
      {/* User Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Your Rank" value={`#${data?.currentUser?.rank || '—'}`}
          sub={`Top ${data?.currentUser?.percentile || 0}% · ${data?.currentUser?.score || 0} pts`}
          icon={Trophy} color="text-amber-500" />
        <StatCard label="Streak" value={`${streak?.currentStreak || 0}d`}
          sub={`Best: ${streak?.longestStreak || 0}d`}
          icon={Flame} color="text-orange-500" />
        <StatCard label="Badges" value={badges.length}
          sub={badges.slice(0, 4).map(b => b.badge?.icon || '🏅').join(' ') || 'None yet'}
          icon={Medal} color="text-purple-500" />
        <StatCard label="Members" value={data?.totalParticipants || 0}
          sub="competing" icon={Users} color="text-blue-500" />
      </div>

      {/* Sort by */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-xs text-gray-400 mr-1">Sort by:</span>
        {SORT_OPTIONS.map(opt => {
          const Icon = opt.icon;
          return (
            <button key={opt.key} onClick={() => setSortBy(opt.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg font-medium transition-all ${
                sortBy === opt.key
                  ? 'bg-amber-500 text-black'
                  : 'bg-gray-100 dark:bg-[#111118] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              <Icon className="w-3 h-3" /> {opt.label}
            </button>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-[#111118] text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Member</div>
          <div className="col-span-2 text-center">Questions</div>
          <div className="col-span-2 text-center">Rating</div>
          <div className="col-span-2 text-center">Contributions</div>
          <div className="col-span-2 text-center">Score</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800/30">
          {sortedRankings.map((entry) => {
            const isMe = (entry.user?._id || entry.user)?.toString() === user?.id;
            const isExpanded = expandedUser === (entry.user?._id || entry.user);
            const cp = entry.codingProfile || {};

            return (
              <div key={entry.user?._id || entry.displayRank}>
                {/* Main Row */}
                <div
                  className={`flex flex-wrap md:grid md:grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer transition-colors ${
                    isMe ? 'bg-amber-500/5' : 'hover:bg-gray-50 dark:hover:bg-[#111118]'
                  }`}
                  onClick={() => setExpandedUser(isExpanded ? null : (entry.user?._id || entry.user))}
                >
                  {/* Rank */}
                  <div className="md:col-span-1 flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getRankStyle(entry.displayRank)} flex items-center justify-center text-[10px] font-bold`}>
                      {entry.displayRank}
                    </div>
                  </div>

                  {/* User */}
                  <div className="md:col-span-3 flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {entry.user?.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center gap-1">
                        {entry.user?.fullName || entry.user?.username || 'Unknown'}
                        {isMe && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">you</span>}
                      </div>
                      <div className="text-[10px] text-gray-400">@{entry.user?.username}</div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="hidden md:block md:col-span-2 text-center">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{cp.totalSolved || 0}</div>
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/10 text-green-500">{cp.easySolved || 0}E</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-500">{cp.mediumSolved || 0}M</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-500">{cp.hardSolved || 0}H</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="hidden md:block md:col-span-2 text-center">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{cp.contestRating || 0}</div>
                    <div className="text-[10px] text-gray-400">{cp.contestsParticipated || 0} contests</div>
                  </div>

                  {/* Contributions */}
                  <div className="hidden md:block md:col-span-2 text-center">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{cp.totalContributions || cp.totalCommits || 0}</div>
                    <div className="text-[10px] text-gray-400">{cp.totalCommits || 0} commits</div>
                  </div>

                  {/* Score */}
                  <div className="md:col-span-2 flex items-center justify-between ml-auto">
                    <div>
                      <div className="text-sm font-bold text-amber-500">{entry.score?.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400">🔥{entry.currentStreak || 0}d</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50/50 dark:bg-[#111118]/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                      {/* Comparison Bars */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Coding Profile Comparison</h4>
                        <ComparisonBar label="Questions Solved" value={cp.totalSolved || 0} max={maxVals.totalSolved} color="bg-amber-500" />
                        <ComparisonBar label="Max Rating" value={cp.contestRating || 0} max={maxVals.contestRating} color="bg-blue-500" />
                        <ComparisonBar label="Contributions" value={cp.totalContributions || cp.totalCommits || 0} max={maxVals.totalContributions || maxVals.totalCommits} color="bg-green-500" />
                        <ComparisonBar label="Submissions" value={cp.totalSubmissions || 0} max={maxVals.totalSubmissions} color="bg-purple-500" />
                        <ComparisonBar label="Overall Score" value={entry.score || 0} max={maxVals.score} color="bg-amber-500" />
                      </div>

                      {/* Platform Breakdown */}
                      <div>
                        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Platform Breakdown</h4>
                        <div className="space-y-2">
                          {cp.platforms && Object.entries(cp.platforms).map(([platform, stats]) => {
                            const pCfg = PLATFORM_COLORS[platform] || { bg: 'bg-gray-500/10', text: 'text-gray-500', label: platform };
                            return (
                              <div key={platform} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-gray-800/30">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${pCfg.bg} ${pCfg.text}`}>
                                  {pCfg.label}
                                </span>
                                <div className="flex-1 flex items-center gap-3 text-[11px] text-gray-500">
                                  {(stats.solved > 0 || platform !== 'github') && <span>{stats.solved || 0} solved</span>}
                                  {stats.rating > 0 && <span className="text-amber-500 font-medium">⭐ {stats.rating}</span>}
                                  {stats.commits > 0 && <span>{stats.commits} commits</span>}
                                  {stats.contributions > 0 && <span>{stats.contributions} contrib</span>}
                                </div>
                              </div>
                            );
                          })}
                          {(!cp.platforms || Object.keys(cp.platforms).length === 0) && (
                            <div className="text-xs text-gray-400 py-2">No platform data linked yet</div>
                          )}
                        </div>

                        {/* Score breakdown */}
                        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">Score Breakdown</h4>
                        <div className="flex flex-wrap gap-2">
                          {entry.breakdown && Object.entries(entry.breakdown).map(([key, val]) => (
                            <div key={key} className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800/50 text-[10px]">
                              <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedRankings.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No rankings available yet</p>
            <p className="text-xs mt-1">Members need to link their coding platforms</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components ---

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-4">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>
  </div>
);

const ComparisonBar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-500">{label}</span>
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default SocietyLeaderboardTab;
