import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { radii, Palette } from '../theme';
import { useThemeColors } from '../state/ThemeContext';
import { parseBsMask, parseUsdMask, parseRateMask } from '../utils/currency';
import { Icon } from './Icon';

type Currency = 'BS' | 'USD' | 'RATE';

interface CurrencyInputProps {
  currency: Currency;
  value: string;
  onChange: (display: string, numeric: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CurrencyInput({ currency, value, onChange, placeholder, autoFocus }: CurrencyInputProps) {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const clearAnim = useRef(new Animated.Value(value.length > 0 ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [focused, focusAnim]);

  useEffect(() => {
    Animated.timing(clearAnim, {
      toValue: value.length > 0 ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [value.length > 0, clearAnim]);

  const containerScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.008],
  });

  const prefixScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const prefix = currency === 'BS' ? 'Bs.' : currency === 'RATE' ? 'Bs./$' : '$';
  const inputPlaceholder =
    placeholder ?? (currency === 'USD' ? '0.00' : '0,00');

  const handleChange = (raw: string) => {
    const mask = currency === 'USD' ? parseUsdMask : parseBsMask;
    const { display, value: num } = mask(raw);
    onChange(display, num);
  };

  return (
    <Animated.View style={[s.container, focused && s.containerFocused, { transform: [{ scale: containerScale }] }]}>
      <Animated.Text
        style={[s.prefix, currency === 'RATE' && s.prefixRate, { transform: [{ scale: prefixScale }] }]}
        numberOfLines={1}
      >
        {prefix}
      </Animated.Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType={currency === 'BS' ? 'number-pad' : 'decimal-pad'}
        placeholder={inputPlaceholder}
        placeholderTextColor={c.textDim}
        maxLength={currency === 'BS' ? 14 : 12}
        autoFocus={autoFocus}
        numberOfLines={1}
        accessibilityLabel={currency === 'RATE' ? 'Tasa personalizada' : `Monto en ${currency}`}
      />
      {value.length > 0 && (
        <Animated.View style={{ opacity: clearAnim, transform: [{ scale: clearAnim }] }}>
          <TouchableOpacity
            style={s.clearButton}
            onPress={() => onChange('', 0)}
            accessibilityRole="button"
            accessibilityLabel="Limpiar monto"
          >
            <Icon name="close" size={13} color={c.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.cardInner,
      borderRadius: radii.card,
      borderWidth: 2,
      borderColor: c.border,
      paddingHorizontal: 16,
      height: 64,
    },
    containerFocused: {
      borderColor: c.accent,
    },
    prefix: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.accent,
      marginRight: 10,
      minWidth: 46,
    },
    prefixRate: {
      fontSize: 16,
    },
    input: {
      flex: 1,
      fontSize: 26,
      fontWeight: 'bold',
      color: c.text,
    },
    clearButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
  });
}
