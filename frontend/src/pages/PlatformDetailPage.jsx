import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChartCard from '../components/ChartCard';
import SkeletonLoader from '../components/SkeletonLoader';
import PlatformLinkModal from '../components/PlatformLinkModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ExternalLink, TrendingUp, Calendar, Award, Link as LinkIcon, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { PlatformIcon } from '../utils/platformConfig';
import { useAuth } from '../context/AuthContext';

const PlatformDetailPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'leetcode');
  const [platformData, setPlatformData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [linkedPlatforms, setLinkedPlatforms] = useState({});
  const [notification, setNotification] = useState(null);

  const tabs = [
    { id: 'leetcode', label: 'LeetCode', color: 'from-amber-500 to-orange-500', name: 'LeetCode' },
    { id: 'codeforces', label: 'Codeforces', color: 'from-blue-500 to-indigo-600', name: 'Codeforces' },
    { id: 'codechef', label: 'CodeChef', color: 'from-amber-600 to-amber-700', name: 'CodeChef' },
    { id: 'github', label: 'GitHub', color: 'from-gray-700 to-gray-900', name: 'GitHub' },
    { id: 'geeksforgeeks', label: 'GeeksforGeeks', color: 'from-green-500 to-emerald-600', name: 'GeeksForGeeks' },
    { id: 'hackerrank', label: 'HackerRank', color: 'from-green-600 to-teal-600', name: 'HackerRank' },
    { id: 'codingninjas', label: 'Coding Ninjas', color: 'from-orange-500 to-red-500', name: 'Coding Ninjas' }
  ];

  useEffect(() => {
    const fetchLinkedPlatforms = async () => {
      try {
        // Try to fetch fresh user data from API to ensure persistence
        try {
          const userData = await api.getUser();
          if (userData && userData.platforms) {
            // Update localStorage with fresh data
            const user = JSON.parse(localStorage.getItem('user')) || {};
            user.platforms = userData.platforms;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (apiError) {
          console.log('Using cached user data:', apiError.message);
        }

        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.platforms) {
          // platforms is an object: { leetcode: 'username', github: 'username', ... }
          const linked = {};
          if (typeof user.platforms === 'object' && !Array.isArray(user.platforms)) {
            // Backend format: object with platform keys
            Object.entries(user.platforms).forEach(([platform, username]) => {
              if (username) {
                linked[platform] = username;
              }
            });
          } else if (Array.isArray(user.platforms)) {
            // Legacy array format
            user.platforms.forEach(p => {
              if (p.username) {
                linked[p.platform] = p.username;
              }
            });
          }
          setLinkedPlatforms(linked);
        }
      } catch (error) {
        console.error('Failed to fetch linked platforms:', error);
      }
    };
    fetchLinkedPlatforms();
  }, []);

  useEffect(() => {
    const fetchPlatformData = async () => {
      setLoading(true);
      try {
        const data = await api.getPlatformStats(activeTab);
        setPlatformData(data);
      } catch (error) {
        console.error('Failed to fetch platform data:', error);
        // Set empty platform data so we don't show blank page
        setPlatformData(null);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if platform is linked
    if (linkedPlatforms[activeTab]) {
      fetchPlatformData();
    } else {
      setLoading(false);
      setPlatformData(null);
    }
  }, [activeTab, linkedPlatforms]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleLinkPlatform = (platform) => {
    console.log('Opening modal for platform:', platform);
    setSelectedPlatform(platform);
    setModalOpen(true);
  };

  const handleLinkSubmit = async (platformId, username) => {
    console.log('Linking platform:', platformId, 'with username:', username);
    try {
      // First, link the platform
      const response = await api.linkPlatform(platformId, username);
      console.log('Link response:', response);
      
      // Update linked platforms state immediately
      setLinkedPlatforms(prev => ({ ...prev, [platformId]: username }));
      
      // Update localStorage - backend returns platforms as object { leetcode: 'user', ... }
      const user = JSON.parse(localStorage.getItem('user')) || {};
      if (!user.platforms || typeof user.platforms !== 'object') {
        user.platforms = {};
      }
      // If it was an array, convert to object
      if (Array.isArray(user.platforms)) {
        const platformsObj = {};
        user.platforms.forEach(p => {
          platformsObj[p.platform] = p.username;
        });
        user.platforms = platformsObj;
      }
      user.platforms[platformId] = username;
      localStorage.setItem('user', JSON.stringify(user));
      updateUserData(user);
      setNotification({ type: 'success', message: `Successfully linked ${platformId}! Fetching data...` });
      
      // Sync platform data in background
      setTimeout(async () => {
        try {
          console.log('Starting sync for', platformId);
          await api.syncPlatform(platformId);
          console.log('Platform synced successfully');
          
          // Wait a bit for DB to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh data after sync
          if (activeTab === platformId) {
            setLoading(true);
            const data = await api.getPlatformStats(platformId);
            setPlatformData(data);
            setLoading(false);
          }
          
          setNotification({ type: 'success', message: `${platformId} data fetched successfully!` });
          setTimeout(() => setNotification(null), 3000);
        } catch (syncError) {
          console.error('Sync error:', syncError);
          setNotification({ type: 'error', message: 'Linked but data fetch failed. Click Refresh.' });
          setTimeout(() => setNotification(null), 5000);
        }
      }, 500);
      
    } catch (error) {
      console.error('Link error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to link platform';
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 5000);
      throw error;
    }
  };

  const handleUnlinkPlatform = async (platformId) => {
    if (!confirm(`Are you sure you want to unlink ${platformId}? This will remove all associated data.`)) {
      return;
    }

    try {
      console.log('Unlinking platform:', platformId);
      const response = await api.unlinkPlatform(platformId);
      console.log('Unlink response:', response);
      
      // Update state - remove the platform
      setLinkedPlatforms(prev => {
        const updated = { ...prev };
        delete updated[platformId];
        return updated;
      });
      
      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user')) || {};
      if (user.platforms) {
        if (typeof user.platforms === 'object' && !Array.isArray(user.platforms)) {
          delete user.platforms[platformId];
        }
        localStorage.setItem('user', JSON.stringify(user));
        updateUserData(user);
      }
      
      // Clear platform data if currently viewing
      if (activeTab === platformId) {
        setPlatformData(null);
      }
      
      setNotification({ type: 'success', message: `Successfully unlinked ${platformId}!` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Unlink error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to unlink platform';
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
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

  const renderLeetCodeContent = () => {
    if (!platformData) return null;
    
    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Solved</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{platformData?.totalSolved > 0 ? platformData.totalSolved : ''}</div>
        </div>
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Easy</div>
          <div className="text-3xl font-bold text-green-500">{platformData?.easySolved || platformData?.easy || 0}</div>
        </div>
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Medium</div>
          <div className="text-3xl font-bold text-yellow-500">{platformData?.mediumSolved || platformData?.medium || 0}</div>
        </div>
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Hard</div>
          <div className="text-3xl font-bold text-red-500">{platformData?.hardSolved || platformData?.hard || 0}</div>
        </div>
      </div>

      {platformData?.submissions?.length > 0 && (
      <div className="grid grid-cols-1 gap-6">
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
              <Area type="natural" dataKey="count" stroke="#FFA116" fill="#FFA116" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      )}
    </div>
    );
  };

  const renderCodeforcesContent = () => {
    if (!platformData) return null;
    
    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Rating</div>
          <div className="text-3xl font-bold text-amber-500">{platformData?.rating || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Max: {platformData?.maxRating || 0}</div>
        </div>
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rank</div>
          <div className="text-3xl font-bold text-purple-500">{platformData?.rank || 'unrated'}</div>
        </div>
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Contests</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{platformData?.contestsParticipated || 0}</div>
        </div>
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Problems</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{platformData?.problemsSolved || 0}</div>
        </div>
      </div>

      {platformData?.ratingHistory?.length > 0 && (
      <div className="grid grid-cols-1 gap-6">
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
              <Line type="natural" dataKey="rating" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      )}
    </div>
  );
  };

  const renderGitHubContent = () => {
    if (!platformData) return null;
    
    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Contributions</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{(platformData?.totalContributions || platformData?.allTimeContributions) > 0 ? (platformData?.totalContributions || platformData?.allTimeContributions) : ''}</div>
        </div>
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Stars</div>
          <div className="text-3xl font-bold text-yellow-500">{platformData?.totalStars || 0}</div>
        </div>
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Forks</div>
          <div className="text-3xl font-bold text-blue-500">{platformData?.totalForks || 0}</div>
        </div>
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Repositories</div>
          <div className="text-3xl font-bold text-purple-500">{platformData?.totalRepos || 0}</div>
        </div>
      </div>

      {(platformData?.contributions?.length > 0 || platformData?.topRepos?.length > 0) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {platformData?.contributions?.length > 0 && (
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
              <Area type="natural" dataKey="count" stroke="#6B7280" fill="#6B7280" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        )}

        {platformData?.topRepos?.length > 0 && (
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Repositories
          </h3>
          <div className="space-y-3">
            {(platformData?.topRepos || []).map((repo, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a2e] transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {repo?.name || 'Unknown'}
                    <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{repo?.language || ''}</div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Award className="w-4 h-4" />
                  <span className="font-semibold">{repo?.stars || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
      )}
    </div>
  );
  };

  const renderOtherPlatformContent = () => {
    if (!platformData) return null;
    
    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Problems Solved</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{platformData?.problemsSolved > 0 ? platformData.problemsSolved : ''}</div>
        </div>
        {( (platformData?.rating && platformData.rating > 0) || (platformData?.totalScore && platformData.totalScore > 0) ) && (
          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {activeTab === 'codechef' ? 'Rating' : 'Score'}
            </div>
            <div className="text-3xl font-bold text-amber-500">{(platformData?.rating > 0 ? platformData.rating : (platformData?.totalScore > 0 ? platformData.totalScore : ''))}</div>
          </div>
        )}
        {platformData?.rank && (
          <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rank</div>
            <div className="text-3xl font-bold text-purple-500">{platformData?.rank || '-'}</div>
          </div>
        )}
      </div>

      {/* Recent Activity removed for other platforms */}
    </div>
  );
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Platform Link Modal */}
      {selectedPlatform && modalOpen && (
        <PlatformLinkModal
          platform={selectedPlatform}
          isOpen={modalOpen}
          onClose={() => {
            console.log('Closing modal');
            setModalOpen(false);
            setSelectedPlatform(null);
          }}
          onLink={handleLinkSubmit}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Platform Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View detailed statistics for each platform
          </p>
        </div>
      </div>

      {/* Platform Cards with Link Button */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`bg-white dark:bg-[#16161f] rounded-xl p-4 cursor-pointer transition-all border ${
              activeTab === tab.id 
                ? 'ring-2 ring-amber-500 border-amber-500' 
                : 'border-gray-200 dark:border-gray-800 hover:shadow-lg'
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <PlatformIcon platform={tab.id} className="w-5 h-5" />
                {tab.label}
              </h3>
              {linkedPlatforms[tab.id] ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Linked</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnlinkPlatform(tab.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                    title="Unlink platform"
                  >
                    Unlink
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLinkPlatform(tab);
                  }}
                  className="flex items-center gap-1 text-amber-500 hover:text-amber-400 text-sm font-medium"
                >
                  <LinkIcon className="w-4 h-4" />
                  Link
                </button>
              )}
            </div>
            {linkedPlatforms[tab.id] && (
              <p className="text-sm text-gray-400">@{linkedPlatforms[tab.id]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a2e]'
            }`}
          >
            <PlatformIcon platform={tab.id} className="w-4 h-4" />
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
      ) : !linkedPlatforms[activeTab] ? (
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-12 text-center border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="max-w-md mx-auto">
            <LinkIcon className="w-16 h-16 mx-auto text-gray-600 dark:text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Platform Not Linked
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Link your {tabs.find(t => t.id === activeTab)?.label} account to view detailed statistics
            </p>
            <button
              onClick={() => handleLinkPlatform(tabs.find(t => t.id === activeTab))}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
            >
              Link {tabs.find(t => t.id === activeTab)?.label} Account
            </button>
          </div>
        </div>
      ) : !platformData ? (
        <div className="bg-white dark:bg-[#16161f] rounded-xl p-12 text-center border border-gray-200 dark:border-gray-800 transition-colors">
          <div className="max-w-md mx-auto">
            <Award className="w-16 h-16 mx-auto text-gray-600 dark:text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't fetch data for this platform. This might be because your profile is private, the username is incorrect, or data hasn't been synced yet.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await api.syncPlatform(activeTab);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const data = await api.getPlatformStats(activeTab);
                    setPlatformData(data);
                    setNotification({ type: 'success', message: 'Data refreshed successfully!' });
                  } catch (error) {
                    setNotification({ type: 'error', message: 'Failed to refresh data' });
                  } finally {
                    setLoading(false);
                    setTimeout(() => setNotification(null), 3000);
                  }
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={() => handleLinkPlatform(tabs.find(t => t.id === activeTab))}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Update Username
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'leetcode' && renderLeetCodeContent()}
          {activeTab === 'codeforces' && renderCodeforcesContent()}
          {activeTab === 'github' && renderGitHubContent()}
          {(activeTab === 'codechef' || activeTab === 'geeksforgeeks' || activeTab === 'hackerrank' || activeTab === 'codingninjas') && 
            renderOtherPlatformContent()}
        </>
      )}
    </div>
  );
};

export default PlatformDetailPage; 