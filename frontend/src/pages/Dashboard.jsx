import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code, 
  Flame, 
  Award, 
  GitCommit, 
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import PlatformCard from '../components/PlatformCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [problemsOverTime, setProblemsOverTime] = useState([]);
  const [ratingGrowth, setRatingGrowth] = useState([]);
  const [topicHeatmap, setTopicHeatmap] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, platformsData, problemsData, ratingsData, topicsData, challengeData] = await Promise.all([
          api.getStats(),
          api.getAllPlatformStats(),
          api.getProblemsOverTime(),
          api.getRatingGrowth(),
          api.getTopicHeatmap(),
          api.getDailyChallenge()
        ]);

        setStats(statsData);
        setPlatformStats(platformsData);
        setProblemsOverTime(problemsData);
        setRatingGrowth(ratingsData);
        setTopicHeatmap(topicsData);
        setDailyChallenge(challengeData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} type="card" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => <SkeletonLoader key={i} type="chart" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back! ≡ƒæï
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your coding journey at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Problems"
          value={stats.totalProblems}
          icon={Code}
          color="blue"
          trend="up"
          trendValue="+12%"
          subtitle="Across all platforms"
        />
        <StatCard
          title="Active Days"
          value={stats.activeDays}
          icon={Calendar}
          color="green"
          subtitle={`${stats.currentStreak} day streak`}
        />
        <StatCard
          title="Average Rating"
          value={stats.avgRating}
          icon={Award}
          color="purple"
          trend="up"
          trendValue="+45"
          subtitle={`Max: ${stats.maxRating}`}
        />
        <StatCard
          title="GitHub Commits"
          value={stats.totalCommits}
          icon={GitCommit}
          color="orange"
          trend="up"
          trendValue="+23%"
        />
      </div>

      {/* Daily Challenge */}
      {dailyChallenge && (
        <div className="card p-6 bg-gradient-to-r from-primary-500/10 to-purple-500/10 border-primary-200 dark:border-primary-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Daily Challenge
                </h3>
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {dailyChallenge.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {dailyChallenge.description}
              </p>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  dailyChallenge.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                  dailyChallenge.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                  'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {dailyChallenge.difficulty}
                </span>
                <span className="text-sm text-gray-500">
                  {dailyChallenge.acceptanceRate}% acceptance rate
                </span>
              </div>
            </div>
            <button className="btn-primary">
              Solve Now
            </button>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Problems Solved Over Time"
          subtitle="Last 7 months"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={problemsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="problems" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Rating Growth"
          subtitle="Progress across platforms"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ratingGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="leetcode" stroke="#FFA116" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="codeforces" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="codechef" stroke="#8B4513" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Topic Heatmap */}
      <ChartCard
        title="Topic Mastery"
        subtitle="Your strongest and weakest areas"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topicHeatmap.map((topic) => (
            <div key={topic.topic} className="card p-4 hover:shadow-md transition-shadow">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {topic.topic}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                    style={{ width: `${topic.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {topic.percentage}%
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {topic.problems} problems
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Platform Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Overview
          </h2>
          <button
            onClick={() => navigate('/platforms')}
            className="text-primary-500 hover:text-primary-600 font-medium flex items-center gap-2"
          >
            View All
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PlatformCard
            platform="leetcode"
            stats={platformStats.leetcode}
            onViewDetails={() => navigate('/platforms?tab=leetcode')}
          />
          <PlatformCard
            platform="codeforces"
            stats={platformStats.codeforces}
            onViewDetails={() => navigate('/platforms?tab=codeforces')}
          />
          <PlatformCard
            platform="github"
            stats={platformStats.github}
            onViewDetails={() => navigate('/platforms?tab=github')}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
