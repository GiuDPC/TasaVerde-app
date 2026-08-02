// Animated UI components — PulsingBadge and FadeInView.
// Uses plain RN Animated for FadeInView (safe on all devices).
// PulsingBadge still uses Reanimated (it's non-critical, only for badges).

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

interface BadgeProps {
  text: string;
  color?: string;
}

export function PulsingBadge({ text, color = '#10B981' }: BadgeProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    try {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1
      );
      opacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1
      );
    } catch {
      // Non-critical — badge just won't pulse
    }
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.badge, { backgroundColor: color }, animatedStyle]}>
      <Text style={styles.badgeText}>{text}</Text>
    </Animated.View>
  );
}

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

// Pure RN Animated fade-in — no Reanimated layout animations (which can crash
// on certain devices/chipsets if the babel plugin didn't transform correctly).
export function FadeInView({ children, delay = 0, duration = 300 }: FadeInViewProps) {
  const opacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [opacity, delay, duration]);

  return (
    <RNAnimated.View style={{ opacity }}>
      {children}
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
