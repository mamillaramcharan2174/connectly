import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import Header from '../../components/Header';
import StoryRing from '../../components/StoryRing';
import PostCard from '../../components/PostCard';
import CommentsModal from '../../components/CommentsModal';
import StoryViewer from '../../components/StoryViewer';
import StoryCreator from '../../components/StoryCreator';
import ReportModal from '../../components/ReportModal';

export default function HomeScreen({ navigation, onOpenMessages, onOpenNotifications, onOpenAdmin, onOpenUserProfile }) {
  const { theme } = useTheme();

  const [feedPosts, setFeedPosts] = useState([]);
  const [storiesTray, setStoriesTray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Modals state
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const loadData = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    try {
      const [feedRes, storiesRes] = await Promise.all([
        api.getFeed(pageNum, 10),
        api.getStoriesFeed()
      ]);

      if (feedRes.success && feedRes.data) {
        setFeedPosts(prev => shouldRefresh ? feedRes.data.posts : [...prev, ...feedRes.data.posts]);
        setHasMore(feedRes.data.hasMore);
      }

      if (storiesRes.success && storiesRes.data) {
        setStoriesTray(storiesRes.data.storiesTray || []);
      }
    } catch (err) {
      console.warn('Feed load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(1, true);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadData(1, true);
  };

  const handleEndReached = () => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      loadData(next, false);
    }
  };

  // Story Tray Render
  const renderStoriesHeader = () => (
    <View style={[styles.storiesTrayContainer, { borderBottomColor: theme.colors.border }]}>
      <FlatList
        data={storiesTray}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.userId}
        contentContainerStyle={styles.storiesTrayContent}
        renderItem={({ item }) => (
          <StoryRing
            user={item}
            hasUnseen={item.hasUnseen}
            isCurrentUser={item.isCurrentUser}
            hasStory={item.stories && item.stories.length > 0}
            onPress={() => setActiveStoryGroup(item)}
            onAddStoryPress={() => setShowStoryCreator(true)}
          />
        )}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Brand Header */}
      <Header
        onOpenMessages={onOpenMessages}
        onOpenNotifications={onOpenNotifications}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Main Feed List with Pull-to-Refresh & Infinite Scroll */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading your feed...
          </Text>
        </View>
      ) : (
        <FlatList
          data={feedPosts}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderStoriesHeader}
          contentContainerStyle={styles.feedContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => api.toggleLikePost(item.id)}
              onSave={() => api.toggleSavePost(item.id)}
              onComment={() => setActiveCommentsPost(item)}
              onShare={() => {}}
              onUserPress={username => onOpenUserProfile && onOpenUserProfile(username)}
              onMorePress={() => setReportTarget({ type: 'post', id: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No Posts Yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Follow some creators or share your first moment with the community!
              </Text>
            </View>
          }
        />
      )}

      {/* Comments Slide-Up Modal */}
      {activeCommentsPost && (
        <CommentsModal
          visible={Boolean(activeCommentsPost)}
          post={activeCommentsPost}
          onClose={() => setActiveCommentsPost(null)}
        />
      )}

      {/* Full-Screen 24h Story Viewer */}
      {activeStoryGroup && (
        <StoryViewer
          visible={Boolean(activeStoryGroup)}
          userStoryGroup={activeStoryGroup}
          onClose={() => setActiveStoryGroup(null)}
          onUserPress={username => {
            setActiveStoryGroup(null);
            onOpenUserProfile && onOpenUserProfile(username);
          }}
        />
      )}

      {/* Story Creator Modal */}
      <StoryCreator
        visible={showStoryCreator}
        onClose={() => setShowStoryCreator(false)}
        onPublished={() => loadData(1, true)}
      />

      {/* Content Reporting Modal */}
      {reportTarget && (
        <ReportModal
          visible={Boolean(reportTarget)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  feedContent: {
    paddingBottom: 80
  },
  storiesTrayContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  storiesTrayContent: {
    paddingHorizontal: 8
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18
  }
});
