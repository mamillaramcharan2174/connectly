import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from '../icons/Icon';

export default function WaveformPlayer({ waveform = [], duration = 5, isOwn = false }) {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Fallback sample waveform if empty
  const bars = Array.isArray(waveform) && waveform.length > 0
    ? waveform
    : [25, 45, 70, 85, 95, 60, 45, 80, 75, 40, 30, 60, 50, 25];

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress(p => {
          if (p >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return p + 0.1;
        });
      }, (duration * 1000) / 10);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const activeColor = isOwn ? '#FFFFFF' : theme.colors.primary;
  const inactiveColor = isOwn ? 'rgba(255,255,255,0.4)' : theme.colors.textTertiary;

  return (
    <View style={styles.container}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        onPress={togglePlayback}
        style={[styles.playBtn, { backgroundColor: activeColor }]}
      >
        <Icon
          name={isPlaying ? 'pause' : 'play'}
          size={14}
          color={isOwn ? theme.colors.primary : '#FFFFFF'}
        />
      </TouchableOpacity>

      {/* Waveform Bars */}
      <View style={styles.waveformContainer}>
        {bars.map((heightVal, idx) => {
          const barFraction = idx / bars.length;
          const isBarPlayed = barFraction <= playbackProgress;

          return (
            <View
              key={idx}
              style={[
                styles.bar,
                {
                  height: Math.max(6, Math.min(26, heightVal * 0.28)),
                  backgroundColor: isBarPlayed ? activeColor : inactiveColor
                }
              ]}
            />
          );
        })}
      </View>

      {/* Duration Label */}
      <Text style={[styles.durationText, { color: isOwn ? 'rgba(255,255,255,0.85)' : theme.colors.textSecondary }]}>
        0:{duration < 10 ? '0' : ''}{duration}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 28
  },
  bar: {
    width: 2.5,
    borderRadius: 1.5
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 26
  }
});
