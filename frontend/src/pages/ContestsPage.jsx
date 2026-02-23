import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Bell, 
  BellOff, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PLATFORM_CONFIG, { PlatformIcon } from '../utils/platformConfig';

// Platform configuration (extends centralized config with contest-specific entries)
const platformConfigLocal = {
  ...Object.fromEntries(
    Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => [key, {
      name: cfg.name,
      color: cfg.color,
      bgColor: cfg.bgColor,
      textColor: cfg.textColor,
    }])
  ),
  atcoder: { 
    name: 'AtCoder', 
    color: '#222222', 
    bgColor: 'bg-gray-500/20',
    textColor: 'text-gray-300',
  }
};

// Format duration
const formatDuration = (minutes) => {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Format time remaining
const formatTimeRemaining = (startTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const diff = start - now;
  
  if (diff < 0) return 'Started';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Contest Card Component
const ContestCard = ({ contest, onSetReminder, onRemoveReminder, hasReminder, isSettingReminder }) => {
  const platform = platformConfigLocal[contest.platform] || platformConfigLocal.codeforces;
  const startTime = new Date(contest.startTime);
  const formattedDate = startTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = startTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-gray-50 dark:bg-[#1a1a2e] rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all group transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {/* Platform Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`${platform.bgColor} ${platform.textColor} px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1`}>
              <PlatformIcon platform={contest.platform} className="w-3.5 h-3.5" /> {platform.name}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimeRemaining(contest.startTime)}
            </span>
          </div>
          
          {/* Contest Name */}
          <h3 className="text-gray-900 dark:text-white font-medium mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
            {contest.name}
          </h3>
          
          {/* Time Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedTime}</span>
            </div>
            <span className="text-gray-500">•</span>
            <span>{formatDuration(contest.duration)}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => hasReminder ? onRemoveReminder(contest._id) : onSetReminder(contest._id)}
            disabled={isSettingReminder}
            className={`p-2 rounded-lg transition-all ${
              hasReminder 
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                : 'bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={hasReminder ? 'Remove reminder' : 'Set reminder (16h before)'}
          >
            {isSettingReminder ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : hasReminder ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all"
            title="Open contest page"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

// Calendar Component
const ContestCalendar = ({ calendarData, currentMonth, currentYear, onMonthChange }) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Generate calendar grid
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      day,
      dateStr,
      contests: calendarData[dateStr] || []
    });
  }

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  return (
    <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange(-1)}
            className="p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#252538] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMonthChange(1)}
            className="p-2 rounded-lg bg-gray-50 dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#252538] transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Day Names + Calendar Grid — scrollable on small screens */}
      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
      {/* Day Names */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((dayData, idx) => (
          <div 
            key={idx} 
            className={`min-h-[100px] p-1 border-r border-b border-gray-200 dark:border-gray-800/50 ${
              dayData === null ? 'bg-gray-100 dark:bg-[#0d0d14]' : 'bg-gray-50 dark:bg-[#16161f]'
            } ${isToday(dayData?.day) ? 'bg-amber-500/10' : ''}`}
          >
            {dayData && (
              <>
                <div className={`text-xs p-1 ${
                  isToday(dayData.day) 
                    ? 'text-amber-400 font-bold' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {dayData.day}
                </div>
                <div className="space-y-1">
                  {dayData.contests.slice(0, 3).map((contest, cidx) => {
                    const platform = platformConfigLocal[contest.platform] || platformConfigLocal.codeforces;
                    return (
                      <a
                        key={cidx}
                        href={contest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block px-1.5 py-0.5 rounded text-[10px] truncate ${platform.bgColor} ${platform.textColor} hover:opacity-80 transition-opacity`}
                        title={`${contest.name} - ${new Date(contest.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        <span className="flex items-center gap-0.5"><PlatformIcon platform={contest.platform} className="w-2.5 h-2.5" /> {contest.name.substring(0, 15)}...</span>
                      </a>
                    );
                  })}
                  {dayData.contests.length > 3 && (
                    <div className="text-[10px] text-gray-500 px-1">
                      +{dayData.contests.length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      </div>
      </div>
    </div>
  );
};

const ContestsPage = () => {
  const { user } = useAuth();
  const [contests, setContests] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [userReminders, setUserReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [settingReminder, setSettingReminder] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchContests();
    fetchCalendarData();
    if (user) {
      fetchUserReminders();
    }
  }, [user]);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, currentYear]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const data = await api.getContests(selectedPlatform);
      setContests(data || []);
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    try {
      const data = await api.getContestsCalendar(currentMonth, currentYear);
      setCalendarData(data.data || {});
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  };

  const fetchUserReminders = async () => {
    try {
      const data = await api.getUserReminders();
      setUserReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.refreshContests();
      await fetchContests();
      await fetchCalendarData();
    } catch (error) {
      console.error('Error refreshing contests:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSetReminder = async (contestId) => {
    if (!user) {
      alert('Please log in to set reminders');
      return;
    }
    
    try {
      setSettingReminder(contestId);
      await api.setContestReminder(contestId);
      await fetchUserReminders();
    } catch (error) {
      console.error('Error setting reminder:', error);
      alert(error.message || 'Failed to set reminder');
    } finally {
      setSettingReminder(null);
    }
  };

  const handleRemoveReminder = async (contestId) => {
    try {
      setSettingReminder(contestId);
      await api.removeContestReminder(contestId);
      await fetchUserReminders();
    } catch (error) {
      console.error('Error removing reminder:', error);
    } finally {
      setSettingReminder(null);
    }
  };

  const handleMonthChange = (delta) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const hasReminder = (contestId) => {
    return userReminders.some(r => r.contestId?._id === contestId || r.contestId === contestId);
  };

  // Filter contests
  const filteredContests = contests.filter(contest => {
    const matchesSearch = contest.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || contest.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  // Group contests by date
  const groupedContests = {};
  filteredContests.forEach(contest => {
    const dateKey = new Date(contest.startTime).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    if (!groupedContests[dateKey]) {
      groupedContests[dateKey] = [];
    }
    groupedContests[dateKey].push(contest);
  });

  return (
    <div className="min-h-full bg-white dark:bg-[#0d0d14] transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-7 h-7 text-amber-500" />
              Contest Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Don't miss scheduled events • Set reminders 16 hours before
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Contests
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Contests"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#16161f] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value);
                setTimeout(fetchContests, 0);
              }}
              className="pl-10 pr-8 py-2.5 bg-gray-50 dark:bg-[#16161f] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50 min-w-[180px]"
            >
              <option value="all">All Platforms</option>
              <option value="leetcode">LeetCode</option>
              <option value="codeforces">Codeforces</option>
              <option value="codechef">CodeChef</option>
              <option value="atcoder">AtCoder</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Contests List */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#16161f] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📅</span>
                Upcoming Contests
              </h2>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-100 dark:bg-[#1a1a2e] rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : filteredContests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-600 dark:text-gray-400">No upcoming contests found</p>
                  <button
                    onClick={handleRefresh}
                    className="mt-3 text-amber-400 hover:text-amber-300 text-sm"
                  >
                    Refresh to fetch latest contests
                  </button>
                </div>
              ) : (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar-thin">
                  {Object.entries(groupedContests).map(([date, dateContests]) => (
                    <div key={date}>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 sticky top-0 bg-white dark:bg-[#16161f] py-1">
                        {date}
                      </div>
                      <div className="space-y-3">
                        {dateContests.map(contest => (
                          <ContestCard
                            key={contest._id}
                            contest={contest}
                            onSetReminder={handleSetReminder}
                            onRemoveReminder={handleRemoveReminder}
                            hasReminder={hasReminder(contest._id)}
                            isSettingReminder={settingReminder === contest._id}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User's Reminders */}
            {user && userReminders.length > 0 && (
              <div className="bg-white dark:bg-[#16161f] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  Your Reminders
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                    {userReminders.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {userReminders.slice(0, 5).map((reminder, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1a1a2e] rounded-lg">
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm font-medium">
                          {reminder.contestDetails?.name || 'Contest'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Reminder: {new Date(reminder.reminderTime).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveReminder(reminder.contestId?._id || reminder.contestId)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <BellOff className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="md:col-span-3">
            <ContestCalendar
              calendarData={calendarData}
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={handleMonthChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestsPage;
