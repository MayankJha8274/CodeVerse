import React from 'react';
import { ExternalLink, TrendingUp } from 'lucide-react';

const platformLogos = {
  leetcode: 'https://leetcode.com/favicon.ico',
  codeforces: 'https://codeforces.org/favicon.ico',
  codechef: 'https://www.codechef.com/favicon.ico',
  github: 'https://github.com/favicon.ico',
  geeksforgeeks: 'https://www.geeksforgeeks.org/favicon.ico',
  hackerrank: 'https://www.hackerrank.com/favicon.ico'
};

const PlatformCard = ({ platform, stats, onViewDetails }) => {
  const getPlatformColor = (platform) => {
    const colors = {
      leetcode: 'from-yellow-500 to-orange-500',
      codeforces: 'from-blue-500 to-indigo-600',
      codechef: 'from-brown-500 to-amber-600',
      github: 'from-gray-700 to-gray-900',
      geeksforgeeks: 'from-green-500 to-emerald-600',
      hackerrank: 'from-green-600 to-teal-600'
    };
    return colors[platform] || 'from-gray-500 to-gray-700';
  };

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow group">
      <div className={`h-2 bg-gradient-to-r ${getPlatformColor(platform)}`}></div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src={platformLogos[platform]} 
              alt={platform}
              className="w-8 h-8"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
              {platform}
            </h3>
          </div>
          <button
            onClick={onViewDetails}
            className="text-gray-400 hover:text-primary-500 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {platform === 'leetcode' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Solved</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalSolved}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Easy</div>
                  <div className="text-sm font-semibold text-green-500">{stats.easy}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Medium</div>
                  <div className="text-sm font-semibold text-yellow-500">{stats.medium}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Hard</div>
                  <div className="text-sm font-semibold text-red-500">{stats.hard}</div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-dark-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rating</span>
                <span className="text-lg font-bold text-primary-500">{stats.rating}</span>
              </div>
            </>
          )}

          {platform === 'codeforces' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rating</span>
                <span className="text-lg font-bold text-primary-500">{stats.rating}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Max Rating</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.maxRating}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rank</span>
                <span className="text-sm font-semibold text-purple-500">{stats.rank}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-dark-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Problems Solved</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.problemsSolved}</span>
              </div>
            </>
          )}

          {platform === 'codechef' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rating</span>
                <span className="text-lg font-bold text-primary-500">{stats.rating}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Stars</span>
                <span className="text-sm font-semibold text-yellow-500">{stats.stars}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-dark-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Problems Solved</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.problemsSolved}</span>
              </div>
            </>
          )}

          {platform === 'github' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Commits</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalCommits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pull Requests</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.totalPRs}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-dark-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Repositories</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalRepos}</span>
              </div>
            </>
          )}

          {(platform === 'geeksforgeeks' || platform === 'hackerrank') && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Problems Solved</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.problemsSolved}</span>
              </div>
              {stats.rank && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rank</span>
                  <span className="text-sm font-semibold text-purple-500">{stats.rank}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformCard;
