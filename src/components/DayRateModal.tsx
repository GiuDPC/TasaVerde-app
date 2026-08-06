import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../state/ThemeContext';
import { Icon } from './Icon';
import { RateSnapshot, bestRateOf, dayRelativeLabel } from '../utils/ratesLogic';
import { formatBsAmount } from '../utils/currency';
import { radii, Palette } from '../theme';

interface DayRateModalProps {
  snapshot: RateSnapshot | null;
  onClose: () => void;
  onApply: (rate: number, source: string) => void;
}

export function DayRateModal({ snapshot, onClose, onApply }: DayRateModalProps) {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (snapshot) {
      slideAnim.setValue(400);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [snapshot, slideAnim, backdropOpacity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!snapshot) return null;

  const best = bestRateOf(snapshot);
  const bestLabel = best.source === 'binance' ? 'Binance' : 'BCV Dólar';
  const bestIcon = best.source === 'binance' ? ('binance' as const) : ('bcv' as const);

  const rows: { icon: 'bcv' | 'euro' | 'binance'; label: string; value: number }[] = [
    { icon: 'bcv', label: 'BCV Dólar', value: snapshot.bcvUsd },
    { icon: 'euro', label: 'Euro', value: snapshot.bcvEur },
    { icon: 'binance', label: 'Binance P2P', value: snapshot.binance },
  ];

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={s.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
          <Pressable style={s.backdrop} onPress={handleClose} accessibilityLabel="Cerrar" />
        </Animated.View>

        <Animated.View
          style={[
            s.sheet,
            { paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={s.handle} pointerEvents="none" />

          <View style={s.headerRow}>
            <View style={s.titleGroup}>
              <Text style={s.title}>Tasas del {dayRelativeLabel(snapshot.date)}</Text>
              <Text style={s.subtitle}>{snapshot.date.split('-').reverse().join('/')}</Text>
            </View>
            <TouchableOpacity
              style={s.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Icon name="close" size={16} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={s.bestCallout}>
            <View style={s.bestIcon}>
              <Icon name={bestIcon} size={16} color={c.accent} />
            </View>
            <View style={s.bestTextGroup}>
              <Text style={s.bestLabel}>MEJOR OPCIÓN</Text>
              <Text style={s.bestValue}>
                {bestLabel} · {formatBsAmount(best.rate)} Bs/$
              </Text>
            </View>
          </View>

          <View style={s.rows}>
            {rows.map((row) => {
              const isBest = row.value === best.rate;
              return (
                <Pressable
                  key={row.label}
                  style={({ pressed }) => [
                    s.row,
                    { backgroundColor: c.cardInner, borderColor: c.border },
                    isBest && { borderColor: c.accent, backgroundColor: c.accentSoft },
                    pressed && s.rowPressed,
                  ]}
                  onPress={() => {
                    onApply(row.value, row.label);
                    handleClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Calcular con ${row.label}`}
                >
                  <View style={s.rowIcon}>
                    <Icon name={row.icon} size={22} />
                  </View>
                  <Text style={s.rowLabel}>{row.label}</Text>
                  {isBest && (
                    <View style={s.bestBadge}>
                      <Text style={s.bestBadgeText}>MEJOR</Text>
                    </View>
                  )}
                  <Text style={[s.rowValue, isBest && { color: c.accent }]}>
                    {formatBsAmount(row.value)}
                  </Text>
                  <Text style={s.rowChevron}>
                    <Icon name="chevronDown" size={14} color={c.textDim} />
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TouchableOpacity
            style={s.primaryButton}
            activeOpacity={0.85}
            onPress={() => {
              onApply(best.rate, bestLabel);
              handleClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Calcular con la mejor opción"
          >
            <Icon name="checkmark" size={18} color="#fff" />
            <Text style={s.primaryText}>Calcular con la mejor opción</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    sheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    titleGroup: { flex: 1 },
    title: { fontSize: 20, fontWeight: 'bold', color: c.text },
    subtitle: { fontSize: 13, color: c.textDim, marginTop: 2 },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.cardInner,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bestCallout: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radii.card,
      padding: 12,
      marginBottom: 14,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    bestIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    bestTextGroup: { flex: 1 },
    bestLabel: { fontSize: 10, color: c.accent, fontWeight: 'bold', letterSpacing: 0.5 },
    bestValue: { fontSize: 15, fontWeight: 'bold', color: c.text, marginTop: 2 },
    rows: { marginBottom: 18 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
      padding: 12,
      marginBottom: 10,
    },
    rowPressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
    rowIcon: { marginRight: 12 },
    rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    bestBadge: {
      backgroundColor: c.accent,
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginRight: 8,
    },
    bestBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    rowValue: { fontSize: 16, fontWeight: 'bold', color: c.text },
    rowChevron: { marginLeft: 6, transform: [{ rotate: '-90deg' }] },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.accent,
      borderRadius: 14,
      paddingVertical: 15,
    },
    primaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  });
}
