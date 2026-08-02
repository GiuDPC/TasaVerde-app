import React, { useEffect, useMemo } from 'react';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { CalculatorScreen } from './src/screens/CalculatorScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { FloatingTabBar } from './src/components/FloatingTabBar';
import { SettingsSheet } from './src/components/SettingsSheet';
import { OfflineManager } from './src/components/OfflineManager';
import { ToastHost } from './src/components/Toast';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { getCachedRates } from './src/services/ratesStore';
import { ActiveRateProvider } from './src/state/ActiveRateContext';
import { ThemeProvider, useTheme } from './src/state/ThemeContext';

const Tab = createBottomTabNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, lazy: true }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen name="Tasas" component={DashboardScreen} />
      <Tab.Screen name="Calculadora" component={CalculatorScreen} />
      <Tab.Screen name="Historial" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { palette, scheme } = useTheme();
  const queryClient = useQueryClient();

  // Hidrata la caché de tasas ANTES del primer render del dashboard: muestra
  // la última tasa guardada al instante (offline o con server lento) y luego
  // refresca en segundo plano.
  useEffect(() => {
    let active = true;
    getCachedRates().then((c) => {
      if (!active || !c) return;
      queryClient.setQueryData(['rates'], {
        ...c.rates,
        source: 'cache',
        fetchedAt: c.fetchedAt,
      });
    });
    return () => {
      active = false;
    };
  }, [queryClient]);

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.bg,
        card: palette.card,
        text: palette.text,
        border: palette.border,
        primary: palette.accent,
      },
    };
  }, [scheme, palette]);

  return (
    <>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={palette.bg}
      />
      <NavigationContainer theme={navTheme}>
        <TabNavigator />
      </NavigationContainer>
      <SettingsSheet />
      <OfflineManager />
      <ToastHost />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ActiveRateProvider>
              <AppContent />
            </ActiveRateProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
