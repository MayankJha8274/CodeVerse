import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChartCard from '../components/ChartCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ExternalLink, TrendingUp, Calendar, Award } from 'lucide-react';
import api from '../services/api';

const PlatformDetailPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'leetcode');
  const [platformData, setPlatformData] = useState(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'leetcode', label: 'LeetCode', color: 'from-yellow-500 to-orange-500' },
    { id: 'codeforces', label: 'Codeforces', color: 'from-blue-500 to-indigo-600' },
    { id: 'codechef', label: 'CodeChef', color: 'from-brown-500 to-amber-600' },
    { id: 'github', label: 'GitHub', color: 'from-gray-700 to-gray-900' },
    { id: 'geeksforgeeks', label: 'GeeksforGeeks', color: 'from-green-500 to-emerald-600' },
    { id: 'hackerrank', label: 'HackerRank', color: 'from-green-600 to-teal-600' }
  ];

  useEffect(() => {
    const fetchPlatformData = async () => {
      setLoading(true);
      try {
        const data = await api.getPlatformStats(activeTab);
        setPlatformData(data);
      } catch (error) {
        console.error('Failed to fetch platform data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatformData();
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const getDifficultyColor = (difficulty) => {
    if (typeof difficulty === 'string') {
      if (difficulty === 'easy') return 'text-green-500';
      if (difficulty === 'medium') return 'text-yellow-500';
      if (difficulty === 'hard') return 'text-red-500';
    }
    // For codeforces rating-based difficulty
    const rating = parseInt(difficulty);
    if (rating <= 1200) return 'text-green-500';
    if (rating <= 1600) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderLeetCodeContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Solved</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{platformData.totalSolved}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Easy</div>
          <div className="text-3xl font-bold text-green-500">{platformData.easy}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Medium</div>
          <div className="text-3xl font-bold text-yellow-500">{platformData.medium}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Hard</div>
          <div className="text-3xl font-bold text-red-500">{platformData.hard}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Submission Activity" subtitle="Last 6 days">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={platformData.submissions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#FFA116" fill="#FFA116" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {platformData.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {activity.problem}
                  </div>
                  <div className="text-sm text-gray-500">{activity.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${getDifficultyColor(activity.difficulty)}`}>
                    {activity.difficulty}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'solved'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCodeforcesContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Rating</div>
          <div className="text-3xl font-bold text-primary-500">{platformData.rating}</div>
          <div className="text-sm text-gray-500 mt-1">Max: {platformData.maxRating}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rank</div>
          <div className="text-3xl font-bold text-purple-500">{platformData.rank}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Contests</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{platformData.contestsParticipated}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Problems</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{platformData.problemsSolved}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Rating History" subtitle="Contest performance">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={platformData.ratingHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="contest" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line type="monotone" dataKey="rating" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {platformData.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {activity.problem}
                  </div>
                  <div className="text-sm text-gray-500">{activity.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${getDifficultyColor(activity.difficulty)}`}>
                    {activity.difficulty}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'solved'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGitHubContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Commits</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{platformData.totalCommits}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pull Requests</div>
          <div className="text-3xl font-bold text-green-500">{platformData.totalPRs}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Issues</div>
          <div className="text-3xl font-bold text-blue-500">{platformData.totalIssues}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Repositories</div>
          <div className="text-3xl font-bold text-purple-500">{platformData.totalRepos}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Contribution Activity" subtitle="Last 6 days">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={platformData.contributions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#6B7280" fill="#6B7280" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Repositories
          </h3>
          <div className="space-y-3">
            {platformData.topRepos.map((repo, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {repo.name}
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-500">{repo.language}</div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Award className="w-4 h-4" />
                  <span className="font-semibold">{repo.stars}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOtherPlatformContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Problems Solved</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{platformData.problemsSolved}</div>
        </div>
        {platformData.rating && (
          <div className="card p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {activeTab === 'codechef' ? 'Rating' : 'Score'}
            </div>
            <div className="text-3xl font-bold text-primary-500">{platformData.rating || platformData.totalScore}</div>
          </div>
        )}
        {platformData.rank && (
          <div className="card p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rank</div>
            <div className="text-3xl font-bold text-purple-500">{platformData.rank}</div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {platformData.recentActivity?.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {activity.problem}
                </div>
                <div className="text-sm text-gray-500">{activity.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${getDifficultyColor(activity.difficulty)}`}>
                  {activity.difficulty}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  activity.status === 'solved'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Platform Details
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View detailed statistics for each platform
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} type="card" />)}
          </div>
          <SkeletonLoader type="chart" />
        </div>
      ) : (
        <>
          {activeTab === 'leetcode' && renderLeetCodeContent()}
          {activeTab === 'codeforces' && renderCodeforcesContent()}
          {activeTab === 'github' && renderGitHubContent()}
          {(activeTab === 'codechef' || activeTab === 'geeksforgeeks' || activeTab === 'hackerrank') && 
            renderOtherPlatformContent()}
        </>
      )}
    </div>
  );
};

export default PlatformDetailPage;
