// Estado global de la "tasa activa": la tasa con la que se calcula en la app.
// Puede ser la tasa en vivo (default), una tasa histórica (elegida desde el
// historial) o una personalizada. Persiste en AsyncStorage.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredActiveRate, saveActiveRate } from '../services/ratesStore';
import { ActiveRateConfig } from '../services/ratesStore';
import { Rates } from '../services/api';
import { shortDate } from '../utils/ratesLogic';

export type { ActiveRateConfig, ActiveRateMode } from '../services/ratesStore';

export const LIVE_ACTIVE_RATE: ActiveRateConfig = { mode: 'live', label: 'En vivo' };

interface ActiveRateContextValue {
  config: ActiveRateConfig;
  isOverride: boolean;
  // Resuelve el número efectivo según la tasa en vivo actual.
  effectiveRate: (live: Rates | undefined) => number;
  applyHistory: (date: string, value: number) => void;
  applyCustom: (value: number, label?: string) => void;
  revert: () => void;
}

const ActiveRateContext = createContext<ActiveRateContextValue | null>(null);

// La tasa en vivo "default" es la mejor opción del día (BCV o Binance).
export function liveBestRate(live: Rates | undefined): number {
  if (!live) return 0;
  return live.bestOption === 'bcv' ? live.bcv.usd : live.binance;
}

export function ActiveRateProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ActiveRateConfig>(LIVE_ACTIVE_RATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getStoredActiveRate()
      .then((stored) => {
        if (stored) setConfig(stored);
      })
      .finally(() => setHydrated(true));
  }, []);

  const persist = (next: ActiveRateConfig) => {
    setConfig(next);
    void saveActiveRate(next);
  };

  const value = useMemo<ActiveRateContextValue>(
    () => ({
      config,
      isOverride: config.mode !== 'live',
      effectiveRate: (live) =>
        config.mode === 'live' ? liveBestRate(live) : config.value ?? 0,
      applyHistory: (date, val) =>
        persist({ mode: 'history', label: shortDate(date), value: val, date }),
      applyCustom: (val, label = 'Personalizada') =>
        persist({ mode: 'custom', label, value: val }),
      revert: () => persist(LIVE_ACTIVE_RATE),
    }),
    [config]
  );

  return <ActiveRateContext.Provider value={value}>{children}</ActiveRateContext.Provider>;
}

export function useActiveRate(): ActiveRateContextValue {
  const ctx = useContext(ActiveRateContext);
  if (!ctx) throw new Error('useActiveRate debe usarse dentro de ActiveRateProvider');
  return ctx;
}
