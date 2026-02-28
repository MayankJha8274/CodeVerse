import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, Users, MessageSquare, Calendar,
  ArrowRight, Globe, Lock, Copy, Check, X, Hash, Loader2,
  TrendingUp, Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SocietiesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('my'); // 'my' | 'explore'
  const [mySocieties, setMySocieties] = useState([]);
  const [exploreSocieties, setExploreSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', description: '', isPrivate: false, tags: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const searchTimerRef = useRef(null);

  const loadMySocieties = useCallback(async () => {
    try {
      const res = await api.getMySocieties();
      setMySocieties(res.data || []);
    } catch (err) {
      console.error('Failed to load societies:', err);
    }
  }, []);

  const loadExploreSocieties = useCallback(async () => {
    try {
      const res = await api.exploreSocieties({ search, sort, limit: 50 });
      setExploreSocieties(res.data || []);
    } catch (err) {
      console.error('Failed to explore societies:', err);
    }
  }, [search, sort]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadMySocieties(), loadExploreSocieties()]);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (tab === 'explore') {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        loadExploreSocieties();
      }, 300);
      return () => clearTimeout(searchTimerRef.current);
    }
  }, [search, sort, tab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await api.createSociety({
        name: createForm.name,
        description: createForm.description,
        settings: { isPrivate: createForm.isPrivate },
        tags: createForm.tags ? createForm.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', isPrivate: false, tags: '' });
      navigate(`/societies/${res.data._id}`);
    } catch (err) {
      setCreateError(err.message || 'Failed to create society');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await api.joinSociety(inviteCode.trim());
      setShowJoinModal(false);
      setInviteCode('');
      navigate(`/societies/${res.data.societyId}`);
    } catch (err) {
      setJoinError(err.message || 'Invalid invite code');
    } finally {
      setJoinLoading(false);
    }
  };

  const SocietyCard = ({ society }) => (
    <div
      onClick={() => navigate(`/societies/${society._id}`)}
      className="group bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5 hover:border-amber-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-amber-500/5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {society.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-1">
              {society.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              by {society.owner?.username || 'Unknown'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {society.settings?.isPrivate ? (
            <Lock className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-green-400" />
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 min-h-[2.5rem]">
        {society.description || 'No description'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {society.stats?.totalMembers || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> {society.stats?.totalMessages || 0}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {society.stats?.totalEvents || 0}
          </span>
        </div>
        {society.userRole && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium capitalize">
            {society.userRole.replace('_', ' ')}
          </span>
        )}
        {society.isMember === false && !society.settings?.isPrivate && (
          <span className="text-xs text-amber-500 flex items-center gap-1 font-medium">
            Join <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </div>

      {society.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {society.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 dark:text-gray-400">
              {tag}
            </span>
          ))}
          {society.tags.length > 3 && (
            <span className="text-[10px] text-gray-400">+{society.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-500" /> Societies
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Join coding communities, chat, attend events, and climb leaderboards
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a2e] transition-colors flex items-center gap-2"
          >
            <Hash className="w-4 h-4" /> Join with Code
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Society
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-[#111118] rounded-lg w-fit">
        {[
          { id: 'my', label: 'My Societies', count: mySocieties.length },
          { id: 'explore', label: 'Explore', icon: Sparkles }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2 ${
              tab === t.id
                ? 'bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.icon && <t.icon className="w-3.5 h-3.5" />}
            {t.label}
            {t.count !== undefined && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Explore filters */}
      {tab === 'explore' && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search societies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
          >
            <option value="active">Most Active</option>
            <option value="members">Most Members</option>
            <option value="newest">Newest</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      )}

      {/* Society Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(tab === 'my' ? mySocieties : exploreSocieties).map(society => (
          <SocietyCard key={society._id} society={society} />
        ))}
      </div>

      {/* Empty States */}
      {tab === 'my' && mySocieties.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No societies yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create your first society or join one with an invite code</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 text-sm rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors">
              Create Society
            </button>
            <button onClick={() => setTab('explore')} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a2e] transition-colors">
              Explore
            </button>
          </div>
        </div>
      )}

      {tab === 'explore' && exploreSocieties.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No societies found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Try a different search or create a new society</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Society</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text" required minLength={3} maxLength={50}
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white"
                  placeholder="e.g. DSA Warriors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white resize-none"
                  placeholder="What is this society about?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={createForm.tags}
                  onChange={e => setCreateForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white"
                  placeholder="dsa, competitive-programming, web-dev"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.isPrivate}
                  onChange={e => setCreateForm(f => ({ ...f, isPrivate: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Private Society (invite-only)
                </span>
              </label>
              {createError && <p className="text-sm text-red-500">{createError}</p>}
              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-2.5 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Society
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowJoinModal(false)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Join Society</h2>
              <button onClick={() => setShowJoinModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite Code</label>
                <input
                  type="text" required
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white text-center tracking-widest font-mono text-lg"
                  placeholder="abcd1234"
                />
              </div>
              {joinError && <p className="text-sm text-red-500">{joinError}</p>}
              <button
                type="submit"
                disabled={joinLoading}
                className="w-full py-2.5 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Join
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietiesPage;
