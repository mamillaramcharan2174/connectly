import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from '../icons/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PostCard({
  post,
  onLike,
  onComment,
  onSave,
  onShare,
  onUserPress,
  onMorePress
}) {
  const { theme } = useTheme();
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const mediaList = post.media || [];
  const currentMedia = mediaList[currentMediaIdx] || { media_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80' };

  const handleLikePress = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    if (onLike) onLike(post.id);
  };

  const handleSavePress = () => {
    setIsSaved(!isSaved);
    if (onSave) onSave(post.id);
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'just now';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Header: User avatar, username, location, more button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfoRow}
          onPress={() => onUserPress && onUserPress(post.user?.username)}
        >
          <Image
            source={{ uri: post.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }}
            style={styles.avatar}
          />
          <View style={styles.userTextContainer}>
            <View style={styles.nameRow}>
              <Text style={[styles.username, { color: theme.colors.textPrimary }]}>
                {post.user?.username || 'user'}
              </Text>
              <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
                • {timeAgo(post.createdAt)}
              </Text>
            </View>
            {post.location ? (
              <Text style={[styles.location, { color: theme.colors.textSecondary }]}>
                {post.location}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onMorePress && onMorePress(post)}
        >
          <Icon name="more" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Media Carousel Area */}
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: currentMedia.media_url || currentMedia.url }}
          style={styles.mediaImage}
          resizeMode="cover"
        />

        {/* Carousel indicators (if multiple images) */}
        {mediaList.length > 1 && (
          <View style={styles.carouselPaging}>
            {mediaList.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setCurrentMediaIdx(i)}
                style={[
                  styles.carouselDot,
                  {
                    backgroundColor: i === currentMediaIdx ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                    width: i === currentMediaIdx ? 16 : 6
                  }
                ]}
              />
            ))}
          </View>
        )}

        {/* Carousel index tag in top right */}
        {mediaList.length > 1 && (
          <View style={styles.mediaIndexBadge}>
            <Text style={styles.mediaIndexText}>{`${currentMediaIdx + 1}/${mediaList.length}`}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons: Like, Comment, Share, Save */}
      <View style={styles.actionsBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLikePress}
            accessibilityLabel="Like"
          >
            <Icon
              name={isLiked ? 'heart-filled' : 'heart'}
              size={22}
              color={isLiked ? theme.colors.danger : theme.colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onComment && onComment(post)}
            accessibilityLabel="Comment"
          >
            <Icon name="comment" size={21} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onShare && onShare(post)}
            accessibilityLabel="Share"
          >
            <Icon name="share" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleSavePress}
          accessibilityLabel="Save Post"
        >
          <Icon
            name={isSaved ? 'bookmark-filled' : 'bookmark'}
            size={22}
            color={isSaved ? theme.colors.primary : theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      <View style={styles.likesRow}>
        <Text style={[styles.likesText, { color: theme.colors.textPrimary }]}>
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </Text>
      </View>

      {/* Caption & Hashtags */}
      {post.caption ? (
        <View style={styles.captionContainer}>
          <Text style={[styles.captionText, { color: theme.colors.textPrimary }]}>
            <Text
              style={styles.captionUsername}
              onPress={() => onUserPress && onUserPress(post.user?.username)}
            >
              {post.user?.username}{' '}
            </Text>
            {showFullCaption || post.caption.length <= 90
              ? post.caption
              : `${post.caption.slice(0, 90)}... `}
            {post.caption.length > 90 && (
              <Text
                style={[styles.moreText, { color: theme.colors.textTertiary }]}
                onPress={() => setShowFullCaption(!showFullCaption)}
              >
                {showFullCaption ? ' less' : 'more'}
              </Text>
            )}
          </Text>
        </View>
      ) : null}

      {/* View Comments Link */}
      <TouchableOpacity
        style={styles.commentsLink}
        onPress={() => onComment && onComment(post)}
      >
        <Text style={[styles.commentsLinkText, { color: theme.colors.textSecondary }]}>
          {post.commentsCount > 0
            ? `View all ${post.commentsCount} comments`
            : 'Add a comment...'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#374151'
  },
  userTextContainer: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  username: {
    fontSize: 14,
    fontWeight: '700'
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 6
  },
  location: {
    fontSize: 11,
    marginTop: 1
  },
  moreButton: {
    padding: 6
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
    position: 'relative'
  },
  mediaImage: {
    width: '100%',
    height: '100%'
  },
  carouselPaging: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  carouselDot: {
    height: 6,
    borderRadius: 3
  },
  mediaIndexBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  mediaIndexText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600'
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionBtn: {
    padding: 6
  },
  likesRow: {
    paddingHorizontal: 14,
    paddingVertical: 2
  },
  likesText: {
    fontSize: 14,
    fontWeight: '700'
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingTop: 4
  },
  captionText: {
    fontSize: 13.5,
    lineHeight: 19
  },
  captionUsername: {
    fontWeight: '700'
  },
  moreText: {
    fontWeight: '500'
  },
  commentsLink: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 14
  },
  commentsLinkText: {
    fontSize: 13
  }
});
