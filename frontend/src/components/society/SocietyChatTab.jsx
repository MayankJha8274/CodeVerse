import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Hash, Smile, Pin, MoreVertical, Reply, Trash2,
  Code, AlertTriangle, CheckCircle, Loader2, Users, ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🤔', '👀', '🔥', '💯'];

const SocietyChatTab = ({ societyId, society, channels = [] }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Set default channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
  }, [channels]);

  // Join society and channel socket rooms
  useEffect(() => {
    if (societyId) {
      socket.joinSociety(societyId);
    }
  }, [societyId]);

  useEffect(() => {
    if (activeChannel?._id) {
      socket.joinChannel(activeChannel._id);
      loadMessages();
      return () => socket.leaveChannel(activeChannel._id);
    }
  }, [activeChannel?._id]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (msg.channel === activeChannel?._id) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    };

    const handleTyping = ({ username, channelId }) => {
      if (channelId === activeChannel?._id && username !== user?.username) {
        setTypingUsers(prev => [...new Set([...prev, username])]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== username));
        }, 3000);
      }
    };

    const handleStoppedTyping = ({ username, channelId }) => {
      if (channelId === activeChannel?._id) {
        setTypingUsers(prev => prev.filter(u => u !== username));
      }
    };

    const handleReactionUpdate = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, reactions } : m
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStoppedTyping);
    socket.on('message_reaction_update', handleReactionUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStoppedTyping);
      socket.off('message_reaction_update', handleReactionUpdate);
    };
  }, [activeChannel?._id, user]);

  const loadMessages = async () => {
    if (!activeChannel) return;
    setLoading(true);
    try {
      const res = await api.getMessages(societyId, activeChannel._id, { limit: 100 });
      setMessages(res.data || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Send via socket for real-time
    socket.sendMessage({
      channelId: activeChannel._id,
      content,
      type: content.startsWith('```') ? 'code' : 'text'
    });

    socket.stopTyping(activeChannel._id);
    inputRef.current?.focus();
  };

  const handleTyping = () => {
    if (activeChannel) {
      socket.startTyping(activeChannel._id);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.stopTyping(activeChannel._id);
      }, 2000);
    }
  };

  const handleReact = (messageId, emoji) => {
    socket.reactToMessage({ messageId, emoji, channelId: activeChannel._id });
    setShowEmojiPicker(null);
  };

  const handleDelete = async (messageId) => {
    try {
      await api.deleteMessage(societyId, activeChannel._id, messageId);
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isDeleted: true, content: '[Message deleted]' } : m
      ));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex h-[calc(100vh-220px)] bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden">
      {/* Channel Sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-[#111118]">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800/50">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Channels</h3>
        </div>
        <div className="p-1.5 space-y-0.5 overflow-y-auto">
          {channels.map(ch => (
            <button
              key={ch._id}
              onClick={() => setActiveChannel(ch)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                activeChannel?._id === ch._id
                  ? 'bg-amber-500/15 text-amber-500 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a2e]'
              }`}
            >
              <Hash className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </div>

        {/* Online Users */}
        <div className="mt-auto p-3 border-t border-gray-200 dark:border-gray-800/50">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Users className="w-3 h-3" /> Online ({socket.onlineUsers?.length || 0})
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {socket.onlineUsers?.slice(0, 10).map(u => (
              <div key={u.userId} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="truncate">{u.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white text-sm">{activeChannel?.name || 'Select a channel'}</span>
            {activeChannel?.description && (
              <span className="text-xs text-gray-400 hidden sm:block">— {activeChannel.description}</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <Hash className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">{date}</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                </div>
                {msgs.map((msg, i) => {
                  const isMine = (msg.sender?._id || msg.sender)?.toString() === (user?.id || user?._id);
                  const showAvatar = i === 0 || msgs[i - 1]?.sender?._id !== msg.sender?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`group relative flex items-start gap-3 py-1 hover:bg-gray-50 dark:hover:bg-[#111118] px-2 -mx-2 rounded ${!showAvatar ? 'mt-0' : 'mt-2'}`}
                    >
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {msg.sender?.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{msg.sender?.username || 'Unknown'}</span>
                            <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                            {msg.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                            {msg.isSolution && <CheckCircle className="w-3 h-3 text-green-500" />}
                          </div>
                        )}
                        <div className={`text-sm text-gray-700 dark:text-gray-300 ${msg.isDeleted ? 'italic text-gray-400' : ''}`}>
                          {msg.type === 'code' ? (
                            <pre className="bg-gray-100 dark:bg-[#0d0d15] rounded-lg p-3 text-xs overflow-x-auto mt-1">
                              <code>{msg.content}</code>
                            </pre>
                          ) : (
                            <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>

                        {/* Reactions */}
                        {msg.reactions?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {msg.reactions.map((r, ri) => (
                              <button
                                key={ri}
                                onClick={() => handleReact(msg._id, r.emoji)}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                  r.users?.some(u => (u._id || u).toString() === user?.id)
                                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.users?.length || 0}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      {!msg.isDeleted && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                          {isMine && (
                            <button
                              onClick={() => handleDelete(msg._id)}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Emoji Picker Popover */}
                      {showEmojiPicker === msg._id && (
                        <div className="absolute right-12 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex gap-1 z-10">
                          {EMOJI_LIST.map(e => (
                            <button
                              key={e}
                              onClick={() => handleReact(msg._id, e)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-1 text-xs text-gray-400 dark:text-gray-500">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* Input */}
        {society?.isMember ? (
          <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-200 dark:border-gray-800/50">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                placeholder={`Message #${activeChannel?.name || 'channel'}...`}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                maxLength={4000}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800/50 text-center">
            <p className="text-sm text-gray-400">Join this society to participate in chat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocietyChatTab;
