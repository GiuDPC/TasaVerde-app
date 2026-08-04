import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticImpact, hapticSuccess } from '../../utils/haptics';
import * as Clipboard from 'expo-clipboard';
import { useRates } from '../../hooks/useRates';
import { useActiveRate } from '../../state/ActiveRateContext';
import { showToast } from '../Toast';
import { radii, Palette } from '../../theme';
import { useThemeColors } from '../../state/ThemeContext';
import { formatBsAmount } from '../../utils/currency';

export function MathCalculatorPanel() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const { data: rates } = useRates();
  const { effectiveRate } = useActiveRate();
  const rate = effectiveRate(rates);

  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const evaluateExpression = (expr: string) => {
    try {
      // Permitimos dígitos, operadores básicos, punto y paréntesis.
      const sanitized = expr.replace(/[^-()\d/*+.]/g, '');
      if (!sanitized) {
        setResult(null);
        return;
      }
      // Evaluamos de forma segura la expresión
      // eslint-disable-next-line no-new-func
      const calcResult = new Function(`return ${sanitized}`)();
      if (typeof calcResult === 'number' && !isNaN(calcResult) && isFinite(calcResult)) {
        setResult(calcResult);
      } else {
        setResult(null);
      }
    } catch (e) {
      // Ignorar errores de sintaxis temporalmente (ej: 2+2+)
    }
  };

  useEffect(() => {
    evaluateExpression(expression);
  }, [expression]);

  const handlePress = (val: string) => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    if (val === 'C') {
      setExpression('');
      setResult(null);
    } else if (val === '⌫') {
      setExpression((prev) => prev.slice(0, -1));
    } else if (val === '=') {
      if (result !== null) {
        // Al darle igual, subimos el resultado como la nueva expresión.
        setExpression(String(result));
      }
    } else {
      setExpression((prev) => prev + val);
    }
  };

  const displayResultUsd = result !== null ? result : 0;
  const displayResultBs = displayResultUsd * rate;

  const handleCopy = async (type: 'usd' | 'bs') => {
    if (displayResultUsd === 0 && expression === '') return;
    const val = type === 'usd' ? `$ ${displayResultUsd.toFixed(2)}` : `Bs. ${formatBsAmount(displayResultBs)}`;
    await Clipboard.setStringAsync(val);
    hapticSuccess();
    showToast('Monto copiado', 'checkmark');
  };

  const buttons = [
    ['C', '⌫', '/', '*'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.', '00'],
  ];

  return (
    <View style={s.container}>
      <View style={s.displayContainer}>
        <Text style={s.expressionText} numberOfLines={1} adjustsFontSizeToFit>
          {expression || '0'}
        </Text>
        <View style={s.resultRow}>
          <TouchableOpacity style={s.copyArea} onPress={() => handleCopy('usd')}>
            <Text style={s.usdResult} numberOfLines={1} adjustsFontSizeToFit>
              $ {displayResultUsd.toFixed(2)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.copyArea} onPress={() => handleCopy('bs')}>
            <Text style={s.bsResult} numberOfLines={1} adjustsFontSizeToFit>
              Bs. {formatBsAmount(displayResultBs)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.keypad}>
        {buttons.map((row, rIndex) => (
          <View key={rIndex} style={s.row}>
            {row.map((btn) => {
              const isOp = ['/', '*', '-', '+'].includes(btn);
              const isEqual = btn === '=';
              const isAction = ['C', '⌫'].includes(btn);
              const isZero = btn === '0';
              
              // El botón '=' se va a expandir hacia abajo en el CSS flex
              if (isEqual) {
                return (
                  <TouchableOpacity
                    key={btn}
                    style={[s.button, s.buttonEqual]}
                    onPress={() => handlePress(btn)}
                  >
                    <Text style={[s.buttonText, s.buttonTextEqual]}>{btn}</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={btn}
                  style={[
                    s.button,
                    isOp && s.buttonOp,
                    isAction && s.buttonAction,
                    isZero && { flex: 2 },
                  ]}
                  onPress={() => handlePress(btn)}
                >
                  <Text
                    style={[
                      s.buttonText,
                      isOp && s.buttonTextOp,
                      isAction && s.buttonTextAction,
                    ]}
                  >
                    {btn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    displayContainer: {
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.accentBorder,
      minHeight: 120,
      justifyContent: 'flex-end',
    },
    expressionText: {
      fontSize: 28,
      color: c.textMuted,
      textAlign: 'right',
      marginBottom: 10,
    },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    copyArea: {
      padding: 4,
    },
    usdResult: {
      fontSize: 22,
      fontWeight: 'bold',
      color: c.text,
    },
    bsResult: {
      fontSize: 26,
      fontWeight: 'bold',
      color: c.accent,
    },
    keypad: {
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    button: {
      flex: 1,
      backgroundColor: c.card,
      height: 64,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    buttonOp: {
      backgroundColor: c.accentSoft,
      borderColor: 'transparent',
    },
    buttonAction: {
      backgroundColor: c.cardInner,
    },
    buttonEqual: {
      backgroundColor: c.accent,
      borderColor: c.accent,
      // Para que el botón de igual se vea bien si queremos que tome 2 filas
      // En este caso lo mantenemos simple de 1 fila de alto, como el layout de array anterior.
    },
    buttonText: {
      fontSize: 26,
      fontWeight: '600',
      color: c.text,
    },
    buttonTextOp: {
      color: c.accent,
      fontSize: 28,
    },
    buttonTextAction: {
      color: c.textMuted,
    },
    buttonTextEqual: {
      color: '#fff',
      fontSize: 32,
    },
  });
}
