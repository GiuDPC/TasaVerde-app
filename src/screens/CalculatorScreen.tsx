// Pestaña Calculadora: segment control entre Conversor / Vuelto / Pago Mixto.
// Todas usan la "tasa activa" (en vivo, histórica o personalizada).

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticImpact, hapticSelection, hapticSuccess } from '../utils/haptics';
import { Icon } from '../components/Icon';
import { ActiveRateBanner } from '../components/ActiveRateBanner';
import { ConversorPanel } from '../components/calculators/ConversorPanel';
import { ChangeCalculatorPanel } from '../components/calculators/ChangeCalculatorPanel';
import { MixedPaymentPanel } from '../components/calculators/MixedPaymentPanel';
import { MathCalculatorPanel } from '../components/calculators/MathCalculatorPanel';
import { FadeInView } from '../components/AnimatedComponents';
import { spacing, radii, Palette } from '../theme';
import { useThemeColors } from '../state/ThemeContext';

type Segment = 'conversor' | 'vuelto' | 'mixto' | 'matematica';

const SEGMENTS: { key: Segment; label: string; icon: 'calculator' | 'dollar' }[] = [
  { key: 'conversor', label: 'Conversor', icon: 'calculator' },
  { key: 'matematica', label: 'Matemática', icon: 'calculator' },
  { key: 'vuelto', label: 'Vuelto', icon: 'dollar' },
  { key: 'mixto', label: 'Pago Mixto', icon: 'dollar' },
];

export function CalculatorScreen() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const [segment, setSegment] = useState<Segment>('conversor');

  const changeSegment = (seg: Segment) => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    setSegment(seg);
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={s.titleIcon}>
            <Icon name="calculator" size={26} color={c.accent} />
          </View>
          <View>
            <Text style={s.title}>Calculadora</Text>
            <Text style={s.subtitle}>Convierte con la tasa que elijas</Text>
          </View>
        </View>
      </View>

      <View style={s.segmentBar} accessibilityRole="tablist">
        {SEGMENTS.map((seg) => {
          const active = segment === seg.key;
          return (
            <TouchableOpacity
              key={seg.key}
              style={[s.segmentButton, active && s.segmentButtonActive]}
              onPress={() => changeSegment(seg.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.segmentText, active && s.segmentTextActive]}>
                {seg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ActiveRateBanner />

      {segment === 'conversor' && (
        <FadeInView key="conversor" delay={40}>
          <ConversorPanel />
        </FadeInView>
      )}
      {segment === 'vuelto' && (
        <FadeInView key="vuelto" delay={40}>
          <ChangeCalculatorPanel />
        </FadeInView>
      )}
      {segment === 'mixto' && (
        <FadeInView key="mixto" delay={40}>
          <MixedPaymentPanel />
        </FadeInView>
      )}
      {segment === 'matematica' && (
        <FadeInView key="matematica" delay={40}>
          <MathCalculatorPanel />
        </FadeInView>
      )}
    </ScrollView>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: { padding: spacing.screen, paddingTop: spacing.screenTop, paddingBottom: spacing.bottom },
    header: { marginBottom: 18 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    titleIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: c.accentSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    title: { fontSize: 26, fontWeight: 'bold', color: c.text },
    subtitle: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    segmentBar: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 999,
      padding: 4,
      marginBottom: 16,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 999,
    },
    segmentButtonActive: { backgroundColor: c.accent },
    segmentText: { fontSize: 13, fontWeight: 'bold', color: c.textMuted },
    segmentTextActive: { color: '#fff' },
  });
}
