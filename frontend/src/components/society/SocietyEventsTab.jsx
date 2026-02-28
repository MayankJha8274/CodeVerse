import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Plus, MapPin, Video, Clock, Users, Star,
  ChevronRight, X, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import DateTimePicker from '../DateTimePicker';

const SocietyEventsTab = ({ societyId, userRole }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', startTime: '', endTime: '',
    mode: 'online', meetingLink: '', location: '', eventType: 'meetup'
  });
  const [creating, setCreating] = useState(false);

  const canCreate = ['moderator', 'society_admin', 'super_admin'].includes(userRole);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSocietyEvents(societyId, { status: filter });
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [societyId, filter]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.startTime || !createForm.endTime) {
      alert('Please select both start and end time');
      return;
    }
    if (new Date(createForm.endTime) <= new Date(createForm.startTime)) {
      alert('End time must be after start time');
      return;
    }
    setCreating(true);
    try {
      await api.createSocietyEvent(societyId, createForm);
      setShowCreate(false);
      setCreateForm({ title: '', description: '', startTime: '', endTime: '', mode: 'online', meetingLink: '', location: '', eventType: 'meetup' });
      loadEvents();
    } catch (err) {
      alert(err.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleRsvp = async (eventId, status) => {
    try {
      await api.rsvpEvent(societyId, eventId, status);
      setEvents(prev => prev.map(evt => {
        if (evt._id !== eventId) return evt;
        // Update rsvps array optimistically
        const filtered = (evt.rsvps || []).filter(r => r.user !== evt.userRsvpStatus?._id && r.status !== evt.userRsvpStatus);
        const updatedRsvps = [...filtered, { status }];
        return { ...evt, userRsvpStatus: status, rsvps: updatedRsvps };
      }));
    } catch (err) {
      console.error('Failed to RSVP:', err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventTypeColor = (type) => {
    const colors = {
      workshop: 'bg-blue-500/10 text-blue-500',
      contest: 'bg-red-500/10 text-red-500',
      hackathon: 'bg-purple-500/10 text-purple-500',
      webinar: 'bg-green-500/10 text-green-500',
      meetup: 'bg-amber-500/10 text-amber-500',
      study_session: 'bg-cyan-500/10 text-cyan-500',
      other: 'bg-gray-500/10 text-gray-500'
    };
    return colors[type] || colors.other;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#111118] rounded-lg">
          {['upcoming', 'ongoing', 'past'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all capitalize ${
                filter === f
                  ? 'bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 text-xs bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Create Event
          </button>
        )}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {filter} events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(evt => (
            <div key={evt._id} className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl p-5 hover:border-amber-500/30 transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getEventTypeColor(evt.eventType)}`}>
                      {evt.eventType?.replace(/_/g, ' ')}
                    </span>
                    {evt.status === 'cancelled' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">Cancelled</span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{evt.title}</h3>
                  {evt.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{evt.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(evt.startTime)} · {formatTime(evt.startTime)} - {formatTime(evt.endTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      {evt.mode === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      {evt.mode}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {evt.rsvps?.filter(r => r.status === 'going').length || 0} going
                      {evt.maxParticipants && ` / ${evt.maxParticipants}`}
                    </span>
                  </div>
                </div>

                {/* RSVP Buttons */}
                <div className="flex flex-wrap gap-1">
                  {['going', 'maybe', 'not_going'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleRsvp(evt._id, status)}
                      className={`px-2.5 py-1 text-[10px] rounded-lg transition-all font-medium ${
                        evt.userRsvpStatus === status
                          ? status === 'going' ? 'bg-green-500/15 text-green-500 border border-green-500/30'
                            : status === 'maybe' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            : 'bg-red-500/15 text-red-500 border border-red-500/30'
                          : 'text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#111118]'
                      }`}
                    >
                      {status === 'going' ? '✓ Going' : status === 'maybe' ? '? Maybe' : '✗ No'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Event</h2>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DateTimePicker
                  label="Start Time"
                  required
                  value={createForm.startTime}
                  onChange={(v) => setCreateForm(f => ({ ...f, startTime: v }))}
                  minDate={new Date().toISOString()}
                />
                <DateTimePicker
                  label="End Time"
                  required
                  value={createForm.endTime}
                  onChange={(v) => setCreateForm(f => ({ ...f, endTime: v }))}
                  minDate={createForm.startTime || new Date().toISOString()}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                  <select value={createForm.mode} onChange={e => setCreateForm(f => ({ ...f, mode: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white">
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select value={createForm.eventType} onChange={e => setCreateForm(f => ({ ...f, eventType: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white [&>option]:bg-white [&>option]:dark:bg-gray-800 [&>option]:text-gray-900 [&>option]:dark:text-white">
                    <option value="meetup">Meetup</option>
                    <option value="workshop">Workshop</option>
                    <option value="contest">Contest</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="webinar">Webinar</option>
                    <option value="study_session">Study Session</option>
                  </select>
                </div>
              </div>
              {createForm.mode !== 'offline' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Link</label>
                  <input type="url" value={createForm.meetingLink} onChange={e => setCreateForm(f => ({ ...f, meetingLink: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white" placeholder="https://meet.google.com/..." />
                </div>
              )}
              {createForm.mode !== 'online' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input type="text" value={createForm.location} onChange={e => setCreateForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white" placeholder="Room 101, Main building" />
                </div>
              )}
              <button type="submit" disabled={creating}
                className="w-full py-2.5 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyEventsTab;
