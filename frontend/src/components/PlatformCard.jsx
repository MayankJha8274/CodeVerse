import React from 'react';
import { ExternalLink, TrendingUp } from 'lucide-react';
import PLATFORM_CONFIG, { PlatformIcon, getPlatformName } from '../utils/platformConfig';

const PlatformCard = ({ platform, stats, onViewDetails }) => {
  const config = PLATFORM_CONFIG[platform];
  const gradient = config?.gradient || 'from-gray-500 to-gray-700';

  return (
    <div className="bg-[#16161f] rounded-xl overflow-hidden hover:bg-[#1a1a2e] transition-colors group">
      <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={platform} className="w-8 h-8" color={config?.color} />
            <h3 className="text-xl font-semibold text-white">
              {getPlatformName(platform)}
            </h3>
          </div>
          <button
            onClick={onViewDetails}
            className="text-gray-400 hover:text-amber-500 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {platform === 'leetcode' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Solved</span>
                <span className="text-lg font-bold text-white">{stats.totalSolved}</span>
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
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="text-sm text-gray-400">Rating</span>
                <span className="text-lg font-bold text-amber-500">{stats.rating}</span>
              </div>
            </>
          )}

          {platform === 'codeforces' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Rating</span>
                <span className="text-lg font-bold text-amber-500">{stats.rating}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Max Rating</span>
                <span className="text-sm font-semibold text-white">{stats.maxRating}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Rank</span>
                <span className="text-sm font-semibold text-purple-500">{stats.rank}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="text-sm text-gray-400">Problems Solved</span>
                <span className="text-lg font-bold text-white">{stats.problemsSolved}</span>
              </div>
            </>
          )}

          {platform === 'codechef' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Rating</span>
                <span className="text-lg font-bold text-amber-500">{stats.rating}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Stars</span>
                <span className="text-sm font-semibold text-yellow-500">{stats.stars}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="text-sm text-gray-400">Problems Solved</span>
                <span className="text-lg font-bold text-white">{stats.problemsSolved}</span>
              </div>
            </>
          )}

          {platform === 'github' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Contributions</span>
                <span className="text-lg font-bold text-white">{stats.totalContributions || stats.allTimeContributions || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Pull Requests</span>
                <span className="text-sm font-semibold text-white">{stats.totalPRs}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="text-sm text-gray-400">Repositories</span>
                <span className="text-lg font-bold text-white">{stats.totalRepos}</span>
              </div>
            </>
          )}

          {(platform === 'geeksforgeeks' || platform === 'hackerrank') && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Problems Solved</span>
                <span className="text-lg font-bold text-white">{stats.problemsSolved || 0}</span>
              </div>
              
              {platform === 'geeksforgeeks' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Coding Score</span>
                    <span className="text-sm font-semibold text-yellow-600">{stats.codingScore || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Institute Rank</span>
                    <span className="text-sm font-semibold text-purple-500">{stats.instituteRank || 0}</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformCard;
