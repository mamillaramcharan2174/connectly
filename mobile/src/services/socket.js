import { io } from 'socket.io-client';
import { getAuthToken } from './api';

const SOCKET_SERVER_URL = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) 
  ? process.env.EXPO_PUBLIC_API_URL 
  : 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token = null) {
    const activeToken = token || getAuthToken();
    if (!activeToken) {
      console.warn('[SocketService] Cannot connect without auth token');
      return;
    }

    if (this.socket && this.socket.connected) {
      return;
    }

    this.socket = io(SOCKET_SERVER_URL, {
      auth: { token: activeToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected with socket ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[SocketService] Connection error:', err.message);
    });

    // Reattach any registered listeners
    for (const [event, callbacks] of this.listeners.entries()) {
      callbacks.forEach(cb => this.socket.on(event, cb));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('conversation:join', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('conversation:leave', conversationId);
    }
  }

  sendTyping(conversationId, isTyping) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('user:typing', { conversationId, isTyping });
    }
  }

  markDelivered(messageId, conversationId, senderId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:delivered', { messageId, conversationId, senderId });
    }
  }

  markRead(messageId, conversationId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:read', { messageId, conversationId });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
