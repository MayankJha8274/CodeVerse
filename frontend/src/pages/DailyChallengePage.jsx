import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Target, 
  Trophy, 
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  RefreshCw,
  Play,
  Star,
  SkipForward
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PlatformIcon, getPlatformName } from '../utils/platformConfig';

// Difficulty Badge Component
const DifficultyBadge = ({ difficulty, size = 'md' }) => {
  const colors = {
    'Easy': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Hard': 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const sizes = {
    'sm': 'px-2 py-0.5 text-xs',
    'md': 'px-3 py-1 text-sm',
    'lg': 'px-4 py-1.5 text-base'
  };

  return (
    <span className={`font-medium rounded-lg border ${colors[difficulty] || colors['Medium']} ${sizes[size]}`}>
      {difficulty}
    </span>
  );
};

// Streak Fire Animation
const StreakFire = ({ streak }) => {
  const intensity = Math.min(streak / 10, 1);
  
  return (
    <div className="relative">
      <div 
        className="text-6xl animate-bounce"
        style={{ 
          filter: `drop-shadow(0 0 ${10 + intensity * 20}px rgba(251, 146, 60, ${0.5 + intensity * 0.5}))` 
        }}
      >
        🔥
      </div>
      {streak >= 7 && (
        <div className="absolute -top-2 -right-2 text-2xl animate-pulse">⭐</div>
      )}
    </div>
  );
};

