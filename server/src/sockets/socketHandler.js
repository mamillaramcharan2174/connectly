const { verifyAccessToken } = require('../utils/security');
const { query } = require('../database');

// In-memory mapping of active connected sockets
// userId -> Set of socketIds
const activeUsers = new Map();
let ioInstance = null;

function setupSockets(io) {
  ioInstance = io;

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    socket.user = decoded;
    next();
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] User connected: ${userId} (socket ${socket.id})`);

    // Track active socket
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
      // Broadcast user online status
      io.emit('user:online', { userId, timestamp: new Date().toISOString() });
      // Update profile status in database
      query('UPDATE profiles SET is_online = TRUE, last_seen_at = $1 WHERE user_id = $2', [new Date().toISOString(), userId]).catch(() => {});
    }
    activeUsers.get(userId).add(socket.id);

    // Join personal room for targeted notifications & DMs
    socket.join(`user:${userId}`);

    // Join conversation rooms
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conv:${conversationId}`);
      console.log(`[Socket] Socket ${socket.id} joined conv:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Real-time Typing Indicator
    socket.on('user:typing', ({ conversationId, isTyping }) => {
      socket.to(`conv:${conversationId}`).emit('user:typing', {
        conversationId,
        userId,
        username: socket.user.username,
        isTyping
      });
    });

    // Message Delivered Receipt
    socket.on('message:delivered', ({ messageId, conversationId, senderId }) => {
      query('UPDATE messages SET status = $1 WHERE id = $2', ['delivered', messageId]).catch(() => {});
      io.to(`conv:${conversationId}`).emit('message:delivered', { messageId, conversationId });
    });

    // Message Read Receipt
    socket.on('message:read', ({ messageId, conversationId }) => {
      query('UPDATE messages SET status = $1 WHERE id = $2', ['read', messageId]).catch(() => {});
      io.to(`conv:${conversationId}`).emit('message:read', { messageId, conversationId, readBy: userId });
    });

    // Message Reaction
    socket.on('message:reaction', ({ messageId, conversationId, emoji }) => {
      io.to(`conv:${conversationId}`).emit('message:reaction', {
        messageId,
        conversationId,
        userId,
        emoji
      });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`[Socket] Socket disconnected: ${socket.id}`);
      if (activeUsers.has(userId)) {
        activeUsers.get(userId).delete(socket.id);
        if (activeUsers.get(userId).size === 0) {
          activeUsers.delete(userId);
          const lastSeen = new Date().toISOString();
          io.emit('user:offline', { userId, lastSeen });
          query('UPDATE profiles SET is_online = FALSE, last_seen_at = $1 WHERE user_id = $2', [lastSeen, userId]).catch(() => {});
        }
      }
    });
  });
}

function emitToUser(userId, event, payload) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, payload);
  }
}

function emitToConversation(conversationId, event, payload) {
  if (ioInstance) {
    ioInstance.to(`conv:${conversationId}`).emit(event, payload);
  }
}

function isUserOnline(userId) {
  return activeUsers.has(userId) && activeUsers.get(userId).size > 0;
}

module.exports = {
  setupSockets,
  emitToUser,
  emitToConversation,
  isUserOnline
};
