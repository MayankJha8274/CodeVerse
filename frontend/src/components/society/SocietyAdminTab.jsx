import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, MessageSquare, Calendar, AlertTriangle, Activity, Settings, Loader2, RefreshCw, ChevronDown, Save, Shield, UserPlus, Search, X, Check } from 'lucide-react';
import api from '../../services/api';
import ProfileLink from '../ProfileLink';

const SocietyAdminTab = ({ societyId, society, onUpdate }) => {
  const [activeSection, setActiveSection] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Member management state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingMember, setAddingMember] = useState({});
  const [addSuccess, setAddSuccess] = useState(null);
  const [addError, setAddError] = useState(null);
  
  const isSuperAdmin = society?.userRole === 'super_admin';

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSocietyAnalytics(societyId);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  const loadActivityLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const res = await api.getSocietyActivityLog(societyId);
      setActivityLog(res.data || []);
    } catch (err) {
      console.error('Failed to load activity log:', err);
    } finally {
      setLogLoading(false);
    }
  }, [societyId]);

  useEffect(() => {
    loadAnalytics();
    if (society) {
      setSettings({
        name: society.name || '',
        description: society.description || '',
        isPrivate: society.settings?.isPrivate ?? false,
        maxMembers: society.settings?.maxMembers ?? 500,
        allowMemberInvite: society.settings?.allowMemberInvite ?? true,
        requireApproval: society.settings?.requireApproval ?? false,
        enableChat: society.settings?.enableChat ?? true,
        enableEvents: society.settings?.enableEvents ?? true,
        enableLeaderboard: society.settings?.enableLeaderboard ?? true,
      });
    }
  }, [loadAnalytics, society]);

  useEffect(() => {
    if (activeSection === 'activity') loadActivityLog();
  }, [activeSection, loadActivityLog]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.updateSociety(societyId, {
        name: settings.name,
        description: settings.description,
        settings: {
          isPrivate: settings.isPrivate,
          maxMembers: settings.maxMembers,
          allowMemberInvite: settings.allowMemberInvite,
          requireApproval: settings.requireApproval,
          enableChat: settings.enableChat,
          enableEvents: settings.enableEvents,
          enableLeaderboard: settings.enableLeaderboard,
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onUpdate?.();
    } catch (err) {
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    setSearching(true);
    setAddError(null);
    try {
      const res = await api.searchSocietyUsers(societyId, query);
      const users = res.data || res || [];
      setSearchResults(users);
    } catch (err) {
      console.error('Failed to search users:', err);
      setAddError('Failed to search users. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (user) => {
    setAddingMember(prev => ({ ...prev, [user._id]: true }));
    setAddError(null);
    setAddSuccess(null);
    try {
      await api.addMemberManually(societyId, { userId: user._id });
      setAddSuccess(`${user.username} has been added to the society`);
      setSearchResults(prev => prev.filter(u => u._id !== user._id));
      setSearchQuery('');
      setTimeout(() => setAddSuccess(null), 3000);
      onUpdate?.();
    } catch (err) {
      setAddError(err.response?.data?.message || err.message || 'Failed to add member');
    } finally {
      setAddingMember(prev => {
        const newState = { ...prev };
        delete newState[user._id];
        return newState;
      });
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sections = isSuperAdmin ? [
    { key: 'members', label: 'Add Members', icon: UserPlus },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'activity', label: 'Activity Log', icon: Activity },
    { key: 'settings', label: 'Settings', icon: Settings },
  ] : [
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'activity', label: 'Activity Log', icon: Activity },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const StatCard = ({ label, value, icon: Icon, color = 'text-amber-500' }) => (
    <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );

  const formatAction = (action) => action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div>
      {/* Section Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-[#111118] rounded-lg p-1 w-fit">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeSection === s.key
                  ? 'bg-white dark:bg-[#1a1a2e] text-amber-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Analytics Section */}
      {activeSection === 'analytics' && (
        <>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Members" value={analytics.overview?.totalMembers || 0} icon={Users} />
                <StatCard label="New (30d)" value={analytics.overview?.newMembers || 0} icon={Users} color="text-green-500" />
                <StatCard label="Total Messages" value={analytics.overview?.totalMessages || 0} icon={MessageSquare} color="text-blue-500" />
                <StatCard label="Total Events" value={analytics.overview?.totalEvents || 0} icon={Calendar} color="text-purple-500" />
              </div>

              {/* Role Distribution */}
              <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  Role Distribution
                </h4>
                <div className="space-y-2">
                  {Object.entries(analytics.roleDistribution || {}).map(([role, count]) => {
                    const total = analytics.overview?.totalMembers || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={role} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-28 capitalize">{role?.replace('_', ' ')}</span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-16 text-right">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Channel Stats */}
              {analytics.channelStats?.length > 0 && (
                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Channel Activity
                  </h4>
                  <div className="space-y-2">
                    {analytics.channelStats.map(ch => (
                      <div key={ch._id} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">#{ch.name}</span>
                        <span className="text-xs text-gray-400">{ch.messageCount} messages</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Contributors */}
              {analytics.topContributors?.length > 0 && (
                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Contributors</h4>
                  <div className="space-y-2">
                    {analytics.topContributors.slice(0, 10).map((c, i) => (
                      <div key={c._id} className="flex items-center gap-3">
                        <span className="w-5 text-xs text-gray-400 text-right">{i + 1}.</span>
                        <ProfileLink user={c.user} className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.user?.username?.charAt(0)?.toUpperCase() || '?'}
                        </ProfileLink>
                        <ProfileLink user={c.user} className="text-sm text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors flex-1">{c.user?.username || 'Unknown'}</ProfileLink>
                        <span className="text-xs font-semibold text-amber-500">{c.contributionScore || 0} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reported Messages */}
              {analytics.reportedMessages?.length > 0 && (
                <div className="bg-white dark:bg-[#1a1a2e] border border-red-200 dark:border-red-800/30 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-red-500 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Reported Messages ({analytics.reportedMessages.length})
                  </h4>
                  <div className="space-y-3">
                    {analytics.reportedMessages.slice(0, 10).map(msg => (
                      <div key={msg._id} className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <ProfileLink user={msg.sender} className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors">{msg.sender?.username}</ProfileLink>
                          <span className="text-[10px] text-red-400">{msg.reports?.length} report(s)</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">No analytics data available</p></div>
          )}
        </>
      )}

      {/* Activity Log Section */}
      {activeSection === 'activity' && (
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800/50 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Recent Activity</span>
            <button onClick={loadActivityLog} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${logLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {logLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div>
          ) : activityLog.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50 max-h-[500px] overflow-y-auto">
              {activityLog.map(log => (
                <div key={log._id} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <ProfileLink user={log.user} className="font-medium text-gray-900 dark:text-white hover:text-amber-500 transition-colors">{log.user?.username || 'System'}</ProfileLink>
                      {' '}{formatAction(log.action)}
                      {log.targetUser && (
                        <> → <ProfileLink user={log.targetUser} className="font-medium hover:text-amber-500 transition-colors">{log.targetUser?.username}</ProfileLink></>
                      )}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No activity recorded yet</p>
            </div>
          )}
        </div>
      )}

      {/* Add Members Section */}
      {activeSection === 'members' && (
        <div className="space-y-5">
          {/* Search Box */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-500" />
              Add Members Manually
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Search for users by username or email and add them directly to your society.
            </p>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-shadow"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Search Loading */}
            {searching && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              </div>
            )}

            {/* Search Results */}
            {!searching && searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
                </p>
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg hover:border-amber-500/30 transition-colors"
                  >
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {user.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <ProfileLink user={user} className="block text-sm font-medium text-gray-900 dark:text-white hover:text-amber-500 truncate transition-colors">
                        {user.username}
                      </ProfileLink>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleAddMember(user)}
                      disabled={addingMember[user._id]}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white text-xs font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {addingMember[user._id] ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!searching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No users found matching "{searchQuery}"
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Try searching by username or email
                </p>
              </div>
            )}

            {/* Empty State */}
            {!searching && !searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start typing to search for users
                </p>
              </div>
            )}
          </div>

          {/* Success Message */}
          {addSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Member added successfully!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {addError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    Failed to add member
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {addError}
                  </p>
                </div>
                <button
                  onClick={() => setAddError(null)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && settings && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">General</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={e => setSettings(s => ({ ...s, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
                <textarea
                  value={settings.description}
                  onChange={e => setSettings(s => ({ ...s, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max Members</label>
                <input
                  type="number"
                  value={settings.maxMembers}
                  onChange={e => setSettings(s => ({ ...s, maxMembers: parseInt(e.target.value) || 500 }))}
                  className="w-32 px-3 py-2 text-sm bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Permissions & Features</h4>
            <div className="space-y-3">
              {[
                { key: 'isPrivate', label: 'Private Society', desc: 'Only invited members can join' },
                { key: 'requireApproval', label: 'Require Approval', desc: 'New join requests need admin approval' },
                { key: 'allowMemberInvite', label: 'Member Invites', desc: 'Allow members to share invite code' },
                { key: 'enableChat', label: 'Enable Chat', desc: 'Turn on/off the chat feature' },
                { key: 'enableEvents', label: 'Enable Events', desc: 'Turn on/off the events feature' },
                { key: 'enableLeaderboard', label: 'Enable Leaderboard', desc: 'Turn on/off the leaderboard feature' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{item.label}</div>
                    <div className="text-[11px] text-gray-400">{item.desc}</div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-amber-500 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              {saveError && (
                <p className="text-sm text-red-400">{saveError}</p>
              )}
              {saveSuccess && (
                <p className="text-sm text-green-400">Settings saved successfully!</p>
              )}
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-medium rounded-lg text-sm transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyAdminTab;
