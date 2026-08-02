// Self-check de la lógica pura (máscaras y TTL del historial) sin frameworks.
// Se corre con: npm run check  (node scripts/selfcheck.ts)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBsMask, parseUsdMask, parseCurrencyInput, formatBsAmount, parseRateMask } from '../src/utils/currency.ts';
import {
  upsertSnapshot,
  pruneSnapshots,
  mergeSnapshots,
  daysAgoKey,
  todayKey,
  buildHistoryResponse,
  dateKey,
  type RateSnapshot,
} from '../src/utils/ratesLogic.ts';
import { hexToRgba, mixHex, buildPalette, ACCENT_PRESETS, DEFAULT_ACCENT } from '../src/theme.ts';

const snap = (date: string): RateSnapshot => ({ date, bcvUsd: 700, bcvEur: 36.5, binance: 750 });

test('parseBsMask: máscara bancaria de derecha a izquierda', () => {
  assert.deepEqual(parseBsMask('1'), { display: '0,01', value: 0.01 });
  assert.deepEqual(parseBsMask('3500'), { display: '35,00', value: 35 });
  assert.deepEqual(parseBsMask('100000'), { display: '1.000,00', value: 1000 });
  assert.deepEqual(parseBsMask('1234567'), { display: '12.345,67', value: 12345.67 });
  assert.deepEqual(parseBsMask(''), { display: '', value: 0 });
  // Solo dígitos; las letras se ignoran
  assert.deepEqual(parseBsMask('ab12cd'), { display: '0,12', value: 0.12 });
});

test('parseBsMask: límite de 11 dígitos (999.999.999,99)', () => {
  const { display, value } = parseBsMask('99999999999123'); // 15 dígitos → se recorta a 11
  assert.equal(display, '999.999.999,99');
  assert.equal(value, 999999999.99);
});

test('parseUsdMask: dígitos y un punto decimal', () => {
  assert.deepEqual(parseUsdMask('5'), { display: '5', value: 5 });
  assert.deepEqual(parseUsdMask('5.5'), { display: '5.5', value: 5.5 });
  assert.deepEqual(parseUsdMask('100.999'), { display: '100.99', value: 100.99 });
  // Un solo punto; los repetidos se limpian
  assert.deepEqual(parseUsdMask('1.2.3'), { display: '1.23', value: 1.23 });
  assert.deepEqual(parseUsdMask(''), { display: '', value: 0 });
});

test('parseRateMask: la tasa no fuerza céntimos', () => {
  assert.deepEqual(parseRateMask('800'), { display: '800', value: 800 });
  assert.deepEqual(parseRateMask('7485'), { display: '7.485', value: 7485 });
  assert.deepEqual(parseRateMask('748,5'), { display: '748,5', value: 748.5 });
  assert.deepEqual(parseRateMask('1.234,56'), { display: '1.234,56', value: 1234.56 });
  assert.deepEqual(parseRateMask('849,58'), { display: '849,58', value: 849.58 });
  assert.deepEqual(parseRateMask(''), { display: '', value: 0 });
});

test('parseCurrencyInput: tolera formatos mixtos', () => {
  assert.equal(parseCurrencyInput('1.234,56'), 1234.56);
  assert.equal(parseCurrencyInput('1234.56'), 1234.56);
  assert.equal(parseCurrencyInput('1,000'), 1000);
  assert.equal(parseCurrencyInput('0,01'), 0.01);
  assert.equal(parseCurrencyInput(''), 0);
});

test('formatBsAmount: formato es-VE determinista', () => {
  assert.equal(formatBsAmount(1234567.89), '1.234.567,89');
  assert.equal(formatBsAmount(700), '700,00');
  assert.equal(formatBsAmount(0.1), '0,10');
  assert.equal(formatBsAmount(750.5), '750,50');
});

test('upsertSnapshot: mismo día se reemplaza y queda ordenado', () => {
  const list = [snap(daysAgoKey(1)), snap(daysAgoKey(0))];
  const next = upsertSnapshot(list, { ...snap(daysAgoKey(1)), bcvUsd: 800 });
  assert.equal(next.length, 2);
  assert.equal(next.find((s) => s.date === daysAgoKey(1))?.bcvUsd, 800);
  assert.ok(next[0].date < next[1].date, 'orden ASC por fecha');
});

