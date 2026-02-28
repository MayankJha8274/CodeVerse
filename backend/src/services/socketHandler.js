const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const ChatChannel = require('../models/ChatChannel');
const SocietyMember = require('../models/SocietyMember');
const Society = require('../models/Society');
const SocietyStreak = require('../models/SocietyStreak');

// Simple profanity filter (replaces bad-words package which has ESM/CJS issues)
const PROFANITY_LIST = [
  'damn','hell','shit','fuck','ass','bitch','bastard','dick','piss','crap',
  'slut','whore','cock','pussy','fag','nigger','nigga','retard','cunt'
];
const profanityRegex = new RegExp(
  '\\b(' + PROFANITY_LIST.join('|') + ')\\b', 'gi'
);
const filter = {
  clean: (text) => text.replace(profanityRegex, (match) => match[0] + '*'.repeat(match.length - 1))
};

// Track online users per society
const onlineUsers = new Map(); // societyId -> Set of { socketId, userId, username }

const setupSocketIO = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('username fullName avatar');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // ========== JOIN SOCIETY ROOM ==========
    socket.on('join_society', async (societyId) => {
      try {
        const membership = await SocietyMember.findOne({
          society: societyId,
          user: socket.user._id,
          isBanned: false
        });

        if (!membership) {
          socket.emit('error_message', { message: 'Not a member of this society' });
          return;
        }

        socket.join(`society:${societyId}`);
        socket.societyId = societyId;
        socket.membership = membership;

        // Track online user
        if (!onlineUsers.has(societyId)) onlineUsers.set(societyId, new Map());
        onlineUsers.get(societyId).set(socket.user._id.toString(), {
          socketId: socket.id,
          userId: socket.user._id,
          username: socket.user.username,
          fullName: socket.user.fullName,
          avatar: socket.user.avatar
        });

        // Broadcast online users
        io.to(`society:${societyId}`).emit('online_users', {
          users: Array.from(onlineUsers.get(societyId).values()),
          count: onlineUsers.get(societyId).size
        });

        socket.emit('joined_society', { societyId, role: membership.role });
      } catch (error) {
        socket.emit('error_message', { message: 'Failed to join society room' });
      }
    });

    // ========== JOIN CHANNEL ==========
    socket.on('join_channel', async (channelId) => {
      try {
        socket.join(`channel:${channelId}`);
        socket.channelId = channelId;
        socket.emit('joined_channel', { channelId });
      } catch (error) {
        socket.emit('error_message', { message: 'Failed to join channel' });
      }
    });

    // ========== LEAVE CHANNEL ==========
    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // ========== SEND MESSAGE ==========
    socket.on('send_message', async (data) => {
      try {
        const { channelId, content, type, codeLanguage, parentMessage, mentions } = data;

        if (!content || !content.trim()) return;
        if (!socket.membership || socket.membership.isMuted) {
          socket.emit('error_message', { message: 'You are muted' });
          return;
        }

        // Profanity filter
        let filteredContent = content;
        try {
          filteredContent = filter.clean(content);
        } catch (e) {
          // filter might throw on certain chars; use original
        }

        const message = await Message.create({
          channel: channelId,
          society: socket.societyId,
          sender: socket.user._id,
          content: filteredContent.trim(),
          type: type || 'text',
          codeLanguage: codeLanguage || null,
          parentMessage: parentMessage || null,
          mentions: mentions || []
        });

        // Update thread count
        if (parentMessage) {
          await Message.findByIdAndUpdate(parentMessage, { $inc: { threadCount: 1 } });
        }

        // Update channel and society stats
        await ChatChannel.findByIdAndUpdate(channelId, {
          lastMessage: message._id,
          $inc: { messageCount: 1 }
        });

        await Society.findByIdAndUpdate(socket.societyId, {
          $inc: { 'stats.totalMessages': 1 }
        });

        await SocietyMember.findOneAndUpdate(
          { society: socket.societyId, user: socket.user._id },
          { $inc: { messagesCount: 1 } }
        );

        // Record streak
        const streak = await SocietyStreak.findOne({ user: socket.user._id, society: socket.societyId });
        if (streak) await streak.recordActivity('message');

        // Populate sender and broadcast
        await message.populate('sender', 'username fullName avatar');

        const messageData = message.toObject();

        // Emit to the channel
        io.to(`channel:${channelId}`).emit('new_message', messageData);

        // If it's a thread reply, also notify the parent channel
        if (parentMessage) {
          io.to(`channel:${channelId}`).emit('thread_update', {
            parentId: parentMessage,
            threadCount: (await Message.countDocuments({ parentMessage }))
          });
        }

        // Notify mentioned users
        if (mentions && mentions.length > 0) {
          mentions.forEach(userId => {
            const societyOnline = onlineUsers.get(socket.societyId);
            if (societyOnline) {
              const userOnline = societyOnline.get(userId.toString());
              if (userOnline) {
                io.to(userOnline.socketId).emit('mention_notification', {
                  message: messageData,
                  channel: channelId,
                  society: socket.societyId
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Socket send_message error:', error);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });

    // ========== TYPING INDICATOR ==========
    socket.on('typing_start', (channelId) => {
      socket.to(`channel:${channelId}`).emit('user_typing', {
        userId: socket.user._id,
        username: socket.user.username,
        channelId
      });
    });

    socket.on('typing_stop', (channelId) => {
      socket.to(`channel:${channelId}`).emit('user_stopped_typing', {
        userId: socket.user._id,
        username: socket.user.username,
        channelId
      });
    });

    // ========== REACTIONS ==========
    socket.on('react_message', async ({ messageId, emoji, channelId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existing = message.reactions.find(r => r.emoji === emoji);
        if (existing) {
          const idx = existing.users.indexOf(socket.user._id);
          if (idx > -1) {
            existing.users.splice(idx, 1);
            if (existing.users.length === 0) {
              message.reactions = message.reactions.filter(r => r.emoji !== emoji);
            }
          } else {
            existing.users.push(socket.user._id);
          }
        } else {
          message.reactions.push({ emoji, users: [socket.user._id] });
        }

        await message.save();
        io.to(`channel:${channelId}`).emit('message_reaction_update', {
          messageId,
          reactions: message.reactions
        });
      } catch (error) {
        socket.emit('error_message', { message: 'Failed to react' });
      }
    });

    // ========== MESSAGE READ ==========
    socket.on('mark_read', async ({ channelId, messageIds }) => {
      try {
        if (messageIds && messageIds.length > 0) {
          await Message.updateMany(
            { _id: { $in: messageIds } },
            { $addToSet: { readBy: { user: socket.user._id, readAt: new Date() } } }
          );
        }
      } catch (error) {
        // Silent fail for read receipts
      }
    });

    // ========== DISCONNECT ==========
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.username} (${socket.id})`);

      // Remove from online users
      if (socket.societyId && onlineUsers.has(socket.societyId)) {
        onlineUsers.get(socket.societyId).delete(socket.user._id.toString());
        const remaining = onlineUsers.get(socket.societyId);

        io.to(`society:${socket.societyId}`).emit('online_users', {
          users: Array.from(remaining.values()),
          count: remaining.size
        });

        if (remaining.size === 0) onlineUsers.delete(socket.societyId);
      }
    });
  });

  return io;
};

module.exports = { setupSocketIO };
