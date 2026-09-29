import React, { createContext, useContext, useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext({
  unreadMessagesCount: 0,
  unreadNotificationsCount: 0,
  activeTypingUsers: {},
  onlineUsers: new Set(),
  toastMessage: null,
  clearToast: () => {}
});

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(2);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(3);
  const [activeTypingUsers, setActiveTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    socketService.connect(token);

    const handleNewMessage = (msg) => {
      if (msg.senderId !== user.id) {
        setUnreadMessagesCount(prev => prev + 1);
        setToastMessage({
          title: `💬 New message from ${msg.senderUsername || 'Someone'}`,
          body: msg.content || (msg.type === 'voice' ? 'Voice note' : 'Sent media')
        });
      }
    };

    const handleNewNotification = (notif) => {
      setUnreadNotificationsCount(prev => prev + 1);
      setToastMessage({
        title: '🔔 Connectly Notification',
        body: notif.message
      });
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleTyping = ({ conversationId, username, isTyping }) => {
      setActiveTypingUsers(prev => ({
        ...prev,
        [conversationId]: isTyping ? username : null
      }));
    };

    socketService.on('message:new', handleNewMessage);
    socketService.on('notification:new', handleNewNotification);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
    socketService.on('user:typing', handleTyping);

    return () => {
      socketService.off('message:new', handleNewMessage);
      socketService.off('notification:new', handleNewNotification);
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
      socketService.off('user:typing', handleTyping);
    };
  }, [token, user]);

  const clearToast = () => setToastMessage(null);

  return (
    <SocketContext.Provider value={{
      unreadMessagesCount,
      unreadNotificationsCount,
      activeTypingUsers,
      onlineUsers,
      toastMessage,
      clearToast
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
