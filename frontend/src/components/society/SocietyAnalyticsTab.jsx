import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Flame, Medal, Calendar } from 'lucide-react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

// Make sure to match your API base URL and token handling properly here.
const getAuthToken = () => localStorage.getItem('token');
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authFetch = async (url) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('API Request Failed');
  return res.json();
};

const SocietyAnalyticsTab = ({ societyId, societyType = 'society' }) => {
  const [timeRange, setTimeRange] = useState('1M');
  const [trendData, setTrendData] = useState([]);
  const [comparisonData, setComparisonData] = useState({ labels: [], datasets: [] });
  const [weeklyData, setWeeklyData] = useState([]);
  const [streakData, setStreakData] = useState({ current: 0, best: 0, activeDays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (societyId) {
      fetchAnalyticsData();
    }
  }, [societyId, timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [trendRes, compRes, weeklyRes, streakRes] = await Promise.all([
        authFetch(`/analytics/entity/${societyId}/trend?range=${timeRange}`),
        authFetch(`/analytics/entity/${societyId}/comparison`),
        authFetch(`/analytics/entity/${societyId}/weekly`),
        authFetch(`/analytics/entity/${societyId}/streak`)
      ]);

      if (trendRes.success) {
        // Transform the structured user data back to chart.js flat format
        // Recharts prefers [{date: '..', User1: 5, User2: 10}] instead of separate user arrays
        const rawUsers = trendRes.users || [];
        const flatDataObj = {};
        
        rawUsers.forEach(user => {
          user.data.forEach(dp => {
            if (!flatDataObj[dp.date]) {
              flatDataObj[dp.date] = { date: dp.date };
            }
            flatDataObj[dp.date][user.name] = dp.problemsSolved;
          });
        });

        // Convert object into sorted array by date
        const flatData = Object.values(flatDataObj).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setTrendData(flatData);
      }

      if (compRes.success) {
        setComparisonData({
          labels: compRes.labels || [],
          datasets: compRes.datasets || []
        });
      }

if (weeklyRes.success) {
          setWeeklyData(weeklyRes.data || []);
        }

        if (streakRes.success) {
          setStreakData(streakRes.data || { current: 0, best: 0, activeDays: 0 });
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // alert('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Convert comparison structure to recharts Bar structure
  const barChartData = comparisonData.labels.map((label, index) => {
    const obj = { name: label };
    comparisonData.datasets.forEach(ds => {
      obj[ds.name] = ds.data[index] || 0;
    });
    return obj;
  });

  const shiftDate = (date, numDays) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
  };
  
  const today = new Date();

  if (loading && !trendData.length) {
    return <div className="text-center p-8 text-gray-400">Loading Analytics...</div>;
  }

  // Get dynamic names for Lines and Bars
  const userNames = comparisonData.datasets.map(ds => ds.name) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
        <div className="flex space-x-2 bg-slate-800 rounded-lg p-1">
          {['1D', '1W', '1M', '1Y'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Line Chart: Trends Over Time */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Problems Solved Trend</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {userNames.map((name, index) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#1e293b' }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart: User Comparison */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Activity Comparison</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {userNames.map((name, index) => (
                  <Bar 
                    key={name} 
                    dataKey={name} 
                    fill={COLORS[index % COLORS.length]} 
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activity Area */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Weekly Activity Pulse</h3>
            </div>
            
            <div className="h-[200px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#a855f7"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Streaks Cards inside the same flex column */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-lg flex items-center justify-between border border-slate-700">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-white">{streakData?.current || 0} <span className="text-sm font-normal text-slate-500">days</span></p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg flex items-center justify-between border border-slate-700">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Best Streak</p>
                <p className="text-2xl font-bold text-white">{streakData?.best || 0} <span className="text-sm font-normal text-slate-500">days</span></p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Medal className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocietyAnalyticsTab;
