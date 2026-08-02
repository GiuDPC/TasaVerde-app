// Gestor de conectividad: muestra un banner persistente mientras no hay
// internet y, al reconectar, re-fetcha tasas/historial y avisa con un toast.
// Las tasas se siguen usando desde la caché local (offline-first).

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, spacing } from '../theme';
import { useThemeColors } from '../state/ThemeContext';
import { Icon } from './Icon';
import { showToast } from './Toast';

export function OfflineManager() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [offline, setOffline] = useState(false);
  const wasOnline = useRef<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      // null (desconocido) se trata como online para evitar parpadeos al arrancar.
      const isOnline = state.isInternetReachable !== false;
      setOffline(!isOnline);
      if (wasOnline.current === false && isOnline) {
        showToast('Conectado · Tasas actualizadas', 'wifi');
        void queryClient.invalidateQueries();
      }
      wasOnline.current = isOnline;
    });
    return unsub;
  }, [queryClient]);

  if (!offline) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + 6 }]} pointerEvents="none">
      <View style={styles.banner}>
        <Icon name="cloudOffline" size={15} color="#FBBF24" />
        <Text style={styles.text}>Sin conexión · Mostrando la última tasa guardada</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 90,
    paddingHorizontal: spacing.screen,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
  },
});
