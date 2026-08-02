// Toast global premium (cross-platform): un pill flotante con icono y texto
// que aparece con spring y se auto-oculta. Se dispara con showToast() desde
// cualquier parte de la app sin necesidad de contexto.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, shadows } from '../theme';
import { useThemeColors } from '../state/ThemeContext';
import { Icon, IconName } from './Icon';

interface ToastState {
  id: number;
  message: string;
  icon?: IconName;
}

let showToastFn: ((message: string, icon?: IconName) => void) | null = null;

export function showToast(message: string, icon?: IconName) {
  showToastFn?.(message, icon);
}

export function ToastHost() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    showToastFn = (message, icon) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ id: Date.now(), message, icon });
      opacity.setValue(0);
      translateY.setValue(16);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 240, useNativeDriver: false }),
      ]).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: false }).start(
          ({ finished }) => {
            if (finished) setToast(null);
          }
        );
      }, 2200);
    };
    return () => {
      showToastFn = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [opacity, translateY]);

  if (!toast) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 92 }]} pointerEvents="none">
      <Animated.View style={[styles.pill, { opacity, transform: [{ translateY }] }]}>
        {toast.icon && <Icon name={toast.icon} size={17} color="#34D399" />}
        <Text style={styles.text} numberOfLines={2}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 32,
    right: 32,
    alignItems: 'center',
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    ...shadows.floating,
  },
  text: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
});
