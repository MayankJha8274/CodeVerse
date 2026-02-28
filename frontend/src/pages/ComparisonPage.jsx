import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Search, Trophy, ArrowUp, ArrowDown, Minus, Loader2, Users } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ComparisonPage = () => {
  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  // Debounced user search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await api.searchUsers(query.trim());
        setSearchResults(results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  // Fetch comparison when user is selected
  useEffect(() => {
    if (!selectedUser) {
      setComparisonData(null);
      return;
    }

    const fetchComparison = async () => {
      if (!currentUser) return;
      setComparing(true);
      setError('');
      try {
        const data = await api.compareUsers(currentUser._id || currentUser.id, selectedUser._id);
        setComparisonData(data);
      } catch (err) {
        setError('Failed to fetch comparison data. Please try again.');
        setComparisonData(null);
      } finally {
        setComparing(false);
      }
    };

    fetchComparison();
  }, [selectedUser, currentUser]);

  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setComparisonData(null);
    setError('');
  };

  const getDiffIcon = (diff) => {
    if (diff > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (diff < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getDiffColor = (diff) => {
    if (diff > 0) return 'text-green-500';
    if (diff < 0) return 'text-red-500';
    return 'text-gray-400';
  };

  const metrics = comparisonData ? [
    { label: 'Total Problems', key: 'problems', u1: comparisonData.user1.totals.problems, u2: comparisonData.user2.totals.problems, diff: comparisonData.differences.problems },
    { label: 'Total Commits', key: 'commits', u1: comparisonData.user1.totals.commits, u2: comparisonData.user2.totals.commits, diff: comparisonData.differences.commits },
    { label: 'Contests Participated', key: 'contests', u1: comparisonData.user1.totals.contests, u2: comparisonData.user2.totals.contests, diff: comparisonData.differences.contests },
    { label: 'Average Rating', key: 'rating', u1: comparisonData.user1.totals.rating, u2: comparisonData.user2.totals.rating, diff: comparisonData.differences.rating },
    { label: 'Platforms Active', key: 'platforms', u1: comparisonData.user1.totals.platformsActive, u2: comparisonData.user2.totals.platformsActive, diff: comparisonData.user1.totals.platformsActive - comparisonData.user2.totals.platformsActive },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Compare Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare your stats with another user
        </p>
      </div>

      {/* User Selection */}
      <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select a User to Compare With
        </h3>

        {/* Current selection */}
        {selectedUser && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <UserAvatar user={selectedUser} size="sm" showName showUsername />
            <button
              onClick={clearSelection}
              className="ml-auto text-gray-500 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Search */}
        {!selectedUser && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users by name or username..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-colors"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {searchQuery.trim().length >= 2 && (
              <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
                {searching ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <button
                      key={user._id}
                      onClick={() => selectUser(user)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a2e] transition-colors"
                    >
                      <UserAvatar user={user} size="md" showName showUsername />
                      <Plus className="w-5 h-5 text-amber-500" />
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center">
                    No users found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {comparing && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Comparing stats...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-600 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData && !comparing && (
        <>
          {/* Stats Table */}
          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistics Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Metric
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      You ({comparisonData.user1.username})
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {comparisonData.user2.username}
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Difference
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Winner
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr key={metric.key} className="border-b border-gray-200 dark:border-gray-700/50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        {metric.label}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-white">
                        {metric.u1.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-white">
                        {metric.u2.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-semibold ${getDiffColor(metric.diff)}`}>
                          {getDiffIcon(metric.diff)}
                          {Math.abs(metric.diff).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {metric.diff !== 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Trophy className="w-3 h-3" />
                            {comparisonData.winner[metric.key] || (metric.diff > 0 ? comparisonData.user1.username : comparisonData.user2.username)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Tie</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Bar Comparison */}
          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Visual Comparison
            </h3>
            <div className="space-y-6">
              {metrics.slice(0, 4).map((metric) => {
                const maxVal = Math.max(metric.u1, metric.u2, 1);
                const u1Pct = (metric.u1 / maxVal) * 100;
                const u2Pct = (metric.u2 / maxVal) * 100;
                return (
                  <div key={metric.key}>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{metric.label}</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-24 truncate">{comparisonData.user1.username}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${u1Pct}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white w-16 text-right">{metric.u1.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-24 truncate">{comparisonData.user2.username}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${u2Pct}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white w-16 text-right">{metric.u2.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!selectedUser && !comparing && (
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-12 border border-gray-200 dark:border-gray-800 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No user selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Search for a user above to compare your coding stats side by side.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;
