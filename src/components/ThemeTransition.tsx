import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { buildPalette } from '../theme';
import { useTheme } from '../state/ThemeContext';

const DURATION = 450;

export function ThemeTransition() {
  const { pending, finishTransition } = useTheme();
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pending) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) finishTransition();
    });
  }, [pending, progress, finishTransition]);

  if (!pending) return null;

  const d = Math.sqrt(width * width + height * height) * 1.2;
  const bgColor = buildPalette(pending.scheme, pending.accent).bg;

  return (
    <Animated.View
      style={[
        styles.root,
        {
          left: pending.origin.x,
          top: pending.origin.y,
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: bgColor,
          marginLeft: -d / 2,
          marginTop: -d / 2,
          transform: [{ scale: progress }],
          zIndex: 1000,
          elevation: 1000,
        },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
  },
});
