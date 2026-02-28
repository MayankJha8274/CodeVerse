import React, { useState, useEffect, useCallback } from 'react';
import { Search, Shield, ShieldAlert, Crown, User, MoreVertical, X, Loader2, UserMinus, Ban, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', color: 'text-red-400 bg-red-500/10', icon: Crown },
  society_admin: { label: 'Admin', color: 'text-amber-400 bg-amber-500/10', icon: ShieldAlert },
  moderator: { label: 'Moderator', color: 'text-blue-400 bg-blue-500/10', icon: Shield },
  member: { label: 'Member', color: 'text-green-400 bg-green-500/10', icon: User },
  visitor: { label: 'Visitor', color: 'text-gray-400 bg-gray-500/10', icon: User },
};

const ROLE_HIERARCHY = ['visitor', 'member', 'moderator', 'society_admin', 'super_admin'];

const SocietyMembersTab = ({ societyId, userRole }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionMenu, setActionMenu] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const myRole = userRole || 'visitor';
  const myRoleIndex = ROLE_HIERARCHY.indexOf(myRole);
  const canManage = myRoleIndex >= ROLE_HIERARCHY.indexOf('moderator');

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSocietyMembers(societyId);
      setMembers(res.data || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const filtered = members.filter(m => {
    const matchSearch = !search || m.user?.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleAction = async (action, member) => {
    setActionMenu(null);
    setConfirmAction(null);
    try {
      if (action === 'kick') {
        await api.kickMember(societyId, member.user._id);
      } else if (action === 'ban') {
        await api.banMember(societyId, member.user._id);
      } else if (action === 'mute') {
        await api.toggleMuteMember(societyId, member.user._id, member.isMuted ? 0 : 60);
      } else if (action.startsWith('role:')) {
        const newRole = action.split(':')[1];
        await api.changeMemberRole(societyId, member.user._id, newRole);
      }
      loadMembers();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const canActOn = (targetMember) => {
    if (!canManage) return false;
    if (targetMember.user?._id === user?.id) return false;
    const targetRoleIndex = ROLE_HIERARCHY.indexOf(targetMember.role);
    return myRoleIndex > targetRoleIndex;
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
          >
            <option value="all">All Roles</option>
            {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800/50 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
          {filtered.map(member => {
            const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
            const RoleIcon = cfg.icon;
            const isMe = member.user?._id === user?.id;
            const showActions = canActOn(member);

            return (
              <div
                key={member._id}
                className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                  isMe ? 'bg-amber-500/5' : 'hover:bg-gray-50 dark:hover:bg-[#111118]'
                }`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {member.user?.username?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.user?.username || 'Unknown'}
                    </span>
                    {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">you</span>}
                    {member.isMuted && (
                      <VolumeX className="w-3 h-3 text-red-400" title="Muted" />
                    )}
                    {member.isBanned && (
                      <Ban className="w-3 h-3 text-red-400" title="Banned" />
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()} · {member.messagesCount || 0} msgs · {member.eventsAttended || 0} events
                  </div>
                </div>

                {/* Role Badge */}
                <span className={`hidden sm:flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-medium ${cfg.color}`}>
                  <RoleIcon className="w-3 h-3" />
                  {cfg.label}
                </span>

                {/* Score */}
                <div className="text-right flex-shrink-0 hidden md:block">
                  <div className="text-xs font-semibold text-amber-500">{member.contributionScore || 0}</div>
                  <div className="text-[10px] text-gray-400">score</div>
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === member._id ? null : member._id)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {actionMenu === member._id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1e1e30] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1">
                          {/* Role change */}
                          {myRoleIndex >= ROLE_HIERARCHY.indexOf('society_admin') && (
                            <>
                              <div className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wider">Change Role</div>
                              {ROLE_HIERARCHY.filter(r => r !== 'super_admin' && r !== member.role && ROLE_HIERARCHY.indexOf(r) < myRoleIndex).map(r => (
                                <button
                                  key={r}
                                  onClick={() => handleAction(`role:${r}`, member)}
                                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                >
                                  Set as {ROLE_CONFIG[r]?.label}
                                </button>
                              ))}
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                            </>
                          )}

                          <button
                            onClick={() => handleAction('mute', member)}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            {member.isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            {member.isMuted ? 'Unmute' : 'Mute'}
                          </button>

                          <button
                            onClick={() => setConfirmAction({ type: 'kick', member })}
                            className="w-full text-left px-3 py-1.5 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            Kick
                          </button>

                          <button
                            onClick={() => setConfirmAction({ type: 'ban', member })}
                            className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Ban
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No members found</p>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white dark:bg-[#1e1e30] rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {confirmAction.type === 'kick' ? 'Kick Member' : 'Ban Member'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Are you sure you want to {confirmAction.type} <strong>{confirmAction.member.user?.username}</strong>?
              {confirmAction.type === 'ban' && ' They will not be able to rejoin.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirmAction.type, confirmAction.member)}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                  confirmAction.type === 'ban' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {confirmAction.type === 'kick' ? 'Kick' : 'Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyMembersTab;
