// Calculadora de pago mixto: cuánto resta pagar en Bs cuando pagás parte en USD.

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticImpact, hapticSelection, hapticSuccess } from '../../utils/haptics';
import { useRates } from '../../hooks/useRates';
import { useActiveRate } from '../../state/ActiveRateContext';
import { CurrencyInput } from '../CurrencyInput';
import { Icon } from '../Icon';
import { radii, Palette } from '../../theme';
import { useThemeColors } from '../../state/ThemeContext';
import { formatBsAmount, parseUsdMask } from '../../utils/currency';

export function MixedPaymentPanel() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const { data: rates } = useRates();
  const { effectiveRate, config } = useActiveRate();
  const [total, setTotal] = useState({ display: '', value: 0 });
  const [cash, setCash] = useState({ display: '', value: 0 });

  const rate = effectiveRate(rates);
  const remainingUsd = total.value - cash.value;
  const hasResult = remainingUsd > 0;
  const remainingBs = hasResult ? remainingUsd * rate : 0;

  const presets = ['5', '10', '20', '50'];

  return (
    <View>
      <View style={s.inputGroup}>
        <Text style={s.label}>TOTAL A PAGAR ($)</Text>
        <CurrencyInput
          currency="USD"
          value={total.display}
          onChange={(d, v) => setTotal({ display: d, value: v })}
        />
      </View>

      <View style={s.inputGroup}>
        <View style={s.labelRow}>
          <Text style={s.label}>EFECTIVO ENTREGADO ($)</Text>
          <View style={s.presets}>
            {presets.map((val) => (
              <TouchableOpacity
                key={val}
                style={s.presetButton}
                onPress={() => {
                  hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                  const { display, value } = parseUsdMask(val);
                  setCash({ display, value });
                }}
              >
                <Text style={s.presetText}>${val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <CurrencyInput
          currency="USD"
          value={cash.display}
          onChange={(d, v) => setCash({ display: d, value: v })}
        />
      </View>

      <View style={s.resultCard}>
        <View style={s.resultHeader}>
          <Text style={s.resultTitle}>RESTANTE EN BOLÍVARES</Text>
          <View style={s.resultIcon}>
            <Icon name="wallet" size={18} color={c.accent} />
          </View>
        </View>

        {!hasResult && total.value > 0 ? (
          <Text style={s.noResult}>
            El efectivo entregado cubre el total (o sobra). Sin restante.
          </Text>
        ) : (
          <View style={s.amountContainer}>
            <Text style={s.amountBs} numberOfLines={1} adjustsFontSizeToFit>
              {formatBsAmount(remainingBs)}
            </Text>
            <Text style={s.currencyBs}>Bs</Text>
          </View>
        )}

        {hasResult && (
          <>
            <View style={s.divider} />
            <View style={s.detailsRow}>
              <View>
                <Text style={s.detailLabel}>DIFERENCIA USD</Text>
                <Text style={s.detailValue}>$ {remainingUsd.toFixed(2)}</Text>
              </View>
              <View style={s.detailRight}>
                <Text style={s.detailLabel}>TASA ({config.label})</Text>
                <Text style={s.detailValueRate}>{formatBsAmount(rate)} Bs/$</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={s.resetButton}
        activeOpacity={0.7}
        onPress={() => {
          setTotal({ display: '', value: 0 });
          setCash({ display: '', value: 0 });
        }}
      >
        <Icon name="restore" size={16} color={c.textMuted} />
        <Text style={s.resetText}>Reiniciar</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 11, color: c.textDim, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 10 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    presets: { flexDirection: 'row', marginBottom: 10 },
    presetButton: {
      backgroundColor: c.card,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      marginLeft: 6,
    },
    presetText: { color: c.textMuted, fontSize: 12, fontWeight: 'bold' },
    resultCard: {
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
      marginTop: 4,
    },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    resultTitle: { fontSize: 11, color: c.textDim, fontWeight: 'bold', letterSpacing: 0.5 },
    resultIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noResult: { color: c.red, fontSize: 14, textAlign: 'center', paddingVertical: 12 },
    amountContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
    amountBs: { fontSize: 38, fontWeight: 'bold', color: c.accent, flexShrink: 1 },
    currencyBs: { fontSize: 18, color: c.textDim, fontWeight: 'bold', marginLeft: 8 },
    divider: { height: 1, backgroundColor: c.border, marginBottom: 16 },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    detailRight: { alignItems: 'flex-end' },
    detailLabel: { fontSize: 10, color: c.textMuted, marginBottom: 4, fontWeight: 'bold' },
    detailValue: { fontSize: 16, color: c.text, fontWeight: 'bold' },
    detailValueRate: { fontSize: 16, color: c.accent, fontWeight: 'bold' },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 18,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    resetText: { color: c.textMuted, fontSize: 14, fontWeight: '600' },
  });
}
