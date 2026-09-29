import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Icon from '../../icons/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 36) / 3;

export default function ProfileScreen({
  targetUsername = null,
  onOpenSettings,
  onOpenEditProfile,
  onOpenDirectChat,
  onOpenPost,
  onBack
}) {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();

  const isOwnProfile = !targetUsername || targetUsername === currentUser?.username;
  const activeUsername = targetUsername || currentUser?.username;

  const [profileUser, setProfileUser] = useState(isOwnProfile ? currentUser : null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'tagged' | 'saved'
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (activeUsername) {
      loadProfile();
    }
  }, [activeUsername]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getProfile(activeUsername);
      if (res.success && res.data) {
        setProfileUser(res.data.user);
        setPosts(res.data.posts || []);
        setIsFollowing(res.data.user.isFollowing);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profileUser) return;
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    try {
      if (nextState) {
        await api.followUser(profileUser.id);
        setProfileUser(prev => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
      } else {
        await api.unfollowUser(profileUser.id);
        setProfileUser(prev => ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 0) - 1) }));
      }
    } catch (_) {}
  };

  const handleOpenChat = async () => {
    if (!profileUser) return;
    try {
      const res = await api.getOrCreateDirectConversation(profileUser.id);
      if (res.success && res.data) {
        onOpenDirectChat && onOpenDirectChat(res.data.conversationId, profileUser);
      }
    } catch (_) {}
  };

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarTitleRow}>
          {!isOwnProfile && onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Icon name="back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerUsername, { color: theme.colors.textPrimary }]}>
            {profileUser?.username || 'user'}
          </Text>
          {profileUser?.isPrivate && <Text style={{ marginLeft: 6 }}>🔒</Text>}
        </View>

        {isOwnProfile && (
          <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn}>
            <Icon name="more" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Bio Row */}
      <View style={styles.bioRow}>
        <View style={[styles.avatarBorder, { borderColor: theme.colors.primary }]}>
          <Image
            source={{ uri: profileUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' }}
            style={styles.avatarImage}
          />
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
              {profileUser?.postsCount || posts.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Posts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
              {profileUser?.followersCount || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
              {profileUser?.followingCount || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Following</Text>
          </View>
        </View>
      </View>

      {/* Name, Bio & Website */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.displayName, { color: theme.colors.textPrimary }]}>
          {profileUser?.displayName || profileUser?.fullName || profileUser?.username}
        </Text>
        {profileUser?.bio ? (
          <Text style={[styles.bioText, { color: theme.colors.textSecondary }]}>
            {profileUser.bio}
          </Text>
        ) : null}
        {profileUser?.website ? (
          <Text style={[styles.websiteText, { color: theme.colors.primary }]}>
            🔗 {profileUser.website}
          </Text>
        ) : null}
      </View>

      {/* Profile Action Buttons */}
      <View style={styles.actionsContainer}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={[styles.fullWidthBtn, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
            onPress={onOpenEditProfile}
          >
            <Text style={[styles.btnText, { color: theme.colors.textPrimary }]}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.dualActionsRow}>
            <TouchableOpacity
              style={[
                styles.halfBtn,
                { backgroundColor: isFollowing ? theme.colors.surfaceElevated : theme.colors.primary }
              ]}
              onPress={handleFollowToggle}
            >
              <Text style={[styles.btnText, { color: isFollowing ? theme.colors.textPrimary : '#FFFFFF' }]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.halfBtn, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
              onPress={handleOpenChat}
            >
              <Text style={[styles.btnText, { color: theme.colors.textPrimary }]}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Profile Tabs */}
      <View style={[styles.tabsBar, { borderTopColor: theme.colors.border, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'posts' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('posts')}
        >
          <Icon name="create" size={20} color={activeTab === 'posts' ? theme.colors.primary : theme.colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tagged' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('tagged')}
        >
          <Icon name="profile" size={20} color={activeTab === 'tagged' ? theme.colors.primary : theme.colors.textTertiary} />
        </TouchableOpacity>

        {isOwnProfile && (
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'saved' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('saved')}
          >
            <Icon name="bookmark" size={20} color={activeTab === 'saved' ? theme.colors.primary : theme.colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          numColumns={3}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => onOpenPost && onOpenPost(item)}
            >
              <Image
                source={{ uri: item.thumbnail_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f' }}
                style={styles.gridImg}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyGrid}>
              <Icon name="create" size={40} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyGridTitle, { color: theme.colors.textPrimary }]}>No posts yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  profileHeader: {
    paddingBottom: 4
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  topBarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: {
    paddingRight: 10
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '800'
  },
  settingsBtn: {
    padding: 6
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  avatarBorder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statBox: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800'
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700'
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  websiteText: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 4
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  fullWidthBtn: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dualActionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnText: {
    fontSize: 13.5,
    fontWeight: '700'
  },
  tabsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1
  },
  tabItem: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 80
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 1
  },
  gridImg: {
    width: '100%',
    height: '100%',
    borderRadius: 4
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyGrid: {
    padding: 60,
    alignItems: 'center'
  },
  emptyGridTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12
  }
});
