// Design tokens — única fuente de verdad para colores y medidas.
// Soporta tema oscuro/claro + acento configurable desde una paleta fija
// premium. Todo lo que depende del acento se deriva (nada hardcodeado).

export type ThemeScheme = 'dark' | 'light';

// Paleta fija premium (estilo Banco de Venezuela): 8 acentos curados.
export const ACCENT_PRESETS = ['#10B981', '#14B8A6', '#0EA5E9', '#3B82F6', '#8B5CF6', '#EC4899', '#D946EF', '#F59E0B', '#F43F5E'] as const;
export const DEFAULT_ACCENT = '#10B981';

export interface Palette {
  scheme: ThemeScheme;
  accent: string;
  bg: string;
  card: string;
  cardInner: string;
  cardBest: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textDim: string;
  accentSoft: string;
  accentBorder: string;
  blue: string;
  blueSoft: string;
  binance: string;
  binanceSoft: string;
  red: string;
  redSoft: string;
  redBorder: string;
  amber: string;
  skeleton: string;
}

const NEUTRALS: Record<ThemeScheme, Omit<Palette, 'scheme' | 'accent' | 'accentSoft' | 'accentBorder' | 'cardBest'>> = {
  dark: {
    bg: '#0F172A',
    card: '#1E293B',
    cardInner: '#0F172A',
    border: '#334155',
    borderStrong: '#475569',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textDim: '#64748B',
    blue: '#3B82F6',
    blueSoft: 'rgba(59, 130, 246, 0.2)',
    binance: '#F0B90B',
    binanceSoft: 'rgba(240, 185, 11, 0.2)',
    red: '#EF4444',
    redSoft: 'rgba(239, 68, 68, 0.15)',
    redBorder: 'rgba(239, 68, 68, 0.3)',
    amber: '#F59E0B',
    skeleton: '#334155',
  },
  light: {
    bg: '#FFFFFF',
    card: '#F4F6F8',
    cardInner: '#FFFFFF',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    text: '#0F172A',
    textMuted: '#475569',
    textDim: '#94A3B8',
    blue: '#2563EB',
    blueSoft: 'rgba(37, 99, 235, 0.12)',
    binance: '#B45309',
    binanceSoft: 'rgba(180, 83, 9, 0.12)',
    red: '#DC2626',
    redSoft: 'rgba(220, 38, 38, 0.1)',
    redBorder: 'rgba(220, 38, 38, 0.25)',
    amber: '#D97706',
    skeleton: '#E2E8F0',
  },
};

// Hex (#RRGGBB) -> rgba() string. Acepta hex sin '#'.
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Mezcla dos colores hex: t=0 -> a puro, t=1 -> b puro.
export function mixHex(a: string, b: string, t: number): string {
  const ca = a.replace('#', '');
  const cb = b.replace('#', '');
  if (ca.length !== 6 || cb.length !== 6) return a;
  const mix = (va: number, vb: number) => Math.round(va + (vb - va) * t);
  const r = mix(parseInt(ca.slice(0, 2), 16), parseInt(cb.slice(0, 2), 16));
  const g = mix(parseInt(ca.slice(2, 4), 16), parseInt(cb.slice(2, 4), 16));
  const bl = mix(parseInt(ca.slice(4, 6), 16), parseInt(cb.slice(4, 6), 16));
  const toHex = (v: number) => v.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

export function buildPalette(scheme: ThemeScheme, accent: string): Palette {
  const base = NEUTRALS[scheme];
  const dark = scheme === 'dark';
  return {
    ...base,
    scheme,
    accent,
    accentSoft: hexToRgba(accent, dark ? 0.15 : 0.12),
    accentBorder: hexToRgba(accent, dark ? 0.3 : 0.35),
    cardBest: mixHex(accent, dark ? '#0F172A' : '#FFFFFF', dark ? 0.85 : 0.9),
  };
}

// Paleta oscura por defecto (default previo) — exportada para compat.
export const colors = buildPalette('dark', DEFAULT_ACCENT);

export const spacing = {
  screen: 20,
  screenTop: 50,
  bottom: 120,
};

export const radii = {
  card: 16,
  mainCard: 20,
  pill: 28,
};

export const shadows = {
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  } as const,
};
