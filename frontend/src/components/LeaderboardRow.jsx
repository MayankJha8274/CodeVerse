import React from 'react';
import UserAvatar from './UserAvatar';
import { Trophy, TrendingUp } from 'lucide-react';

const LeaderboardRow = ({ rank, user, totalProblems, weeklyProblems, avgRating, score }) => {
  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-400';
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-yellow-900/20';
    if (rank === 2) return 'bg-gray-800/50';
    if (rank === 3) return 'bg-orange-900/20';
    return '';
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a2e] transition-colors ${getRankBg(rank)}`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${rank <= 3 ? 'bg-gray-50 dark:bg-[#1a1a2e] shadow-sm' : ''} transition-colors`}>
        {rank <= 3 ? (
          <Trophy className={`w-5 h-5 ${getRankColor(rank)}`} />
        ) : (
          <span className={`font-bold ${getRankColor(rank)}`}>
            {rank}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <UserAvatar user={user} size="md" showName showUsername />
      </div>

      <div className="hidden md:flex items-center gap-8">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Total</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{totalProblems}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Weekly</div>
          <div className="text-sm font-semibold text-green-500">{weeklyProblems}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Rating</div>
          <div className="text-sm font-semibold text-amber-500">{avgRating}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-xs text-gray-500 mb-1">Score</div>
        <div className="text-lg font-bold text-gray-900 dark:text-white">{score}</div>
      </div>
    </div>
  );
};

export default LeaderboardRow;