// Topic Progress Bar
const TopicProgressBar = ({ topic, completed, total }) => {
  const percent = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div className="bg-gray-50 dark:bg-[#1a1a2e] rounded-lg p-3">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-900 dark:text-white font-medium">{topic}</span>
        <span className="text-gray-600 dark:text-gray-400">{completed}/{total}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

// Calendar Heatmap (last 30 days)
const CalendarHeatmap = ({ history }) => {
  const days = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const completed = history?.some(h => h.date === dateStr);
    days.push({ date: dateStr, completed, day: date.getDate() });
  }

  return (
    <div className="grid grid-cols-10 gap-1">
      {days.map((day, idx) => (
        <div
          key={idx}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
            day.completed 
              ? 'bg-green-500 text-black' 
              : 'bg-gray-800 text-gray-500'
          }`}
          title={`${day.date}: ${day.completed ? 'Completed' : 'Not completed'}`}
        >
          {day.day}
        </div>
      ))}
    </div>
  );
};

const DailyChallengePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0, total: 0, history: [] });
  const [completing, setCompleting] = useState(false);
  const [topicStats, setTopicStats] = useState({});
  const [challengeHistory, setChallengeHistory] = useState([]);

  // Fetch today's challenge and streak
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch today's challenge (includes streak info, auto-completes if already solved)
        const challengeRes = await api.getDailyChallenge();
        if (challengeRes.success) {
          setChallenge(challengeRes.challenge);
          setStreak(challengeRes.streak);
        }

        // Fetch topic stats
        const topicsRes = await api.getDailyChallengeTopics();
        if (topicsRes.success) {
          setTopicStats(topicsRes.topics);
        }

        // Fetch history
        const historyRes = await api.getDailyChallengeHistory(30);
        if (historyRes.success) {
          setChallengeHistory(historyRes.challenges);
        }

        // Fetch streak details (for history)
        const streakRes = await api.getDailyChallengeStreak();
        if (streakRes.success) {
          setStreak(prev => ({ ...prev, ...streakRes.streak }));
        }

      } catch (error) {
        console.error('Error fetching daily challenge:', error);
        // Set demo data for non-logged in users
        setChallenge({
          problemName: 'Two Sum',
          problemLink: 'https://leetcode.com/problems/two-sum/',
          difficulty: 'Easy',
          topic: 'Arrays',
          isCompleted: false
        });
        setStreak({ current: 0, longest: 0, total: 0, history: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Complete challenge (with verification from platform)
  const handleComplete = async () => {
    if (!user) {
      alert('Please login to track your progress');
      return;
    }

    try {
      setCompleting(true);
      const response = await api.completeDailyChallenge();
      if (response.success) {
        setChallenge(prev => ({ ...prev, isCompleted: true, completedAt: new Date() }));
        setStreak(response.streak);
        // Refresh the page to get fresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
      alert(error.message || 'Could not verify submission. Please solve the problem on the platform first.');
    } finally {
      setCompleting(false);
    }
  };

  // Skip challenge and get a new one
  const handleSkip = async () => {
    if (!user) {
      alert('Please login to track your progress');
      return;
    }

    if (!confirm('Are you sure you want to skip this challenge? You will get a new problem.')) {
      return;
    }

    try {
      setCompleting(true);
      const response = await api.skipDailyChallenge();
      if (response.success) {
        setChallenge(response.challenge);
      }
    } catch (error) {
      console.error('Error skipping challenge:', error);
      alert(error.message || 'Failed to skip challenge');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d0d14] flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white dark:bg-[#0d0d14] text-gray-900 dark:text-white transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500" />
            Daily DSA Challenge
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Stay consistent and master DSA one problem at a time</p>
        </div>

        {/* Streak Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Streak</p>
                <p className="text-4xl font-bold text-white">{streak.current}</p>
                <p className="text-orange-400 text-sm">days</p>
              </div>
              <StreakFire streak={streak.current} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Longest Streak</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{streak.longest}</p>
            <p className="text-gray-500 text-sm">days</p>
          </div>

          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Completed</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{streak.total}</p>
            <p className="text-gray-500 text-sm">challenges</p>
          </div>

          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Consistency</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {streak.total > 0 ? Math.round((streak.current / 30) * 100) : 0}%
            </p>
            <p className="text-gray-500 text-sm">this month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Challenge */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"></div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                      <Target className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Challenge</h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  {challenge?.isCompleted && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Completed!</span>
                    </div>
                  )}
                </div>

                {challenge ? (
                  <div className="space-y-6">
                    {/* Problem Card */}
                    <div className="bg-gray-50 dark:bg-[#0d0d14] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 ${
                              challenge.platform === 'codeforces' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              <PlatformIcon platform={challenge.platform} className="w-3.5 h-3.5" /> {getPlatformName(challenge.platform)}
                            </span>
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-500 text-xs rounded">
                              {challenge.topic}
                            </span>
                            <DifficultyBadge difficulty={challenge.difficulty} size="sm" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {challenge.problemName}
                          </h3>
                          {challenge.autoCompleted && (
                            <p className="text-green-400 text-sm flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Auto-verified from your profile!
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <a
                          href={challenge.problemLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                          Solve Problem
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        
                        {!challenge.isCompleted && (
                          <>
                            <button
                              onClick={handleComplete}
                              disabled={completing}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                              {completing ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5" />
                              )}
                              {completing ? 'Verifying...' : 'Mark Complete'}
                            </button>
                            <button
                              onClick={handleSkip}
                              disabled={completing}
                              className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                              title="Skip and get a new challenge"
                            >
                              <SkipForward className="w-5 h-5" />
                              Skip
                            </button>
                          </>
                        )}
                      </div>
                      
                      {!challenge.isCompleted && (
                        <p className="text-gray-500 text-xs mt-3 text-center">
                          💡 Solve the problem on {challenge.platform === 'codeforces' ? 'Codeforces' : 'LeetCode'}, then click Mark Complete to verify
                        </p>
                      )}
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4" /> Pro Tips
                      </h4>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li>• Try to solve without looking at hints first</li>
                        <li>• Analyze time and space complexity</li>
                        <li>• Think of edge cases before coding</li>
                        <li>• Review the solution pattern after solving</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No challenge available. Please login to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Activity Calendar */}
            <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Last 30 Days
              </h3>
              <CalendarHeatmap history={streak.history} />
              <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-gray-800 rounded"></div>
                  <div className="w-4 h-4 bg-green-800 rounded"></div>
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                </div>
                <span>More</span>
              </div>
            </div>

            {/* Topic Progress */}
            <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Topic Progress
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(topicStats).length > 0 ? (
                  Object.entries(topicStats).map(([topic, stats]) => (
                    <TopicProgressBar 
                      key={topic}
                      topic={topic}
                      completed={stats.completed}
                      total={stats.total}
                    />
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Complete challenges to see your topic progress</p>
                )}
              </div>
            </div>

            {/* Recent History */}
            <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Recent Challenges
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {challengeHistory.length > 0 ? (
                  challengeHistory.slice(0, 5).map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0d0d14] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {item.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-500" />
                        )}
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{item.problemName}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{item.date}</p>
                        </div>
                      </div>
                      <DifficultyBadge difficulty={item.difficulty} size="sm" />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">No history yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Banner */}
        {streak.current >= 3 && (
          <div className="mt-8 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-xl p-6 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🎉</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {streak.current >= 7 
                      ? "🔥 You're on fire! Amazing streak!" 
                      : `Great job! ${streak.current} days and counting!`}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Keep going! Consistency is the key to mastering DSA.
                  </p>
                </div>
              </div>
              <div className="text-4xl animate-bounce">
                {streak.current >= 7 ? '🏆' : '💪'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyChallengePage;
