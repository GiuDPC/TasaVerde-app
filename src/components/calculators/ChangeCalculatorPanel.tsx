// Calculadora de vuelto: cuánto devolver en USD y en Bs (con la tasa activa).

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

export function ChangeCalculatorPanel() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const { data: rates } = useRates();
  const { effectiveRate } = useActiveRate();
  const [price, setPrice] = useState({ display: '', value: 0 });
  const [given, setGiven] = useState({ display: '', value: 0 });

  const rate = effectiveRate(rates);
  const changeUsd = given.value - price.value;
  const hasResult = changeUsd > 0;
  const changeBs = hasResult ? changeUsd * rate : 0;

  const presets = ['10', '20', '50', '100'];

  return (
    <View>
      <View style={s.inputGroup}>
        <Text style={s.label}>PRECIO DEL PRODUCTO ($)</Text>
        <CurrencyInput
          currency="USD"
          value={price.display}
          onChange={(d, v) => setPrice({ display: d, value: v })}
        />
      </View>

      <View style={s.inputGroup}>
        <View style={s.labelRow}>
          <Text style={s.label}>BILLETE RECIBIDO ($)</Text>
          <View style={s.presets}>
            {presets.map((val) => (
              <TouchableOpacity
                key={val}
                style={s.presetButton}
                onPress={() => {
                  hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                  const { display, value } = parseUsdMask(val);
                  setGiven({ display, value });
                }}
              >
                <Text style={s.presetText}>${val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <CurrencyInput
          currency="USD"
          value={given.display}
          onChange={(d, v) => setGiven({ display: d, value: v })}
        />
      </View>

      <View style={s.resultCard}>
        <View style={s.resultHeader}>
          <Text style={s.resultTitle}>VUELTO A ENTREGAR</Text>
          <View style={s.resultIcon}>
            <Icon name="cash" size={18} color={c.accent} />
          </View>
        </View>

        {!hasResult && given.value > 0 ? (
          <Text style={s.noResult}>
            El billete recibido es menor que el precio del producto
          </Text>
        ) : (
          <View style={s.splitResult}>
            <View style={s.splitColumn}>
              <Text style={s.splitLabel}>EN DÓLARES</Text>
              <Text style={s.splitValue}>$ {changeUsd.toFixed(2)}</Text>
            </View>
            <View style={s.verticalDivider} />
            <View style={s.splitColumnRight}>
              <Text style={s.splitLabel}>EN BOLÍVARES</Text>
              <Text style={s.splitValueBs}>Bs {formatBsAmount(changeBs)}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={s.resetButton}
        activeOpacity={0.7}
        onPress={() => {
          setPrice({ display: '', value: 0 });
          setGiven({ display: '', value: 0 });
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
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
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
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    resultTitle: { fontSize: 11, color: c.textDim, fontWeight: 'bold', letterSpacing: 0.5 },
    resultIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noResult: { color: c.red, fontSize: 14, textAlign: 'center', paddingVertical: 10 },
    splitResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    splitColumn: { flex: 1 },
    splitColumnRight: { flex: 1, alignItems: 'flex-end' },
    splitLabel: { fontSize: 10, color: c.textDim, marginBottom: 4, fontWeight: 'bold' },
    splitValue: { fontSize: 22, color: c.text, fontWeight: 'bold' },
    splitValueBs: { fontSize: 22, color: c.accent, fontWeight: 'bold' },
    verticalDivider: { width: 1, height: 40, backgroundColor: c.border, marginHorizontal: 16 },
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
