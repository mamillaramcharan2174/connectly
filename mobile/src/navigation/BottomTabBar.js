import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import Icon from '../icons/Icon';

export default function BottomTabBar({ activeTab, onTabPress }) {
  const { theme, isDark } = useTheme();
  const { unreadNotificationsCount } = useSocket();

  const tabs = [
    { id: 'home', icon: 'home', filledIcon: 'home-filled', label: 'Home' },
    { id: 'search', icon: 'search', filledIcon: 'search-filled', label: 'Discover' },
    { id: 'create', icon: 'create', filledIcon: 'create-filled', label: 'Create', isAction: true },
    { id: 'activity', icon: 'bell', filledIcon: 'bell-filled', label: 'Activity' },
    { id: 'profile', icon: 'profile', filledIcon: 'profile-filled', label: 'Profile' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;

        // Custom elevated Center Create Button
        if (tab.isAction) {
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.createActionButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.85}
              accessibilityLabel="Create Post"
            >
              <Icon name="create" size={24} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconContainer}>
              <Icon
                name={isActive ? tab.filledIcon : tab.icon}
                size={23}
                color={isActive ? theme.colors.primary : theme.colors.textSecondary}
              />

              {/* Notification Red Dot Badge */}
              {tab.id === 'activity' && unreadNotificationsCount > 0 && (
                <View style={[styles.notificationDot, { backgroundColor: theme.colors.accent }]} />
              )}
            </View>

            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? theme.colors.primary : theme.colors.textTertiary }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingBottom: 6,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notificationDot: {
    position: 'absolute',
    top: -1,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2
  },
  createActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6
  }
});
