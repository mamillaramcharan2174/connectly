import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Icon from '../icons/Icon';

export default function Header({ title, onOpenMessages, onOpenNotifications, onOpenAdmin }) {
  const { theme, isDark, setThemePreference } = useTheme();
  const { unreadMessagesCount, unreadNotificationsCount } = useSocket();
  const { user } = useAuth();

  const toggleTheme = () => {
    setThemePreference(isDark ? 'light' : 'dark');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
      {/* Brand Logo & Name */}
      <View style={styles.brandRow}>
        <View style={[styles.logoIconWrapper, { backgroundColor: theme.colors.primary }]}>
          <Icon name="logo" size={20} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
          {title || 'Connectly'}
        </Text>
      </View>

      {/* Action Icons */}
      <View style={styles.actionsRow}>
        {/* Theme Toggle */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          onPress={toggleTheme}
          accessibilityLabel="Toggle Theme"
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Admin Shield if Admin */}
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}
            onPress={onOpenAdmin}
            accessibilityLabel="Admin Dashboard"
          >
            <Icon name="shield" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}

        {/* Notifications Icon with Badge */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          onPress={onOpenNotifications}
          accessibilityLabel="Notifications"
        >
          <Icon name="bell" size={21} color={theme.colors.textPrimary} />
          {unreadNotificationsCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
              <Text style={styles.badgeText}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Direct Messages Icon with Badge */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          onPress={onOpenMessages}
          accessibilityLabel="Messages"
        >
          <Icon name="chat" size={21} color={theme.colors.textPrimary} />
          {unreadMessagesCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.badgeText}>
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  }
});
