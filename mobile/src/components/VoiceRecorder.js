import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from '../icons/Icon';

export default function VoiceRecorder({ onRecordingComplete, onCancel }) {
  const { theme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Waveform visualization amplitudes
  const [waveform, setWaveform] = useState([20, 30, 45, 60, 40]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
        // Emulate microphone input audio amplitude fluctuation
        setWaveform(prev => [
          ...prev.slice(-14),
          Math.floor(20 + Math.random() * 75)
        ]);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSeconds(0);
      pulseAnim.setValue(1);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handlePressIn = () => {
    setIsRecording(true);
  };

  const handlePressOut = () => {
    if (isRecording) {
      setIsRecording(false);
      if (seconds >= 1) {
        onRecordingComplete && onRecordingComplete({
          duration: seconds,
          waveform: waveform.length > 5 ? waveform : [25, 45, 70, 85, 60, 40, 30],
          mediaUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg'
        });
      } else {
        onCancel && onCancel();
      }
    }
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={[styles.activeRecordingRow, { backgroundColor: theme.colors.surfaceElevated }]}>
          {/* Pulsing Red Dot */}
          <View style={[styles.recDot, { backgroundColor: theme.colors.danger }]} />
          <Text style={[styles.timerText, { color: theme.colors.textPrimary }]}>
            {formatTime(seconds)}
          </Text>

          {/* Dynamic Audio Waveform Preview */}
          <View style={styles.liveWaveform}>
            {waveform.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: h * 0.35, backgroundColor: theme.colors.primary }
                ]}
              />
            ))}
          </View>

          <Text style={[styles.slideText, { color: theme.colors.textTertiary }]}>
            Release to send
          </Text>
        </View>
      )}

      {/* Mic Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.micButton,
            {
              backgroundColor: isRecording ? theme.colors.danger : theme.colors.primary
            }
          ]}
          accessibilityLabel="Record Voice Message"
        >
          <Icon name="mic" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  activeRecordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    gap: 8
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700'
  },
  liveWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
    paddingHorizontal: 4
  },
  waveBar: {
    width: 2.5,
    borderRadius: 1.5
  },
  slideText: {
    fontSize: 11
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
