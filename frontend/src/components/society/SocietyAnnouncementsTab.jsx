import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Plus, Pin, Eye, MessageSquare, Clock,
  X, Loader2, Send, Smile
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '😂', '🤔', '👏'];

const SocietyAnnouncementsTab = ({ societyId, userRole }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', content: '', isPinned: false });
  const [creating, setCreating] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [markingRead, setMarkingRead] = useState(new Set());

  const canCreate = ['moderator', 'society_admin', 'super_admin'].includes(userRole);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAnnouncements(societyId);
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createAnnouncement(societyId, createForm);
      setShowCreate(false);
      setCreateForm({ title: '', content: '', isPinned: false });
      loadAnnouncements();
    } catch (err) {
      alert(err.message || 'Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleReact = async (announcementId, emoji) => {
    try {
      const res = await api.reactToAnnouncement(societyId, announcementId, emoji);
      setAnnouncements(prev => prev.map(a =>
        a._id === announcementId ? { ...a, reactions: res.data } : a
      ));
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleComment = async (announcementId) => {
    const text = commentText[announcementId]?.trim();
    if (!text) return;
    try {
      const res = await api.commentOnAnnouncement(societyId, announcementId, text);
      setAnnouncements(prev => prev.map(a =>
        a._id === announcementId ? { ...a, comments: res.data } : a
      ));
      setCommentText(prev => ({ ...prev, [announcementId]: '' }));
    } catch (err) {
      console.error('Failed to comment:', err);
    }
  };

  const handleMarkRead = async (announcementId) => {
    if (markingRead.has(announcementId)) return;
    setMarkingRead(prev => new Set(prev).add(announcementId));
    try {
      await api.markAnnouncementRead(societyId, announcementId);
      setAnnouncements(prev => prev.map(a =>
        a._id === announcementId ? { ...a, isRead: true } : a
      ));
    } catch (err) {
      console.error('Failed to mark read:', err);
    } finally {
      setMarkingRead(prev => { const s = new Set(prev); s.delete(announcementId); return s; });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
        </h3>
        {canCreate && (
          <button onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 text-xs bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> New Announcement
          </button>
        )}
      </div>

      {/* Announcements */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <div
              key={ann._id}
              className={`bg-white dark:bg-[#1a1a2e] border rounded-xl p-5 transition-all ${
                ann.isPinned ? 'border-amber-500/30' : 'border-gray-200 dark:border-gray-800/50'
              } ${!ann.isRead ? 'ring-1 ring-amber-500/20' : ''}`}
              onMouseEnter={() => !ann.isRead && handleMarkRead(ann._id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {ann.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                  <h3 className="font-semibold text-gray-900 dark:text-white">{ann.title}</h3>
                  {!ann.isRead && (
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(ann.createdAt)}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">{ann.content}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {ann.author?.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span>{ann.author?.username || 'Unknown'}</span>
              </div>

              {/* Reactions */}
              <div className="flex flex-wrap items-center gap-1 mb-3">
                {ann.reactions?.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleReact(ann._id, r.emoji)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      r.users?.some(u => (u._id || u).toString() === user?.id)
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {r.emoji} {r.users?.length}
                  </button>
                ))}
                <div className="flex gap-0.5 ml-1">
                  {REACTION_EMOJIS.filter(e => !ann.reactions?.find(r => r.emoji === e)).slice(0, 3).map(e => (
                    <button key={e} onClick={() => handleReact(ann._id, e)}
                      className="w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-xs opacity-30 hover:opacity-100 transition-opacity">
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <button
                  onClick={() => setExpandedComments(p => ({ ...p, [ann._id]: !p[ann._id] }))}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mb-2"
                >
                  <MessageSquare className="w-3 h-3" />
                  {ann.comments?.length || 0} comment{ann.comments?.length !== 1 ? 's' : ''}
                </button>

                {expandedComments[ann._id] && (
                  <div className="space-y-2 mb-2">
                    {ann.comments?.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 mt-0.5">
                          {c.user?.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{c.user?.username}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">{c.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText[ann._id] || ''}
                    onChange={e => setCommentText(p => ({ ...p, [ann._id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleComment(ann._id)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  <button
                    onClick={() => handleComment(ann._id)}
                    disabled={!commentText[ann._id]?.trim()}
                    className="p-1.5 bg-amber-500 text-black rounded-lg hover:bg-amber-400 disabled:opacity-30 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Announcement</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input type="text" required value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
                <textarea required value={createForm.content} onChange={e => setCreateForm(f => ({ ...f, content: e.target.value }))} rows={5}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={createForm.isPinned} onChange={e => setCreateForm(f => ({ ...f, isPinned: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5" /> Pin this announcement
                </span>
              </label>
              <button type="submit" disabled={creating}
                className="w-full py-2.5 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                Post Announcement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyAnnouncementsTab;
