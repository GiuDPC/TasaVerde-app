import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing, Dimensions } from 'react-native';
import { Palette } from '../theme';
import { useThemeColors } from '../state/ThemeContext';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);

  const containerOpacity = useRef(new Animated.Value(1)).current;
  const wordScale = useRef(new Animated.Value(0.7)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.3)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const bar1 = useRef(new Animated.Value(0)).current;
  const bar2 = useRef(new Animated.Value(0)).current;
  const bar3 = useRef(new Animated.Value(0)).current;
  const bar4 = useRef(new Animated.Value(0)).current;
  const barsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      onFinish();
    }, 5000);

    try {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowOpacity, { toValue: 0.25, duration: 300, useNativeDriver: true }),
          Animated.spring(glowScale, {
            toValue: 1,
            tension: 30,
            friction: 10,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(barsOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.stagger(80, [
            Animated.spring(bar1, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
            Animated.spring(bar2, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
            Animated.spring(bar3, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
            Animated.spring(bar4, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(wordOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.spring(wordScale, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(lineOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(lineWidth, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
        Animated.delay(900),
        Animated.timing(containerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        clearTimeout(safetyTimer);
        onFinish();
      });
    } catch {
      clearTimeout(safetyTimer);
      onFinish();
    }

    return () => clearTimeout(safetyTimer);
  }, [
    wordOpacity, wordScale, lineOpacity, lineWidth, containerOpacity,
    glowScale, glowOpacity, bar1, bar2, bar3, bar4, barsOpacity, onFinish,
  ]);

  const BAR_HEIGHTS = [20, 32, 24, 40];
  const bars = [bar1, bar2, bar3, bar4];

  return (
    <Animated.View style={[s.container, { opacity: containerOpacity }]}>
      <Animated.View
        style={[
          s.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <Animated.View style={[s.barsContainer, { opacity: barsOpacity }]}>
        {bars.map((barAnim, i) => (
          <Animated.View
            key={i}
            style={[
              s.bar,
              {
                height: BAR_HEIGHTS[i],
                marginHorizontal: 3,
                transform: [{ scaleY: barAnim }],
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={{ opacity: wordOpacity, transform: [{ scale: wordScale }] }}>
        <View style={s.wordRow}>
          <Text style={s.wordTasa}>Tasa</Text>
          <Text style={s.wordVerde}>Verde</Text>
        </View>
        <Animated.View
          style={[s.underline, { opacity: lineOpacity, transform: [{ scaleX: lineWidth }] }]}
        />
      </Animated.View>

      <Animated.View style={{ opacity: wordOpacity, marginTop: 12 }}>
        <Text style={s.subtitle}>Tasas en tiempo real</Text>
      </Animated.View>
    </Animated.View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    glow: {
      position: 'absolute',
      width: SCREEN_W * 0.8,
      height: SCREEN_W * 0.8,
      borderRadius: SCREEN_W * 0.4,
      backgroundColor: c.accent,
    },
    barsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 20,
      height: 44,
    },
    bar: {
      width: 10,
      borderRadius: 4,
      backgroundColor: c.accent,
    },
    wordRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    wordTasa: {
      fontSize: 46,
      fontWeight: '800',
      color: c.text,
      letterSpacing: 1,
    },
    wordVerde: {
      fontSize: 46,
      fontWeight: '800',
      color: c.accent,
      letterSpacing: 1,
    },
    underline: {
      height: 5,
      borderRadius: 3,
      backgroundColor: c.accent,
      marginTop: 10,
      width: '100%',
    },
    subtitle: {
      fontSize: 14,
      color: c.textMuted,
      letterSpacing: 0.5,
    },
  });
}
