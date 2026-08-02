// Tema de la app: scheme (dark/light) + acento de paleta fija, persistidos.
// También maneja el estado de la hoja de configuración y la transición
// circular estilo Telegram (el overlay lo dibuja ThemeTransition).

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ACCENT_PRESETS,
  buildPalette,
  colors,
  DEFAULT_ACCENT,
  Palette,
  ThemeScheme,
} from '../theme';

const STORAGE_KEY = '@v_rate_theme';

interface PendingTransition {
  scheme: ThemeScheme;
  accent: string;
  origin: { x: number; y: number };
  id: number;
}

interface ThemeContextValue {
  scheme: ThemeScheme;
  accent: string;
  palette: Palette;
  ready: boolean;
  pending: PendingTransition | null;
  toggleScheme: (origin?: { x: number; y: number }) => void;
  setAccent: (accent: string) => void;
  resetTheme: () => void;
  finishTransition: () => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function loadTheme(): Promise<{ scheme: ThemeScheme; accent: string }> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { scheme: 'dark', accent: DEFAULT_ACCENT };
    const parsed = JSON.parse(raw);
    const scheme = parsed.scheme === 'light' ? 'light' : 'dark';
    const accent = ACCENT_PRESETS.includes(parsed.accent) ? parsed.accent : DEFAULT_ACCENT;
    return { scheme, accent };
  } catch {
    return { scheme: 'dark', accent: DEFAULT_ACCENT };
  }
}

async function persistTheme(scheme: ThemeScheme, accent: string) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ scheme, accent }));
  } catch {
    // Storage no disponible (web con privacidad estricta); no es crítico.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState<ThemeScheme>('dark');
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<PendingTransition | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTheme().then((t) => {
      if (cancelled) return;
      setScheme(t.scheme);
      setAccentState(t.accent);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const palette = useMemo(() => buildPalette(scheme, accent), [scheme, accent]);

  const toggleScheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const targetScheme = scheme === 'dark' ? 'light' : 'dark';
      const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 160;
      const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
      // Aplica YA (optimista) para que el tema nunca quede a medias si la
      // animación de transición no llega a completarse en el dispositivo.
      setScheme(targetScheme);
      void persistTheme(targetScheme, accent);
      setPending({
        scheme: targetScheme,
        accent,
        origin: origin ?? { x: cx, y: cy },
        id: Date.now(),
      });
    },
    [scheme, accent]
  );

  const setAccent = useCallback(
    (a: string) => {
      setAccentState(a);
      void persistTheme(scheme, a);
    },
    [scheme]
  );

  const resetTheme = useCallback(() => {
    setAccentState(DEFAULT_ACCENT);
    setScheme('dark');
    void persistTheme('dark', DEFAULT_ACCENT);
  }, []);

  const finishTransition = useCallback(() => {
    setPending(null);
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const value = useMemo(
    () => ({
      scheme,
      accent,
      palette,
      ready,
      pending,
      toggleScheme,
      setAccent,
      resetTheme,
      finishTransition,
      settingsOpen,
      openSettings,
      closeSettings,
    }),
    [scheme, accent, palette, ready, pending, toggleScheme, setAccent, resetTheme, finishTransition, settingsOpen, openSettings, closeSettings]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors(): Palette {
  const ctx = useContext(ThemeContext);
  return ctx?.palette ?? colors;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback defensivo: sin provider se usa el dark por defecto.
    return {
      scheme: 'dark',
      accent: DEFAULT_ACCENT,
      palette: colors,
      ready: true,
      pending: null,
      toggleScheme: () => {},
      setAccent: () => {},
      resetTheme: () => {},
      finishTransition: () => {},
      settingsOpen: false,
      openSettings: () => {},
      closeSettings: () => {},
    };
  }
  return ctx;
}
