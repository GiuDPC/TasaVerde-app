// Animated counter — pure JS animation. No Reanimated worklets (regex in
// worklets crashes on certain chipsets like MediaTek). Uses requestAnimationFrame
// for a smooth counting effect, falls back to static display if anything fails.

import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

type Variant = 'bs' | 'usd' | 'plain';

interface AnimatedNumberProps {
  value: number;
  variant?: Variant;
  decimals?: number;
  style?: StyleProp<TextStyle>;
}

function formatNumber(n: number, variant: Variant, decimals: number): string {
  try {
    if (variant === 'bs') {
      const sign = n < 0 ? '-' : '';
      const abs = Math.abs(n);
      const rounded = Math.round(abs * 100) / 100;
      const intPart = Math.floor(rounded).toString();
      const cents = String(Math.round((rounded - Math.floor(rounded)) * 100)).padStart(2, '0');
      // Manual thousands grouping (no regex — safer on all devices)
      let grouped = '';
      for (let i = intPart.length - 1, count = 0; i >= 0; i--, count++) {
        if (count > 0 && count % 3 === 0) grouped = '.' + grouped;
        grouped = intPart[i] + grouped;
      }
      return `${sign}${grouped},${cents}`;
    }
    return n.toFixed(decimals);
  } catch {
    // Absolute fallback — never crash for formatting
    return String(Math.round(n * 100) / 100);
  }
}

const ANIMATION_DURATION = 400; // ms

export function AnimatedNumber({ value, variant = 'plain', decimals = 2, style }: AnimatedNumberProps) {
  const [displayText, setDisplayText] = useState(() => formatNumber(value, variant, decimals));
  const prevValue = useRef(value);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    // Skip animation if values are the same or from is 0 (initial load)
    if (from === to || from === 0) {
      setDisplayText(formatNumber(to, variant, decimals));
      return;
    }

    const startTime = Date.now();
    const diff = to - from;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + diff * eased;
      setDisplayText(formatNumber(current, variant, decimals));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [value, variant, decimals]);

  return <Text style={style}>{displayText}</Text>;
}
