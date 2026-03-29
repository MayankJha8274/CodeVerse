const fs = require('fs');

const fileBuffer = Buffer.from(
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Flame, Medal, Calendar } from 'lucide-react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

const getAuthToken = () => localStorage.getItem('token');
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authFetch = async (url) => {
  const token = getAuthToken();
  const res = await fetch(\\\\, {
    headers: {
      'Authorization': \Bearer \\,
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
        authFetch(\/analytics/entity/\/trend?range=\\),
        authFetch(\/analytics/entity/\/comparison\),
        authFetch(\/analytics/entity/\/weekly\),
        authFetch(\/analytics/entity/\/streak\)
      ]);

      if (trendRes.success) {
        const rawUsers = trendRes.users || [];
        const flatDataObj = {};
        rawUsers.forEach(user => {
          user.data.forEach(dp => {
            if (!flatDataObj[dp.date]) flatDataObj[dp.date] = { date: dp.date };
            flatDataObj[dp.date][user.name] = dp.problemsSolved;
          });
        });
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

      if (streakRes.success && streakRes.streak) {
        setStreakData(streakRes.streak);
      } else if (streakRes.success && streakRes.data) {
        setStreakData({ current: streakRes.data.currentStreak || 0, best: streakRes.data.bestStreak || 0, activeDays: streakRes.data.activeDays || 0 });
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const barChartData = comparisonData.labels.map((label, index) => {
    const obj = { name: label };
    comparisonData.datasets.forEach(ds => {
      obj[ds.name] = ds.data[index] || 0;
    });
    return obj;
  });

  if (loading && !trendData.length) {
    return <div className="text-center p-8 text-gray-400">Loading Analytics...</div>;
  }

  const userNames = comparisonData.datasets.map(ds => ds.name) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
        <div className="flex space-x-2 bg-slate-800 rounded-lg p-1">
          {['1D', '1W', '1M', '1Y'].map(range => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={\px-4 py-1.5 rounded-md text-sm font-medium transition-colors \\}>
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <Flame className="w-10 h-10 text-orange-500 mb-2" />
          <h3 className="text-gray-400 text-sm font-medium">Current Streak</h3>
          <p className="text-3xl font-bold text-white my-1">{streakData.current} Days</p>
          <div className="flex space-x-4 mt-3 text-xs text-gray-500">
            <span>Best: <strong className="text-gray-300">{streakData.best}d</strong></span>
            <span>Active: <strong className="text-gray-300">{streakData.activeDays}d</strong></span>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Last 7 Days (Problems Solved)
          </h3>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} horizontal={false} />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Comparison */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">User Comparison</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} itemStyle={{ color: '#f8fafc' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {userNames.map((name, index) => (
                <Bar key={name} dataKey={name} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Problems Solved Trend</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} itemStyle={{ color: '#f8fafc' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {userNames.map((name, index) => (
                <Line key={name} type="monotone" dataKey={name} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default SocietyAnalyticsTab;
\.trim(), 'utf8');

fs.writeFileSync('c:/Users/mayan/OneDrive/Desktop/CodeVerse/CODEVERSE-PROJECT/frontend/src/components/society/SocietyAnalyticsTab.jsx', fileBuffer);
