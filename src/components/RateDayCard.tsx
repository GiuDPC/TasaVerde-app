// Tarjeta de un día del historial de tasas. Al tocarla (desde la pantalla de
// Historial) se abre el modal para aplicar esa tasa en los cálculos.

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, Palette } from '../theme';
import { useThemeColors } from '../state/ThemeContext';
import { RateSnapshot, bestRateOf, dayRelativeLabel } from '../utils/ratesLogic';
import { formatBsAmount } from '../utils/currency';
import { Icon } from './Icon';

interface RateDayCardProps {
  snapshot: RateSnapshot;
  applied: boolean;
  onPress: () => void;
}

export function RateDayCard({ snapshot, applied, onPress }: RateDayCardProps) {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);

  const best = bestRateOf(snapshot);
  const bestLabel = best.source === 'binance' ? 'Binance' : 'BCV Dólar';
  const [y, m, d] = snapshot.date.split('-');
  const monthShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(m) - 1];

  return (
    <Pressable
      style={({ pressed }) => [s.card, applied && s.cardApplied, pressed && s.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Tasas de ${dayRelativeLabel(snapshot.date)}`}
    >
      <View style={s.row}>
        <View style={[s.calendarTile, applied && s.calendarTileActive]}>
          <Text style={s.calendarMonth}>{monthShort.toUpperCase()}</Text>
          <Text style={[s.calendarDay, applied && { color: c.accent }]}>{d}</Text>
        </View>

        <View style={s.dateColumn}>
          <Text style={s.dateLabel}>{dayRelativeLabel(snapshot.date)}</Text>
          <Text style={s.dateSub}>{`${d}/${m}/${y}`}</Text>
        </View>

        <View style={s.chevron}>
          <Icon name="chevronDown" size={14} color={c.textDim} />
        </View>
      </View>

      <View style={s.ratesRow}>
        <View style={s.rateCell}>
          <Text style={s.rateLabel}>BCV</Text>
          <Text style={s.rateValue}>{formatBsAmount(snapshot.bcvUsd)}</Text>
        </View>
        <View style={s.rateCell}>
          <Text style={s.rateLabel}>Euro</Text>
          <Text style={s.rateValue}>{formatBsAmount(snapshot.bcvEur)}</Text>
        </View>
        <View style={s.rateCell}>
          <Text style={s.rateLabel}>Binance</Text>
          <Text style={s.rateValue}>{formatBsAmount(snapshot.binance)}</Text>
        </View>
      </View>

      <View style={s.footer}>
        <View style={s.bestTag}>
          <Text style={s.bestTagText}>
            MEJOR · {bestLabel} {formatBsAmount(best.rate)}
          </Text>
        </View>
        {applied && (
          <View style={s.appliedBadge}>
            <Icon name="checkmark" size={11} color="#fff" />
            <Text style={s.appliedText}>ACTIVA</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardApplied: {
      borderColor: c.accent,
      borderWidth: 2,
      backgroundColor: c.cardBest,
    },
    cardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    calendarTile: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: c.cardInner,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    calendarTileActive: {
      backgroundColor: c.accentSoft,
      borderColor: c.accentBorder,
    },
    calendarMonth: {
      fontSize: 9,
      fontWeight: 'bold',
      color: c.textDim,
      letterSpacing: 1,
    },
    calendarDay: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.text,
      lineHeight: 22,
    },
    dateColumn: { flex: 1 },
    dateLabel: {
      fontSize: 17,
      fontWeight: 'bold',
      color: c.text,
    },
    dateSub: {
      fontSize: 12,
      color: c.textDim,
      marginTop: 2,
    },
    chevron: {
      transform: [{ rotate: '-90deg' }],
    },
    ratesRow: {
      flexDirection: 'row',
      backgroundColor: c.cardInner,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    rateCell: {
      flex: 1,
      alignItems: 'center',
    },
    rateLabel: {
      fontSize: 10,
      color: c.textDim,
      marginBottom: 3,
      fontWeight: '600',
    },
    rateValue: {
      fontSize: 15,
      fontWeight: 'bold',
      color: c.text,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    bestTag: {
      backgroundColor: c.accentSoft,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    bestTagText: {
      color: c.accent,
      fontSize: 10,
      fontWeight: 'bold',
    },
    appliedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.accent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    appliedText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
  });
}
