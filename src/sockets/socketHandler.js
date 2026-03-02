const { verifyToken } = require('../utils/jwt');
const chatsRepo = require('../modules/chats/chats.repository');
const messagesRepo = require('../modules/messages/messages.repository');

// Track online users: { userId -> Set<socketId> }
const onlineUsers = new Map();

const addOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
  if (onlineUsers.has(userId)) {
    onlineUsers.get(userId).delete(socketId);
    if (onlineUsers.get(userId).size === 0) {
      onlineUsers.delete(userId);
    }
  }
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};

const initSocket = (io) => {
  // ─── Auth middleware for Socket.io ─────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, userRole } = socket;
    console.log(`[Socket] ✅ Connected: userId=${userId} role=${userRole} socketId=${socket.id}`);

    // Track online
    addOnlineUser(userId, socket.id);

    // Notify others that user is online
    socket.broadcast.emit('user_online', { userId });

    // ─── authenticate (re-auth if needed) ────────────────────────────────────
    socket.on('authenticate', (callback) => {
      if (typeof callback === 'function') {
        callback({ success: true, userId, role: userRole });
      }
    });

    // ─── join_chat ────────────────────────────────────────────────────────────
    socket.on('join_chat', async ({ chatId }, callback) => {
      try {
        if (!chatId) {
          if (typeof callback === 'function') callback({ success: false, error: 'chatId required' });
          return;
        }

        // Verify user is a participant
        const isMember = await chatsRepo.isUserInChat(chatId, userId);
        if (!isMember) {
          if (typeof callback === 'function') callback({ success: false, error: 'Access denied to this chat' });
          return;
        }

        const room = `chat:${chatId}`;
        await socket.join(room);
        console.log(`[Socket] ${userId} joined room ${room}`);

        if (typeof callback === 'function') callback({ success: true, room });
      } catch (error) {
        console.error('[Socket] join_chat error:', error.message);
        if (typeof callback === 'function') callback({ success: false, error: 'Failed to join chat' });
      }
    });

    // ─── send_message ─────────────────────────────────────────────────────────
    socket.on('send_message', async ({ chatId, message_text }, callback) => {
      try {
        if (!chatId || !message_text?.trim()) {
          if (typeof callback === 'function') callback({ success: false, error: 'chatId and message_text required' });
          return;
        }

        if (message_text.length > 5000) {
          if (typeof callback === 'function') callback({ success: false, error: 'Message too long' });
          return;
        }

        // Verify access
        const isMember = await chatsRepo.isUserInChat(chatId, userId);
        if (!isMember) {
          if (typeof callback === 'function') callback({ success: false, error: 'Access denied' });
          return;
        }

        // Persist message
        const message = await messagesRepo.createMessage({
          chatId,
          senderId: userId,
          messageText: message_text.trim(),
        });

        const room = `chat:${chatId}`;

        // Emit to all room members
        io.to(room).emit('receive_message', {
          ...message,
          sender_role: userRole,
        });

        if (typeof callback === 'function') callback({ success: true, message });
      } catch (error) {
        console.error('[Socket] send_message error:', error.message);
        if (typeof callback === 'function') callback({ success: false, error: 'Failed to send message' });
      }
    });

    // ─── typing_start ─────────────────────────────────────────────────────────
    socket.on('typing_start', ({ chatId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('typing_start', { userId, chatId });
    });

    // ─── typing_stop ──────────────────────────────────────────────────────────
    socket.on('typing_stop', ({ chatId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('typing_stop', { userId, chatId });
    });

    // ─── mark_read ────────────────────────────────────────────────────────────
    socket.on('mark_read', async ({ chatId }, callback) => {
      try {
        if (!chatId) {
          if (typeof callback === 'function') callback({ success: false, error: 'chatId required' });
          return;
        }

        const isMember = await chatsRepo.isUserInChat(chatId, userId);
        if (!isMember) {
          if (typeof callback === 'function') callback({ success: false, error: 'Access denied' });
          return;
        }

        const updated = await messagesRepo.markMessagesAsRead(chatId, userId);

        // Notify the other party that messages were read
        socket.to(`chat:${chatId}`).emit('messages_read', { chatId, readBy: userId, count: updated.length });

        if (typeof callback === 'function') callback({ success: true, updatedCount: updated.length });
      } catch (error) {
        console.error('[Socket] mark_read error:', error.message);
        if (typeof callback === 'function') callback({ success: false, error: 'Failed to mark as read' });
      }
    });

    // ─── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] ❌ Disconnected: userId=${userId} reason=${reason}`);
      removeOnlineUser(userId, socket.id);

      // Only emit offline if user has no other active connections
      if (!isUserOnline(userId)) {
        socket.broadcast.emit('user_offline', { userId });
      }
    });
  });
};

module.exports = { initSocket, isUserOnline };
