import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Flame, Medal, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SocietyLeaderboardTab = ({ societyId }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(null);
  const [badges, setBadges] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lbRes, streakRes, badgesRes] = await Promise.all([
        api.getSocietyLeaderboard(societyId),
        api.getSocietyStreak(societyId),
        api.getSocietyBadges(societyId)
      ]);
      setData(lbRes.data);
      setStreak(streakRes.data);
      setBadges(badgesRes.data || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const getRankStyle = (rank) => {
    if (rank === 1) return 'from-yellow-500 to-amber-500 text-black';
    if (rank === 2) return 'from-gray-300 to-gray-400 text-gray-800';
    if (rank === 3) return 'from-amber-700 to-amber-800 text-white';
    return 'from-gray-600 to-gray-700 text-white';
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;
  }

  return (
    <div>
      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Rank */}
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Your Rank</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            #{data?.currentUser?.rank || '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Top {data?.currentUser?.percentile || 0}% · {data?.currentUser?.score || 0} pts
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {streak?.currentStreak || 0} <span className="text-sm font-normal text-gray-400">days</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Best: {streak?.longestStreak || 0} days · {streak?.totalActiveDays || 0} total
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Badges Earned</span>
            <Medal className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {badges.length}
          </div>
          <div className="flex gap-1 mt-1">
            {badges.slice(0, 5).map((b, i) => (
              <span key={i} title={b.badge?.name} className="text-sm">{b.badge?.icon || '🏅'}</span>
            ))}
            {badges.length > 5 && <span className="text-xs text-gray-400 ml-1">+{badges.length - 5}</span>}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800/50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Rankings</h3>
          <span className="text-xs text-gray-400">{data?.totalParticipants || 0} members</span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
          {data?.rankings?.map((entry) => {
            const isMe = (entry.user?._id || entry.user)?.toString() === user?.id;
            return (
              <div
                key={entry.user?._id || entry.rank}
                className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                  isMe ? 'bg-amber-500/5' : 'hover:bg-gray-50 dark:hover:bg-[#111118]'
                }`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankStyle(entry.rank)} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                  {entry.rank}
                </div>

                {/* User */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {entry.user?.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center gap-1">
                      {entry.user?.username || 'Unknown'}
                      {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">you</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 capitalize">{entry.role?.replace('_', ' ')}</div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
                  <span title="Problems Solved">🧩 {entry.breakdown?.problemsSolved || 0}</span>
                  <span title="Messages">💬 {entry.breakdown?.chatContribution || 0}</span>
                  <span title="Events">🎪 {entry.breakdown?.eventParticipation || 0}</span>
                  <span title="Streak">🔥 {entry.currentStreak || 0}d</span>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-amber-500">{entry.score?.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">pts</div>
                </div>
              </div>
            );
          })}
        </div>

        {(!data?.rankings || data.rankings.length === 0) && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No rankings available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocietyLeaderboardTab;
