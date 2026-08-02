# TasaVerde

App de tasas de cambio en Venezuela: compara BCV vs Binance P2P y te dice la mejor opción. Premium, offline-first, con sensación nativa.

![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

---

## Features

### Dashboard

- Tasas BCV (USD y EUR) y Binance P2P en tiempo real
- Detección automática de la mejor opción + % de diferencia
- Pull-to-refresh y timestamp de última actualización
- Funciona **offline**: muestra la última tasa guardada y avisa "Sin conexión"

### Calculadora

- Conversión bidireccional USD ⇄ Bs
- Formato venezolano (separador de miles, coma decimal)
- Botón copiar para Pago Móvil con toast de confirmación
- Feedback háptico en cada acción

### Historial

- Resumen de mínimo, máximo y promedio por día
- Usa una tasa de un día como tasa activa ("Usar tasa de hoy")

### Personalización

- Tema oscuro/claro con transición circular estilo Telegram
- 8 colores de acento
- Splash screen animado

---

## Tech Stack

| Technology                 | Purpose                              |
| -------------------------- | ------------------------------------ |
| Expo SDK 52 + RN 0.76      | Base framework                       |
| TypeScript                 | Type safety                          |
| React Navigation (tabs)    | Navegación con tab bar flotante      |
| TanStack Query             | Data fetching y caché                |
| AsyncStorage               | Persistencia offline (caché + historial) |
| @react-native-community/netinfo | Detección de conexión            |
| react-native-reanimated    | Animaciones                          |
| expo-haptics / expo-clipboard | Feedback háptico y portapapeles   |

Backend: **kambio-server** (Express, scraping BCV + API Binance P2P) en Render.

---

## Instalación

```bash
npm install
npx expo start          # desarrollo
npx expo start --tunnel # en un teléfono físico vía Expo Go
```

Para probar en el navegador:

```bash
npx expo start --web
```

## Build de APK (EAS)

```bash
npx eas build -p android --profile preview --non-interactive
```

El APK se descarga del link que imprime EAS (~10-15 min). No requiere Android SDK local: se compila en la nube.

## Self-check

```bash
npm run typecheck   # tsc --noEmit
npm run check       # scripts/selfcheck.mts (15 tests)
```

---

## Project Structure

```
TasaVerde/
├── App.tsx                  # Entrada: ErrorBoundary + providers + tabs + splash
├── app.json                 # Config Expo (package com.giudpc.tasaverde)
├── eas.json                 # Perfiles de build (preview/production)
├── scripts/selfcheck.mts    # Autochequeo de la lógica de tasas/theme
│
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx     # Tasas en vivo + offline
│   │   ├── CalculatorScreen.tsx    # Conversor USD/Bs
│   │   └── HistoryScreen.tsx       # Historial diario + stats
│   │
│   ├── components/
│   │   ├── Icon.tsx                # Sistema de iconos SVG + badge BCV
│   │   ├── CurrencyInput.tsx       # Input con máscara de formato
│   │   ├── DayRateModal.tsx        # Detalle de tasa por día
│   │   ├── SettingsSheet.tsx       # Hoja de ajustes (tema/acento)
│   │   ├── Toast.tsx / OfflineManager.tsx / ErrorBoundary.tsx
│   │   ├── SplashScreen.tsx / SkeletonLoader.tsx / AnimatedComponents.tsx
│   │   └── FloatingTabBar.tsx      # Tab bar flotante premium
│   │
│   ├── state/
│   │   ├── ThemeContext.tsx        # Scheme (dark/light) + acento persistidos
│   │   └── ActiveRateContext.tsx   # Tasa activa (viva/histórica/personalizada)
│   │
│   ├── hooks/
│   │   ├── useRates.ts             # Fetch + persistencia en caché
│   │   └── useHistory.ts           # Historial local-first
│   │
│   ├── services/
│   │   ├── api.ts                  # Cliente HTTP (kambio-server)
│   │   └── ratesStore.ts           # Capa AsyncStorage offline-first
│   │
│   └── theme.ts                    # Paleta + acentos
│
└── assets/
```

---

## License

Private project for personal and family use.
