// Settings bottom sheet — accessible from the "•••" button on the Dashboard.
// Contains: dark/light theme toggle (with circular transition), accent color
// from the fixed premium palette, restore defaults, and about.
// Uses plain RN Animated (no Reanimated) for maximum device compatibility.

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticImpact, hapticSelection, hapticSuccess } from '../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACCENT_PRESETS, DEFAULT_ACCENT } from '../theme';
import { useTheme } from '../state/ThemeContext';
import { Icon } from './Icon';

function SectionTitle({ label }: { label: string }) {
  const { palette } = useTheme();
  return <Text style={[styles.sectionTitle, { color: palette.textDim }]}>{label}</Text>;
}

export function SettingsSheet() {
  const { palette } = useTheme();
  const { settingsOpen, closeSettings, scheme, accent, setAccent, toggleScheme, resetTheme } = useTheme();
  const { height: winHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(winHeight + 80)).current;

  useEffect(() => {
    if (settingsOpen) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0.55,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: winHeight + 80,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [settingsOpen, backdropOpacity, sheetTranslateY, winHeight]);

  const isDark = scheme === 'dark';

  const handleClose = () => {
    if (Platform.OS === 'web') {
      (globalThis.document?.activeElement as HTMLElement | undefined)?.blur?.();
    }
    closeSettings();
  };

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={settingsOpen ? 'auto' : 'none'}
      importantForAccessibility={settingsOpen ? 'auto' : 'no-hide-descendants'}
      aria-hidden={!settingsOpen}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: palette.card,
            borderColor: palette.border,
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
        accessibilityViewIsModal
        accessibilityLabel="Configuración"
      >
        <View style={[styles.handle, { backgroundColor: palette.borderStrong }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>Configuración</Text>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar configuración"
            style={[styles.closeButton, { backgroundColor: palette.cardInner }]}
          >
            <Icon name="close" size={18} color={palette.textMuted} />
          </Pressable>
        </View>

        <SectionTitle label="Apariencia" />

        <Pressable
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: palette.cardInner, borderColor: palette.border },
            pressed && styles.rowPressed,
          ]}
          onPress={(e) => {
            hapticImpact(Haptics.ImpactFeedbackStyle.Light);
            const ev = e as unknown as { nativeEvent?: { pageX?: number; pageY?: number } };
            toggleScheme({
              x: ev.nativeEvent?.pageX ?? 0,
              y: ev.nativeEvent?.pageY ?? 0,
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Cambiar tema oscuro o claro"
        >
          <View style={[styles.rowIcon, { backgroundColor: palette.accentSoft }]}>
            <Icon name={isDark ? 'moon' : 'sunny'} size={20} color={palette.accent} />
          </View>
          <View style={styles.rowBody}>
            <Text style={[styles.rowTitle, { color: palette.text }]}>Tema oscuro</Text>
            <Text style={[styles.rowSub, { color: palette.textMuted }]}>
              {isDark ? 'Activado' : 'Desactivado'}
            </Text>
          </View>
          <View style={[styles.themeIndicator, { backgroundColor: isDark ? palette.accent : palette.borderStrong }]}>
            <Icon name={isDark ? 'moon' : 'sunny'} size={14} color="#fff" />
          </View>
        </Pressable>

        <View style={[styles.row, { backgroundColor: palette.cardInner, borderColor: palette.border }]}>
          <View style={[styles.rowIcon, { backgroundColor: palette.accentSoft }]}>
            <Icon name="palette" size={20} color={palette.accent} />
          </View>
          <View style={styles.rowBody}>
            <Text style={[styles.rowTitle, { color: palette.text }]}>Color de acento</Text>
            <Text style={[styles.rowSub, { color: palette.textMuted }]}>
              Marca personalizada de la app
            </Text>
          </View>
          <View style={styles.swatches}>
            {ACCENT_PRESETS.map((a) => {
              const selected = a === accent;
              return (
                <Pressable
                  key={a}
                  onPress={() => {
                    hapticSelection();
                    setAccent(a);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Acento ${a}`}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.swatch,
                    { borderColor: selected ? palette.text : 'transparent' },
                    pressed && { transform: [{ scale: 0.9 }] },
                  ]}
                >
                  <View style={[styles.swatchInner, { backgroundColor: a }]}>
                    {selected && <Icon name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: palette.cardInner, borderColor: palette.border },
            pressed && styles.rowPressed,
          ]}
          onPress={() => {
            hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
            resetTheme();
          }}
          accessibilityRole="button"
          accessibilityLabel="Restaurar predeterminados"
        >
          <View style={[styles.rowIcon, { backgroundColor: palette.accentSoft }]}>
            <Icon name="restore" size={20} color={palette.accent} />
          </View>
          <View style={styles.rowBody}>
            <Text style={[styles.rowTitle, { color: palette.text }]}>Restaurar predeterminados</Text>
            <Text style={[styles.rowSub, { color: palette.textMuted }]}>
              Tema oscuro y acento {DEFAULT_ACCENT.toUpperCase()}
            </Text>
          </View>
        </Pressable>

        <View style={styles.about}>
          <Icon name="info" size={14} color={palette.textDim} />
          <Text style={[styles.aboutText, { color: palette.textDim }]}>
            TasaVerde v1.1.0 · Datos: kambio-server
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  rowPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 1,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 120,
    justifyContent: 'flex-end',
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  swatchInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  about: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  aboutText: {
    fontSize: 12,
    marginLeft: 6,
  },
});
