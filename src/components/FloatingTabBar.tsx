// Floating navbar — Telegram-style pill, elevated, with sliding animated
// indicator (Reanimated). Hides with keyboard.

import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, shadows, Palette } from '../theme';
import { useThemeColors } from '../state/ThemeContext';
import { Icon, IconName } from './Icon';

const ICON_MAP: Record<string, IconName> = {
  Tasas: 'graphic',
  Calculadora: 'calculator',
  Historial: 'historialMenu',
};

const H_PADDING = 8;
const INDICATOR_H_MARGIN = 8; // Space between indicator edge and tab slot edge

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const [barWidth, setBarWidth] = useState(0);
  const slide = useSharedValue(state.index);
  const hideY = useSharedValue(0);

  useEffect(() => {
    slide.value = withSpring(state.index, { damping: 18, stiffness: 200 });
  }, [state.index, slide]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => {
      hideY.value = withTiming(200, { duration: 180 });
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      hideY.value = withTiming(0, { duration: 180 });
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [hideY]);

  // The container has paddingHorizontal = H_PADDING. The usable inner width
  // (where tabs live) is barWidth - 2 * H_PADDING. Each tab slot is
  // innerWidth / routes.length. The indicator width = slot - 2 * margin.
  // The indicator translateX = H_PADDING + slot * index + margin.
  const totalRoutes = state.routes.length;
  const innerWidth = barWidth > 0 ? barWidth - 2 * H_PADDING : winWidth - 32 - 2 * H_PADDING;
  const slotWidth = innerWidth / totalRoutes;
  const indicatorWidth = slotWidth - 2 * INDICATOR_H_MARGIN;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: H_PADDING + slide.value * slotWidth + INDICATOR_H_MARGIN }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hideY.value }],
    opacity: 1 - hideY.value / 200,
  }));

  return (
    <Animated.View
      style={[s.container, { bottom: insets.bottom + 14 }, containerStyle]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[s.indicator, { width: indicatorWidth }, indicatorStyle]}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.tabBarLabel ?? route.name) as string;
        const focused = index === state.index;
        const icon = ICON_MAP[route.name] ?? 'graphic';

        return (
          <TouchableOpacity
            key={route.key}
            style={s.item}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
          >
            <Icon name={icon} size={22} color={focused ? c.accent : c.textMuted} />
            <Text style={[s.label, focused && s.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 16,
      right: 16,
      height: 64,
      borderRadius: radii.pill,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: H_PADDING,
      ...shadows.floating,
    },
    indicator: {
      position: 'absolute',
      top: 6,
      bottom: 6,
      left: 0, // translateX handles positioning
      borderRadius: 22,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    item: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: c.textMuted,
    },
    labelActive: {
      color: c.accent,
      fontWeight: '700',
    },
  });
}
