import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import Icon from '../../icons/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 36) / 3;

const TRENDING_TAGS = ['#architecture', '#coding', '#blender', '#ambient', '#travel', '#minimalism', '#ui', '#sounddesign'];

export default function SearchScreen({ onOpenUserProfile, onOpenPost }) {
  const { theme } = useTheme();
  const [queryText, setQueryText] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [discoverPosts, setDiscoverPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['marcus_dev', 'sophia_art', 'architecture']);

  useEffect(() => {
    // Load discover posts
    api.getFeed(1, 15).then(res => {
      if (res.success && res.data) {
        setDiscoverPosts(res.data.posts || []);
      }
    }).catch(() => {});
  }, []);

  const handleSearch = async (text) => {
    setQueryText(text);
    if (!text.trim()) {
      setSearchUsers([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.searchUsers(text.trim());
      if (res.success && res.data) {
        setSearchUsers(res.data.users || []);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (username) => {
    if (!recentSearches.includes(username)) {
      setRecentSearches(prev => [username, ...prev.slice(0, 4)]);
    }
    onOpenUserProfile && onOpenUserProfile(username);
  };

  const clearRecent = () => setRecentSearches([]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Input Bar */}
      <View style={[styles.searchBarContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Icon name="search" size={18} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          placeholder="Search creators, hashtags, or posts..."
          placeholderTextColor={theme.colors.textTertiary}
          value={queryText}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {queryText ? (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
            <Icon name="close" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Trending Tags Row */}
      {!queryText && (
        <View style={styles.trendingContainer}>
          <FlatList
            data={TRENDING_TAGS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item}
            contentContainerStyle={styles.trendingContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.tagPill, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                onPress={() => handleSearch(item.replace('#', ''))}
              >
                <Text style={[styles.tagText, { color: theme.colors.primary }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Search Results or Discover Grid */}
      {queryText.trim() ? (
        loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={searchUsers}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No users found for "{queryText}"
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.userResultRow, { borderBottomColor: theme.colors.border }]}
                onPress={() => handleSelectUser(item.username)}
              >
                <Image
                  source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }}
                  style={styles.resultAvatar}
                />
                <View style={styles.resultInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.resultUsername, { color: theme.colors.textPrimary }]}>
                      {item.username}
                    </Text>
                    {item.is_private && (
                      <Text style={[styles.privateBadge, { color: theme.colors.textTertiary }]}>🔒</Text>
                    )}
                  </View>
                  <Text style={[styles.resultDisplayName, { color: theme.colors.textSecondary }]}>
                    {item.display_name || item.username}
                  </Text>
                </View>
                <Icon name="back" size={16} color={theme.colors.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        /* Discover Feed Grid */
        <FlatList
          data={discoverPosts}
          numColumns={3}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => {
            const mediaUrl = item.media?.[0]?.media_url || item.media?.[0]?.url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f';
            return (
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => onOpenPost && onOpenPost(item)}
              >
                <Image source={{ uri: mediaUrl }} style={styles.gridImage} resizeMode="cover" />
                {item.media?.length > 1 && (
                  <View style={styles.multiBadge}>
                    <Text style={styles.multiBadgeText}>📑</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontSize: 14
  },
  clearBtn: {
    padding: 6
  },
  trendingContainer: {
    paddingVertical: 6,
    marginBottom: 8
  },
  trendingContent: {
    paddingHorizontal: 16,
    gap: 8
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600'
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 2
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 1,
    position: 'relative'
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6
  },
  multiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2
  },
  multiBadgeText: {
    fontSize: 10
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 80
  },
  userResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#374151'
  },
  resultInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  resultUsername: {
    fontSize: 14,
    fontWeight: '700'
  },
  privateBadge: {
    fontSize: 12,
    marginLeft: 6
  },
  resultDisplayName: {
    fontSize: 13,
    marginTop: 2
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14
  }
});
