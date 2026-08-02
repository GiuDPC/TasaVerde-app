// Conversor USD ⇄ Bs. Calcula siempre con la "tasa activa".

import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticImpact, hapticSelection, hapticSuccess } from '../../utils/haptics';
import * as Clipboard from 'expo-clipboard';
import { useRates } from '../../hooks/useRates';
import { useActiveRate } from '../../state/ActiveRateContext';
import { CurrencyInput } from '../CurrencyInput';
import { Icon } from '../Icon';
import { showToast } from '../Toast';
import { radii, Palette } from '../../theme';
import { useThemeColors } from '../../state/ThemeContext';
import { formatBsAmount, parseBsMask, parseUsdMask } from '../../utils/currency';

type Mode = 'usdToBs' | 'bsToUsd';

export function ConversorPanel() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const { data: rates } = useRates();
  const { effectiveRate } = useActiveRate();
  const [mode, setMode] = useState<Mode>('usdToBs');
  const [display, setDisplay] = useState('');
  const [numeric, setNumeric] = useState(0);
  const [copied, setCopied] = useState(false);
  const lastCopy = useRef(0);

  const rate = effectiveRate(rates);

  const result = mode === 'usdToBs' ? numeric * rate : rate > 0 ? numeric / rate : 0;
  const resultText =
    mode === 'usdToBs' ? `Bs. ${formatBsAmount(result)}` : `$ ${result.toFixed(2)}`;

  const toggleMode = () => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    setMode(mode === 'usdToBs' ? 'bsToUsd' : 'usdToBs');
    setDisplay('');
    setNumeric(0);
  };

  const handleCopy = async () => {
    // ponytail: guard de 1.5s para que un doble toque no dispare 2 toasts.
    const now = Date.now();
    if (now - lastCopy.current < 1500) return;
    lastCopy.current = now;
    await Clipboard.setStringAsync(resultText);
    hapticSuccess();
    setCopied(true);
    showToast('Monto copiado', 'checkmark');
    setTimeout(() => setCopied(false), 2000);
  };

  const quickAmounts = mode === 'usdToBs' ? ['5', '10', '20', '50', '100'] : ['1000', '5000', '10000', '50000'];

  return (
    <View>
      <TouchableOpacity style={s.modeToggle} onPress={toggleMode} accessibilityRole="button">
        <View style={[s.modeOption, mode === 'usdToBs' && s.modeActive]}>
          <Icon name="dollar" size={18} color={mode === 'usdToBs' ? '#fff' : c.textMuted} />
          <Text style={[s.modeText, mode === 'usdToBs' && s.modeTextActive]}>USD</Text>
        </View>
        <View style={[s.modeOption, mode === 'bsToUsd' && s.modeActive]}>
          <Text style={[s.modeText, mode === 'bsToUsd' && s.modeTextActive]}>Bs</Text>
        </View>
      </TouchableOpacity>

      <Text style={s.inputLabel}>
        {mode === 'usdToBs' ? 'MONTO EN DÓLARES' : 'MONTO EN BOLÍVARES'}
      </Text>
      <CurrencyInput
        currency={mode === 'usdToBs' ? 'USD' : 'BS'}
        value={display}
        onChange={(d, n) => {
          setDisplay(d);
          setNumeric(n);
        }}
      />

      <View style={s.quickRow}>
        {quickAmounts.map((val) => (
          <TouchableOpacity
            key={val}
            style={s.quickButton}
            onPress={() => {
              hapticImpact(Haptics.ImpactFeedbackStyle.Light);
              if (mode === 'usdToBs') {
                const { display, value } = parseUsdMask(val);
                setDisplay(display);
                setNumeric(value);
              } else {
                // Un chip de "N Bs" = dígitos "N" + 2 ceros de céntimos en la máscara.
                const { display, value } = parseBsMask(String(parseInt(val, 10)) + '00');
                setDisplay(display);
                setNumeric(value);
              }
            }}
          >
            <Text style={s.quickButtonText}>
              {mode === 'usdToBs' ? `$${val}` : `${val} Bs`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.resultCard}>
        <View style={s.resultHeader}>
          <Text style={s.resultLabel}>
            {mode === 'usdToBs' ? 'RESULTADO EN BOLÍVARES' : 'RESULTADO EN DÓLARES'}
          </Text>
          <TouchableOpacity
            style={[s.copyButton, copied && s.copyButtonSuccess]}
            onPress={handleCopy}
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Resultado copiado' : 'Copiar resultado'}
            activeOpacity={0.7}
          >
            <Icon name={copied ? 'checkmark' : 'copiar'} size={18} color={copied ? '#fff' : c.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={s.resultValue} numberOfLines={1} adjustsFontSizeToFit>
          {numeric > 0 ? resultText : mode === 'usdToBs' ? 'Bs. 0,00' : '$ 0.00'}
        </Text>
        <Text style={s.rateHint}>Tasa: {formatBsAmount(rate)} Bs/$</Text>
      </View>
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    modeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 30,
      padding: 5,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    modeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 30,
    },
    modeActive: { backgroundColor: c.accent },
    modeText: { fontSize: 15, color: c.textMuted, fontWeight: 'bold' },
    modeTextActive: { color: '#fff' },
    inputLabel: {
      fontSize: 11,
      color: c.textDim,
      fontWeight: 'bold',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 20 },
    quickButton: {
      backgroundColor: c.card,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    quickButtonText: { color: c.textMuted, fontSize: 11, fontWeight: 'bold' },
    resultCard: {
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 16,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    resultLabel: { fontSize: 11, color: c.textDim, fontWeight: 'bold', letterSpacing: 0.5 },
    copyButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.cardInner,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    copyButtonSuccess: { backgroundColor: c.accent, borderColor: c.accent },
    resultValue: { fontSize: 34, fontWeight: 'bold', color: c.accent },
    rateHint: { fontSize: 12, color: c.textDim, marginTop: 6 },
  });
}
