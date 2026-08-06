// Lógica pura de snapshots de tasas (sin AsyncStorage para poder testearla en Node).
// El historial vive LOCAL en el teléfono
// los últimos HISTORY_RETENTION_DAYS días (incluido hoy).

import type { HistoryEntry, HistoryResponse, Trend } from '../services/api';

export interface RateSnapshot {
  date: string; // 'YYYY-MM-DD' (fecha local)
  bcvUsd: number;
  bcvEur: number;
  binance: number;
}

// ponytail: 7 días cubre "ayer y antier" + una semana de contexto. Ajustable en una línea.
export const HISTORY_RETENTION_DAYS = 7;

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysAgoKey(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return dateKey(d);
}

export function shortDate(date: string): string {
  const [, m, d] = date.split('-');
  return `${d}/${m}`;
}

export function dayRelativeLabel(date: string, from: Date = new Date()): string {
  if (date === todayKey(from)) return 'Hoy';
  if (date === daysAgoKey(1, from)) return 'Ayer';
  return shortDate(date);
}

export function todayKey(from: Date = new Date()): string {
  return dateKey(from);
}

// Upsert por día + purga por TTL. Recibe y devuelve lista ordenada ASC por fecha.
export function upsertSnapshot(list: RateSnapshot[], snap: RateSnapshot): RateSnapshot[] {
  const withoutDay = list.filter((s) => s.date !== snap.date);
  const next = [...withoutDay, snap].sort((a, b) => (a.date < b.date ? -1 : 1));
  return pruneSnapshots(next);
}

export function pruneSnapshots(list: RateSnapshot[], retentionDays: number = HISTORY_RETENTION_DAYS): RateSnapshot[] {
  const cutoff = daysAgoKey(retentionDays - 1);
  return list.filter((s) => s.date >= cutoff);
}

export function serverEntriesToSnapshots(entries: HistoryEntry[]): RateSnapshot[] {
  return entries
    .map((e) => {
      const d = new Date(e.timestamp);
      if (isNaN(d.getTime())) return null;
      return {
        date: dateKey(d),
        bcvUsd: e.bcvUsd,
        bcvEur: e.bcvEur,
        binance: e.binance,
      } as RateSnapshot;
    })
    .filter((s): s is RateSnapshot => s !== null);
}

export function mergeSnapshots(base: RateSnapshot[], extra: RateSnapshot[]): RateSnapshot[] {
  const byDate = new Map<string, RateSnapshot>();
  for (const s of [...extra, ...base]) byDate.set(s.date, s); // base gana (último en set)
  return pruneSnapshots([...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1)));
}

export function filterSnapshots(list: RateSnapshot[], days: number): RateSnapshot[] {
  if (!days || days <= 0) return list;
  const cutoff = daysAgoKey(days - 1);
  return list.filter((s) => s.date >= cutoff);
}

export function computeTrend(snapshots: RateSnapshot[]): Trend {
  if (snapshots.length === 0) {
    return { direction: 'stable', changePercent: 0, minBcv: 0, maxBcv: 0, avgBcv: 0, firstValue: 0, lastValue: 0, dataPoints: 0 };
  }
  const values = snapshots.map((s) => s.bcvUsd);
  const minBcv = Math.min(...values);
  const maxBcv = Math.max(...values);
  const avgBcv = values.reduce((a, b) => a + b, 0) / values.length;
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const changePercent = firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;
  const direction: Trend['direction'] =
    changePercent > 0.001 ? 'up' : changePercent < -0.001 ? 'down' : 'stable';
  return { direction, changePercent, minBcv, maxBcv, avgBcv, firstValue, lastValue, dataPoints: values.length };
}

export function buildHistoryResponse(snapshots: RateSnapshot[], days: number): HistoryResponse {
  const periodSnaps = filterSnapshots(snapshots, days);
  return {
    period: days,
    trend: computeTrend(periodSnaps),
    data: periodSnaps.map((s) => ({
      // Sin 'Z': si se emite medianoche UTC, al re-parsear con hora local el día
      // retrocede (tz -04 → 'Hoy' se ve como 'Ayer'). Parseo local = fecha intacta.
      timestamp: `${s.date}T00:00:00`,
      bcvUsd: s.bcvUsd,
      bcvEur: s.bcvEur,
      binance: s.binance,
    })),
  };
}

export function bestRateOf(snap: RateSnapshot): { rate: number; source: string } {
  return snap.binance > snap.bcvUsd
    ? { rate: snap.binance, source: 'binance' }
    : { rate: snap.bcvUsd, source: 'bcv' };
}
