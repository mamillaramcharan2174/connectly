import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import Icon from '../../icons/Icon';

const FILTERS = ['All', 'Likes', 'Comments', 'Follows', 'Mentions'];

export default function NotificationsScreen({ onOpenUserProfile, onBack }) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (_) {
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (_) {}
  };

  const handleFollowToggle = async (actorId) => {
    const isCurrentlyFollowing = followingMap[actorId];
    setFollowingMap(prev => ({ ...prev, [actorId]: !isCurrentlyFollowing }));
    try {
      if (isCurrentlyFollowing) {
        await api.unfollowUser(actorId);
      } else {
        await api.followUser(actorId);
      }
    } catch (_) {}
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Likes') return n.type === 'like_post';
    if (activeFilter === 'Comments') return n.type === 'comment' || n.type === 'comment_reply';
    if (activeFilter === 'Follows') return n.type === 'follow' || n.type === 'follow_request';
    if (activeFilter === 'Mentions') return n.type === 'mention';
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like_post': return <Icon name="heart-filled" size={14} color="#EF4444" />;
      case 'comment':
      case 'comment_reply': return <Icon name="comment" size={14} color="#6366F1" />;
      case 'follow':
      case 'follow_request': return <Icon name="profile-filled" size={14} color="#06B6D4" />;
      case 'story_reaction': return <Text style={{ fontSize: 13 }}>🔥</Text>;
      case 'group_invite': return <Icon name="users" size={14} color="#10B981" />;
      default: return <Icon name="sparkles" size={14} color="#8B5CF6" />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTitleRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Icon name="back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Activity</Text>
        </View>

        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={[styles.markReadText, { color: theme.colors.primary }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === f ? theme.colors.primary : theme.colors.surfaceElevated,
                borderColor: activeFilter === f ? theme.colors.primary : theme.colors.border
              }
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterChipText, { color: activeFilter === f ? '#FFFFFF' : theme.colors.textSecondary }]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifs}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bell" size={42} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No notifications</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              When someone likes, comments, or follows you, you'll see it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notificationItem,
              {
                backgroundColor: item.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                borderBottomColor: theme.colors.border
              }
            ]}
            onPress={() => onOpenUserProfile && onOpenUserProfile(item.actor_username)}
          >
            {/* Actor Avatar with Icon Badge */}
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: item.actor_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }}
                style={styles.avatar}
              />
              <View style={[styles.typeBadge, { backgroundColor: theme.colors.surface }]}>
                {getNotificationIcon(item.type)}
              </View>
            </View>

            {/* Notification Text */}
            <View style={styles.contentContainer}>
              <Text style={[styles.messageText, { color: theme.colors.textPrimary }]}>
                {item.message}
              </Text>
              <Text style={[styles.timeText, { color: theme.colors.textTertiary }]}>2h ago</Text>
            </View>

            {/* Follow Back Action Button (if follow notification) */}
            {item.type === 'follow' && (
              <TouchableOpacity
                style={[
                  styles.followActionBtn,
                  {
                    backgroundColor: followingMap[item.actor_id] ? theme.colors.surfaceElevated : theme.colors.primary,
                    borderColor: followingMap[item.actor_id] ? theme.colors.border : theme.colors.primary
                  }
                ]}
                onPress={() => handleFollowToggle(item.actor_id)}
              >
                <Text
                  style={[
                    styles.followActionText,
                    { color: followingMap[item.actor_id] ? theme.colors.textPrimary : '#FFFFFF' }
                  ]}
                >
                  {followingMap[item.actor_id] ? 'Following' : 'Follow Back'}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: {
    paddingRight: 10
  },
  title: {
    fontSize: 20,
    fontWeight: '800'
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600'
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600'
  },
  listContent: {
    paddingBottom: 80
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151'
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  contentContainer: {
    flex: 1,
    marginRight: 8
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 18
  },
  timeText: {
    fontSize: 11,
    marginTop: 3
  },
  followActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1
  },
  followActionText: {
    fontSize: 12,
    fontWeight: '700'
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center'
  }
});
