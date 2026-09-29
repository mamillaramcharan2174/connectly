import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from '../icons/Icon';

export default function StoryRing({
  user,
  hasUnseen = false,
  isCurrentUser = false,
  hasStory = true,
  onPress,
  onAddStoryPress,
  size = 68
}) {
  const { theme } = useTheme();

  const outerSize = size + 8;
  const innerSize = size;
  const avatarSize = size - 6;

  // Render original ring styling
  const borderColor = hasUnseen
    ? theme.colors.accent // Gradient glow representation
    : hasStory
    ? theme.colors.storySeen
    : 'transparent';

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={isCurrentUser && !hasStory ? onAddStoryPress : onPress}
        style={styles.touchTarget}
      >
        <View
          style={[
            styles.ringContainer,
            {
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
              borderWidth: hasStory ? 2.5 : 0,
              borderColor: borderColor,
              shadowColor: hasUnseen ? theme.colors.accent : 'transparent',
              shadowOpacity: hasUnseen ? 0.35 : 0,
              shadowRadius: 6,
              elevation: hasUnseen ? 4 : 0
            }
          ]}
        >
          <View
            style={[
              styles.innerBorder,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
                backgroundColor: theme.colors.background
              }
            ]}
          >
            <Image
              source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }}
              style={[
                styles.avatar,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2
                }
              ]}
            />
          </View>
        </View>

        {/* Current user Add Story (+) Badge */}
        {isCurrentUser && (
          <TouchableOpacity
            style={[styles.addBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}
            onPress={onAddStoryPress || onPress}
          >
            <Text style={styles.addBadgeText}>+</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Text
        style={[styles.usernameText, { color: theme.colors.textSecondary }]}
        numberOfLines={1}
      >
        {isCurrentUser ? 'Your Story' : user?.username || 'User'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginHorizontal: 7,
    width: 76
  },
  touchTarget: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  innerBorder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatar: {
    backgroundColor: '#374151'
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16
  },
  usernameText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center'
  }
});
