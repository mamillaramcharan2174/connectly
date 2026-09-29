import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';
import Icon from '../../icons/Icon';
import GroupCreateModal from './GroupCreateModal';

export default function ConversationListScreen({ onOpenChat, onBack }) {
  const { theme } = useTheme();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      if (res.success && res.data) {
        setConversations(res.data.conversations || []);
      }
    } catch (_) {
    } finally {
      setRefreshing(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const title = c.isGroup ? c.name : (c.name || c.username);
    return !searchQuery.trim() || title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Icon name="back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Messages</Text>
        </View>

        {/* Create Group Button */}
        <TouchableOpacity
          style={[styles.createGroupBtn, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}
          onPress={() => setShowGroupModal(true)}
        >
          <Icon name="create" size={16} color={theme.colors.primary} />
          <Text style={[styles.createGroupText, { color: theme.colors.primary }]}>New Group</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Icon name="search" size={16} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          placeholder="Search chats..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadConversations();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chat" size={44} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No messages yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Start a direct conversation with creators from their profiles or create a group!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUserOnline = !item.isGroup && (item.isOnline || onlineUsers.has(item.partnerId));
          const displayName = item.isGroup ? item.name : (item.name || item.username);

          return (
            <TouchableOpacity
              style={[styles.convItem, { borderBottomColor: theme.colors.border }]}
              onPress={() => onOpenChat && onOpenChat(item.id, item)}
            >
              {/* Avatar + Online Indicator */}
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }}
                  style={styles.avatar}
                />
                {isUserOnline && (
                  <View style={[styles.onlineDot, { backgroundColor: theme.colors.success, borderColor: theme.colors.background }]} />
                )}
              </View>

              {/* Chat Info */}
              <View style={styles.convDetails}>
                <View style={styles.topLine}>
                  <Text style={[styles.convName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={[styles.convTime, { color: theme.colors.textTertiary }]}>
                    Just now
                  </Text>
                </View>
                <View style={styles.bottomLine}>
                  <Text
                    style={[
                      styles.lastMessage,
                      { color: item.unreadCount > 0 ? theme.colors.textPrimary : theme.colors.textSecondary },
                      item.unreadCount > 0 && { fontWeight: '700' }
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Group Create Modal */}
      <GroupCreateModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreated={(newConvId) => {
          setShowGroupModal(false);
          loadConversations();
          onOpenChat && onOpenChat(newConvId, { id: newConvId, isGroup: true, name: 'New Group' });
        }}
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
  headerLeft: {
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
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  createGroupText: {
    fontSize: 12.5,
    fontWeight: '700'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    borderWidth: 1
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13
  },
  listContent: {
    paddingBottom: 80
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#374151'
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2
  },
  convDetails: {
    flex: 1
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  convName: {
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
    marginRight: 8
  },
  convTime: {
    fontSize: 11
  },
  bottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  lastMessage: {
    fontSize: 13,
    flex: 1,
    marginRight: 8
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18
  }
});
