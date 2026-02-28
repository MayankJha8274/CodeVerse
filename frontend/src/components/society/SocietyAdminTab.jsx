import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, MessageSquare, Calendar, AlertTriangle, Activity, Settings, Loader2, RefreshCw, ChevronDown, Save, Shield } from 'lucide-react';
import api from '../../services/api';

const SocietyAdminTab = ({ societyId, society, onUpdate }) => {
  const [activeSection, setActiveSection] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

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
      onUpdate?.();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
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
                <StatCard label="Active (7d)" value={analytics.overview?.activeMembers || 0} icon={Users} color="text-green-500" />
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
                  {analytics.roleDistribution?.map(r => {
                    const total = analytics.overview?.totalMembers || 1;
                    const pct = Math.round((r.count / total) * 100);
                    return (
                      <div key={r._id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-28 capitalize">{r._id?.replace('_', ' ')}</span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-16 text-right">{r.count} ({pct}%)</span>
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
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{c.username}</span>
                        <span className="text-xs font-semibold text-amber-500">{c.score} pts</span>
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
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{msg.sender?.username}</span>
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
                      <span className="font-medium text-gray-900 dark:text-white">{log.user?.username || 'System'}</span>
                      {' '}{formatAction(log.action)}
                      {log.targetUser && (
                        <> → <span className="font-medium">{log.targetUser?.username}</span></>
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

          <div className="flex justify-end">
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