test('pruneSnapshots: TTL de 7 días (incluye hoy)', () => {
  const old = daysAgoKey(10);
  const cutoff = daysAgoKey(6);
  const list = [snap(old), snap(cutoff), snap(daysAgoKey(0))];
  const pruned = pruneSnapshots(list);
  assert.equal(pruned.length, 2);
  assert.ok(!pruned.some((s) => s.date === old), 'los snapshots viejos se borran');
  assert.ok(pruned.some((s) => s.date === cutoff), 'el borde del TTL se conserva');
});

test('mergeSnapshots: base gana y se poda al TTL', () => {
  const base = [snap(daysAgoKey(1))];
  const extra = [snap(daysAgoKey(1)), snap(daysAgoKey(0)), snap(daysAgoKey(9))];
  const merged = mergeSnapshots(base, extra);
  assert.deepEqual(merged.map((s) => s.date), [daysAgoKey(1), daysAgoKey(0)]);
  assert.equal(merged.length, 2);
});

test('buildHistoryResponse: el timestamp no rompe el día al re-parsear en hora local', () => {
  // Bug real: con 'T00:00:00.000Z', en tz negativa el día retrocedía
  // (Hoy se mostraba como Ayer) y el chart nunca alcanzaba 2 puntos.
  const input = [snap(todayKey())];
  const res = buildHistoryResponse(input, 7);
  const roundTrip = dateKey(new Date(res.data[0].timestamp));
  assert.equal(roundTrip, todayKey(), 'Hoy debe seguir siendo Hoy tras el round-trip');
  assert.equal(res.data[0].bcvUsd, 700);
});

test('hexToRgba: hex -> rgba()', () => {
  assert.equal(hexToRgba('#10B981', 0.5), 'rgba(16, 185, 129, 0.5)');
  assert.equal(hexToRgba('F0B90B', 1), 'rgba(240, 185, 11, 1)');
  assert.equal(hexToRgba('#000000', 0.15), 'rgba(0, 0, 0, 0.15)');
  // Entrada inválida se devuelve tal cual (fallback seguro)
  assert.equal(hexToRgba('#123', 0.5), '#123');
});

test('mixHex: t=0 es a puro, t=1 es b puro', () => {
  assert.equal(mixHex('#10B981', '#0F172A', 0), '#10B981');
  assert.equal(mixHex('#10B981', '#0F172A', 1), '#0F172A');
  assert.equal(mixHex('#000000', '#FFFFFF', 0.5), '#808080');
  assert.equal(mixHex('#FF0000', '#0000FF', 0.5), '#800080');
});

test('buildPalette: deriva acentos y cardBest desde el acento', () => {
  const p = buildPalette('dark', '#3B82F6');
  assert.equal(p.scheme, 'dark');
  assert.equal(p.accent, '#3B82F6');
  assert.equal(p.accentSoft, 'rgba(59, 130, 246, 0.15)');
  assert.equal(p.accentBorder, 'rgba(59, 130, 246, 0.3)');
  assert.ok(p.cardBest.startsWith('#') && p.cardBest.length === 7, 'cardBest es un hex');
  assert.notEqual(p.cardBest, p.bg, 'cardBest lleva tinte del acento');
  // Los neutros del esquema no cambian
  assert.equal(p.bg, '#0F172A');
  assert.equal(p.text, '#F8FAFC');
});

test('buildPalette: paleta light con acentos y texto legible', () => {
  const p = buildPalette('light', '#8B5CF6');
  assert.equal(p.scheme, 'light');
  assert.equal(p.bg, '#FFFFFF');
  assert.equal(p.text, '#0F172A');
  assert.equal(p.accentSoft, 'rgba(139, 92, 246, 0.12)');
  const dark = buildPalette('dark', '#8B5CF6');
  assert.notEqual(p.cardBest, dark.cardBest, 'cardBest difiere por esquema');
  assert.ok(p.cardBest.length === 7, 'cardBest light es un hex claro');
});

test('ACCENT_PRESETS: contiene el acento por defecto', () => {
  assert.ok((ACCENT_PRESETS as readonly string[]).includes(DEFAULT_ACCENT));
});
