import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Modal, TextInput, Animated } from 'react-native';
import { api } from '../services/api';
import Icon from '../icons/Icon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION_MS = 5000;

export default function StoryViewer({ visible, userStoryGroup, onClose, onUserPress }) {
  if (!visible || !userStoryGroup) return null;

  const stories = userStoryGroup.stories || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [reactedEmoji, setReactedEmoji] = useState(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentStory = stories[currentIdx] || {};

  // Record view on story change
  useEffect(() => {
    if (currentStory.id) {
      api.recordStoryView(currentStory.id).catch(() => {});
      if (userStoryGroup.isCurrentUser) {
        api.getStoryAnalytics(currentStory.id).then(res => {
          if (res.success) setAnalytics(res.data);
        }).catch(() => {});
      }
    }
  }, [currentStory.id, userStoryGroup.isCurrentUser]);

  // Story Timer Progression
  useEffect(() => {
    if (!visible || isPaused) return;

    progressAnim.setValue(0);
    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      useNativeDriver: false
    });

    anim.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => anim.stop();
  }, [currentIdx, isPaused, visible]);

  const handleNext = () => {
    if (currentIdx < stories.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleReaction = async (emoji) => {
    setReactedEmoji(emoji);
    try {
      await api.reactToStory(currentStory.id, emoji);
    } catch (_) {}
    setTimeout(() => setReactedEmoji(null), 1500);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      // Create or get direct conversation with author
      const convRes = await api.getOrCreateDirectConversation(userStoryGroup.userId);
      if (convRes.success && convRes.data) {
        await api.sendMessage(convRes.data.conversationId, {
          type: 'story_reply',
          content: replyText.trim(),
          metadata: { storyId: currentStory.id, caption: currentStory.caption }
        });
      }
      setReplyText('');
    } catch (_) {}
  };

  const mediaItem = currentStory.media?.[0] || {};
  const isTextStory = mediaItem.media_type === 'text' || !mediaItem.media_url;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Story Media Background */}
        {!isTextStory && (
          <Image
            source={{ uri: mediaItem.media_url }}
            style={styles.storyMedia}
            resizeMode="cover"
          />
        )}

        {/* Text Story Styling or Gradient */}
        {isTextStory && (
          <View style={[styles.textStoryBg, { background: currentStory.backgroundStyle || '#4338CA' }]}>
            <Text style={styles.textStoryCaption}>{currentStory.caption}</Text>
          </View>
        )}

        {/* Floating Reacted Emoji Pop */}
        {reactedEmoji && (
          <View style={styles.reactionPop}>
            <Text style={styles.reactionPopText}>{reactedEmoji}</Text>
          </View>
        )}

        {/* Top Progress Segmented Bars */}
        <View style={styles.progressContainer}>
          {stories.map((s, idx) => {
            let widthInterpolation;
            if (idx < currentIdx) {
              widthInterpolation = '100%';
            } else if (idx === currentIdx) {
              widthInterpolation = progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              });
            } else {
              widthInterpolation = '0%';
            }

            return (
              <View key={s.id || idx} style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: widthInterpolation }]} />
              </View>
            );
          })}
        </View>

        {/* Header: User avatar, name, time ago, close button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => {
              onClose();
              if (onUserPress) onUserPress(userStoryGroup.username);
            }}
          >
            <Image source={{ uri: userStoryGroup.avatarUrl }} style={styles.avatar} />
            <Text style={styles.authorName}>{userStoryGroup.username}</Text>
            <Text style={styles.storyTimestamp}>• 24h</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="close" size={24} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Non-Text Caption Overlay */}
        {!isTextStory && currentStory.caption ? (
          <View style={styles.captionOverlay}>
            <Text style={styles.captionOverlayText}>{currentStory.caption}</Text>
          </View>
        ) : null}

        {/* Tap Detection Zones: Left = Prev, Right = Next, Hold = Pause */}
        <View style={styles.touchArea}>
          <TouchableOpacity
            style={styles.leftTouch}
            activeOpacity={1}
            onPress={handlePrev}
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
          />
          <TouchableOpacity
            style={styles.rightTouch}
            activeOpacity={1}
            onPress={handleNext}
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
          />
        </View>

        {/* Bottom Interactive Area */}
        <View style={styles.footer}>
          {/* Quick Reaction Emojis */}
          <View style={styles.quickReactionsRow}>
            {['❤️', '🔥', '👏', '😂', '😍', '😮'].map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiBtn}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reply Input or Creator Analytics trigger */}
          {userStoryGroup.isCurrentUser ? (
            <TouchableOpacity
              style={styles.analyticsButton}
              onPress={() => setShowAnalytics(!showAnalytics)}
            >
              <Text style={styles.analyticsBtnText}>
                👁️ {analytics?.viewsCount || 0} views • View Analytics
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.replyBar}>
              <TextInput
                style={styles.replyInput}
                placeholder={`Reply to ${userStoryGroup.username}...`}
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={replyText}
                onChangeText={setReplyText}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
              />
              <TouchableOpacity
                style={styles.replySendBtn}
                onPress={handleSendReply}
                disabled={!replyText.trim()}
              >
                <Icon name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Creator Analytics Drawer / Sheet */}
        {showAnalytics && analytics && (
          <View style={styles.analyticsDrawer}>
            <View style={styles.analyticsHeader}>
              <Text style={styles.analyticsTitle}>Story Viewers ({analytics.viewsCount})</Text>
              <TouchableOpacity onPress={() => setShowAnalytics(false)}>
                <Icon name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.viewersList}>
              {(analytics.viewers || []).slice(0, 10).map((v, i) => (
                <View key={i} style={styles.viewerItem}>
                  <Image source={{ uri: v.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' }} style={styles.viewerAvatar} />
                  <Text style={styles.viewerName}>{v.username}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative'
  },
  storyMedia: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%'
  },
  textStoryBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  textStoryCaption: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36
  },
  progressContainer: {
    position: 'absolute',
    top: 14,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
    zIndex: 20
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2
  },
  header: {
    position: 'absolute',
    top: 26,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4
  },
  storyTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 6
  },
  closeBtn: {
    padding: 6
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    zIndex: 10
  },
  captionOverlayText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center'
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5
  },
  leftTouch: {
    width: '35%',
    height: '80%'
  },
  rightTouch: {
    width: '65%',
    height: '80%'
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    zIndex: 20
  },
  quickReactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 6,
    borderRadius: 24
  },
  emojiBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  emojiText: {
    fontSize: 24
  },
  reactionPop: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 30
  },
  reactionPopText: {
    fontSize: 72
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 24,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  replyInput: {
    flex: 1,
    height: 42,
    color: '#FFFFFF',
    fontSize: 13
  },
  replySendBtn: {
    padding: 6
  },
  analyticsButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  analyticsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  analyticsDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    zIndex: 40
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  analyticsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  viewersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  viewerItem: {
    alignItems: 'center',
    width: 60
  },
  viewerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 4
  },
  viewerName: {
    color: '#D1D5DB',
    fontSize: 11,
    textAlign: 'center'
  }
});
