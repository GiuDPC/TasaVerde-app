import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
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
const INDICATOR_H_MARGIN = 8;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const [barWidth, setBarWidth] = useState(0);

  const slide = useRef(new Animated.Value(state.index)).current;
  const hideY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: state.index,
      damping: 18,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, [state.index, slide]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const show = Keyboard.addListener(showEvent, () => {
      Animated.timing(hideY, { toValue: 200, duration: 180, useNativeDriver: true }).start();
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      Animated.timing(hideY, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    });
    
    return () => {
      show.remove();
      hide.remove();
    };
  }, [hideY]);

  const totalRoutes = state.routes.length;
  const innerWidth = barWidth > 0 ? barWidth - 2 * H_PADDING : winWidth - 32 - 2 * H_PADDING;
  const slotWidth = innerWidth / totalRoutes;
  const indicatorWidth = slotWidth - 2 * INDICATOR_H_MARGIN;

  // We need to provide a default output range to prevent errors when barWidth is 0 initially.
  // But interpolate handles this dynamically.
  const indicatorTranslateX = slide.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => H_PADDING + i * (slotWidth || 1) + INDICATOR_H_MARGIN),
  });

  const containerOpacity = hideY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
  });

  return (
    <Animated.View
      style={[s.container, { bottom: insets.bottom + 14 }, { transform: [{ translateY: hideY }], opacity: containerOpacity }]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[s.indicator, { width: indicatorWidth, transform: [{ translateX: indicatorTranslateX }] }]}
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
      left: 0,
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
