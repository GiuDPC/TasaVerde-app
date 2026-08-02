// Selector de la "tasa activa": muestra con qué tasa se calcula y permite
// cambiar entre la tasa en vivo (BCV / Euro / Binance), una histórica o una
// personalizada. Se reutiliza en las 3 calculadoras.

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticImpact, hapticSelection, hapticSuccess } from '../utils/haptics';
import { Icon } from './Icon';
import { useRates } from '../hooks/useRates';
import { useActiveRate } from '../state/ActiveRateContext';
import { radii, Palette } from '../theme';
import { useThemeColors } from '../state/ThemeContext';
import { formatBsAmount } from '../utils/currency';

export function ActiveRateBanner() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const { config, isOverride, effectiveRate, applyCustom, revert } = useActiveRate();
  const { data: rates } = useRates();

  const value = effectiveRate(rates);
  const chips: { label: string; active: boolean; onPress: () => void }[] = [
    {
      label: 'En vivo',
      active: !isOverride,
      onPress: () => {
        hapticSelection();
        revert();
      },
    },
    ...(rates
      ? [
          {
            label: `BCV ${formatBsAmount(rates.bcv.usd)}`,
            active: config.mode === 'custom' && config.label === 'BCV',
            onPress: () => {
              hapticSelection();
              applyCustom(rates.bcv.usd, 'BCV');
            },
          },
          {
            label: `Euro ${formatBsAmount(rates.bcv.eur)}`,
            active: config.mode === 'custom' && config.label === 'Euro',
            onPress: () => {
              hapticSelection();
              applyCustom(rates.bcv.eur, 'Euro');
            },
          },
          {
            label: `Binance ${formatBsAmount(rates.binance)}`,
            active: config.mode === 'custom' && config.label === 'Binance',
            onPress: () => {
              hapticSelection();
              applyCustom(rates.binance, 'Binance');
            },
          },
        ]
      : []),
  ];

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <View style={s.titleGroup}>
          <Text style={s.label}>CALCULANDO CON</Text>
          <Text style={[s.value, isOverride && s.valueOverride]}>
            {config.label}
            {value > 0 ? ` · ${formatBsAmount(value)} Bs/$` : ''}
          </Text>
        </View>
        {isOverride && (
          <TouchableOpacity
            style={s.revertButton}
            activeOpacity={0.7}
            onPress={() => {
              hapticImpact(Haptics.ImpactFeedbackStyle.Light);
              revert();
            }}
            accessibilityRole="button"
            accessibilityLabel="Volver a usar la tasa del día de hoy"
          >
            <Icon name="restore" size={14} color={c.accent} />
            <Text style={s.revertText}>Usar hoy</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip.label}
            style={[s.chip, chip.active && s.chipActive]}
            onPress={chip.onPress}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, chip.active && s.chipTextActive]}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleGroup: { flex: 1 },
    label: { fontSize: 10, color: c.textDim, fontWeight: 'bold', letterSpacing: 0.5 },
    value: { fontSize: 16, fontWeight: 'bold', color: c.accent, marginTop: 2 },
    valueOverride: { color: c.amber },
    revertButton: {
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accentBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    revertText: { color: c.accent, fontSize: 13, fontWeight: 'bold' },
    chipRow: { gap: 8 },
    chip: {
      backgroundColor: c.cardInner,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    chipText: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    chipTextActive: { color: '#fff', fontWeight: 'bold' },
  });
}
