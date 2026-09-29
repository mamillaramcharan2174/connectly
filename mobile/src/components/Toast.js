import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from '../icons/Icon';

export default function Toast({ toast, onDismiss, onPress }) {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (toast) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 9
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true
    }).start(() => onDismiss && onDismiss());
  };

  if (!toast) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderActive
        }
      ]}
    >
      <TouchableOpacity
        style={styles.innerRow}
        activeOpacity={0.9}
        onPress={() => {
          handleDismiss();
          onPress && onPress();
        }}
      >
        <View style={[styles.sparkleDot, { backgroundColor: theme.colors.primary }]} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{toast.title}</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {toast.body}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
          <Icon name="close" size={16} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12
  },
  sparkleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2
  },
  body: {
    fontSize: 12
  },
  closeBtn: {
    padding: 4
  }
});
