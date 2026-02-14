import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import ChartCard from '../components/ChartCard';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../services/api';
import { PlatformIcon } from '../utils/platformConfig';

const ComparisonPage = () => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchComparison = async () => {
      if (selectedUsers.length > 0) {
        try {
          const data = await api.compareUsers(selectedUsers);
          setComparisonData(data);
        } catch (error) {
          console.error('Failed to fetch comparison data:', error);
        }
      }
    };

    fetchComparison();
  }, [selectedUsers]);

  const addUser = (userId) => {
    if (selectedUsers.length < 5 && !selectedUsers.includes(userId)) {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(id => id !== userId));
  };

  // Mock available users for search
  const availableUsers = [
    { id: '1', name: 'Alex Johnson', username: 'alexj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: '2', name: 'Sarah Chen', username: 'sarahc', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: '3', name: 'Michael Brown', username: 'mikeb', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
    { id: '4', name: 'Emma Wilson', username: 'emmaw', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
  ];

  // Prepare radar chart data
  const radarData = comparisonData.length > 0
    ? Object.keys(comparisonData[0].stats.skills).map(skill => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        ...comparisonData.reduce((acc, user) => ({
          ...acc,
          [user.name]: user.stats.skills[skill]
        }), {})
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Compare Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare your progress with up to 5 users
        </p>
      </div>

      {/* User Selection */}
      <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Selected Users ({selectedUsers.length}/5)
        </h3>
        
        {/* Selected Users */}
        <div className="flex flex-wrap gap-3 mb-6">
          {comparisonData.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-lg"
            >
              <UserAvatar user={user} size="sm" showName />
              <button
                onClick={() => removeUser(user.id)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {selectedUsers.length === 0 && (
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              No users selected. Search and add users to compare.
            </div>
          )}
        </div>

        {/* Search */}
        {selectedUsers.length < 5 && (
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or username..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none mb-4 transition-colors"
            />

            <div className="space-y-2">
              {availableUsers
                .filter(user => 
                  !selectedUsers.includes(user.id) &&
                  (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   user.username.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .slice(0, 5)
                .map(user => (
                  <button
                    key={user.id}
                    onClick={() => addUser(user.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a2e] transition-colors"
                  >
                    <UserAvatar user={user} size="md" showName showUsername />
                    <Plus className="w-5 h-5 text-amber-500" />
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonData.length > 0 && (
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
                    {comparisonData.map(user => (
                      <th key={user.id} className="text-center py-3 px-4">
                        <UserAvatar user={user} size="sm" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                      Total Problems
                    </td>
                    {comparisonData.map(user => (
                      <td key={user.id} className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-white">
                        {user.stats.totalProblems}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-2"><PlatformIcon platform="leetcode" className="w-4 h-4" color="#FFA116" /> LeetCode</span>
                    </td>
                    {comparisonData.map(user => (
                      <td key={user.id} className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-white">
                        {user.stats.leetcode}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-2"><PlatformIcon platform="codeforces" className="w-4 h-4" color="#1F8ACB" /> Codeforces</span>
                    </td>
                    {comparisonData.map(user => (
                      <td key={user.id} className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-white">
                        {user.stats.codeforces}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-2"><PlatformIcon platform="codechef" className="w-4 h-4" color="#5B4638" /> CodeChef</span>
                    </td>
                    {comparisonData.map(user => (
                      <td key={user.id} className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-white">
                        {user.stats.codechef}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                      Average Rating
                    </td>
                    {comparisonData.map(user => (
                      <td key={user.id} className="py-3 px-4 text-center font-semibold text-amber-500">
                        {user.stats.avgRating}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Skills Radar Chart */}
          <ChartCard
            title="Skills Comparison"
            subtitle="Compare proficiency across different topics"
          >
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="skill" stroke="#9CA3AF" />
                <PolarRadiusAxis stroke="#9CA3AF" />
                {comparisonData.map((user, index) => (
                  <Radar
                    key={user.id}
                    name={user.name}
                    dataKey={user.name}
                    stroke={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]}
                    fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]}
                    fillOpacity={0.2}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  );
};

export default ComparisonPage;
