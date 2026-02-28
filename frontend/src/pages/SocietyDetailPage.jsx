import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Calendar, Megaphone, Trophy, Users, Settings,
  ArrowLeft, Copy, Check, Globe, Lock, LogOut, Loader2, BarChart3,
  Shield, Hash, ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SocietyChatTab from '../components/society/SocietyChatTab';
import SocietyEventsTab from '../components/society/SocietyEventsTab';
import SocietyAnnouncementsTab from '../components/society/SocietyAnnouncementsTab';
import SocietyLeaderboardTab from '../components/society/SocietyLeaderboardTab';
import SocietyMembersTab from '../components/society/SocietyMembersTab';
import SocietyAdminTab from '../components/society/SocietyAdminTab';

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'members', label: 'Members', icon: Users },
];

const ADMIN_TABS = ['society_admin', 'super_admin'];

const SocietyDetailPage = () => {
  const { societyId, tab: urlTab } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(urlTab || 'chat');
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadSociety = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSociety(societyId);
      setSociety(res.data);
    } catch (err) {
      console.error('Failed to load society:', err);
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => { loadSociety(); }, [loadSociety]);

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) setActiveTab(urlTab);
  }, [urlTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/societies/${societyId}/${tabId}`, { replace: true });
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(society?.inviteCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this society?')) return;
    setLeaving(true);
    try {
      await api.leaveSociety(societyId);
      navigate('/societies');
    } catch (err) {
      alert(err.message || 'Failed to leave');
    } finally {
      setLeaving(false);
    }
  };

  const isAdmin = ADMIN_TABS.includes(society?.userRole);
  const allTabs = isAdmin ? [...TABS, { id: 'admin', label: 'Admin', icon: BarChart3 }] : TABS;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!society) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Society not found</h2>
        <button onClick={() => navigate('/societies')} className="text-amber-500 hover:underline text-sm">
          Back to Societies
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/societies')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {society.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {society.name}
                {society.settings?.isPrivate ? (
                  <Lock className="w-4 h-4 text-gray-400" />
                ) : (
                  <Globe className="w-4 h-4 text-green-400" />
                )}
              </h1>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {society.memberCount || 0} members</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {society.stats?.totalMessages || 0}</span>
                {society.userRole && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium capitalize">
                    {society.userRole.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {society.isMember && society.inviteCode && (
              <button
                onClick={handleCopyInvite}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111118] transition-colors flex items-center gap-1.5 font-mono"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {society.inviteCode}
              </button>
            )}
            {society.isMember && society.owner?._id !== user?.id && (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> Leave
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {allTabs.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-amber-500/15 text-amber-500 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111118] hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'chat' && <SocietyChatTab societyId={societyId} society={society} channels={society.channels} />}
        {activeTab === 'events' && <SocietyEventsTab societyId={societyId} userRole={society.userRole} />}
        {activeTab === 'announcements' && <SocietyAnnouncementsTab societyId={societyId} userRole={society.userRole} />}
        {activeTab === 'leaderboard' && <SocietyLeaderboardTab societyId={societyId} />}
        {activeTab === 'members' && <SocietyMembersTab societyId={societyId} userRole={society.userRole} currentUserId={user?.id} />}
        {activeTab === 'admin' && isAdmin && <SocietyAdminTab societyId={societyId} society={society} onUpdate={loadSociety} />}
      </div>
    </div>
  );
};

export default SocietyDetailPage;
