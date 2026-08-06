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


export function FadeInView({ children, delay = 0, duration = 300 }: FadeInViewProps) {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(15)).current; // Start slightly below

  useEffect(() => {
    const timeout = setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateY, {
          toValue: 0,
          duration: duration + 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [opacity, translateY, delay, duration]);

  return (
    <RNAnimated.View style={{ opacity, transform: [{ translateY }] }}>
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
