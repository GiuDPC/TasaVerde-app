// Capa de persistencia local (AsyncStorage): caché de tasas, historial con TTL
// y tasa activa. Es la columna vertebral del modo offline-first.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Rates } from './api';
import { RateSnapshot, upsertSnapshot, todayKey } from '../utils/ratesLogic';

export type ActiveRateMode = 'live' | 'history' | 'custom';
export interface ActiveRateConfig {
  mode: ActiveRateMode;
  label: string; // 'En vivo', '30/07', 'BCV', 'Personalizada'
  value?: number; // obligatorio si mode !== 'live'
  date?: string; // fecha 'YYYY-MM-DD' si mode === 'history'
}

const KEYS = {
  ratesCache: '@v_rate_cache',
  history: '@v_rate_history',
  activeRate: '@v_rate_active',
} as const;

interface RatesCache {
  rates: Rates;
  fetchedAt: number;
}

export async function saveRates(rates: Rates): Promise<void> {
  const cache: RatesCache = { rates, fetchedAt: Date.now() };
  await AsyncStorage.setItem(KEYS.ratesCache, JSON.stringify(cache));
  await appendSnapshot({
    date: todayKey(),
    bcvUsd: rates.bcv.usd,
    bcvEur: rates.bcv.eur,
    binance: rates.binance,
  });
}

export async function getCachedRates(): Promise<RatesCache | null> {
  const raw = await AsyncStorage.getItem(KEYS.ratesCache);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RatesCache;
  } catch {
    return null;
  }
}

export async function getSnapshots(): Promise<RateSnapshot[]> {
  const raw = await AsyncStorage.getItem(KEYS.history);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as RateSnapshot[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function appendSnapshot(snap: RateSnapshot): Promise<void> {
  const current = await getSnapshots();
  const next = upsertSnapshot(current, snap);
  await AsyncStorage.setItem(KEYS.history, JSON.stringify(next));
}

export async function saveSnapshots(list: RateSnapshot[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.history, JSON.stringify(list));
}

export async function getStoredActiveRate(): Promise<ActiveRateConfig | null> {
  const raw = await AsyncStorage.getItem(KEYS.activeRate);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveRateConfig;
  } catch {
    return null;
  }
}

export async function saveActiveRate(config: ActiveRateConfig): Promise<void> {
  await AsyncStorage.setItem(KEYS.activeRate, JSON.stringify(config));
}
