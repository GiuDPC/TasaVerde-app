// Pestaña Historial: evolución del dólar (datos locales, TTL 7 días).
// Las tarjetas de días permiten aplicar una tasa histórica para los cálculos.

import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticImpact, hapticSuccess } from '../utils/haptics';
import { useHistory } from '../hooks/useHistory';
import { useActiveRate } from '../state/ActiveRateContext';
import { Icon } from '../components/Icon';
import { RateDayCard } from '../components/RateDayCard';
import { DayRateModal } from '../components/DayRateModal';
import { CurrencyInput } from '../components/CurrencyInput';
import { RateSnapshot, dateKey } from '../utils/ratesLogic';
import { spacing, radii, Palette } from '../theme';
import { useThemeColors } from '../state/ThemeContext';

type Period = 3 | 7;
const PERIODS: { value: Period; label: string }[] = [
  { value: 3, label: '3D' },
  { value: 7, label: '7D' },
];

export function HistoryScreen() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const [period, setPeriod] = useState<Period>(7);
  const { data, isLoading, isError, refetch, isRefetching } = useHistory(period);
  const { config, isOverride, applyHistory, applyCustom, revert } = useActiveRate();

  const [customRate, setCustomRate] = useState({ display: '', value: 0 });
  const [customError, setCustomError] = useState(false);
  const [selectedDay, setSelectedDay] = useState<RateSnapshot | null>(null);

  const handlePeriodChange = useCallback((newPeriod: Period) => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    setPeriod(newPeriod);
  }, []);

  const handleRefresh = useCallback(() => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    void refetch();
  }, [refetch]);

  const trend = data?.trend;

  // Tarjetas de día: más reciente primero.
  const daySnapshots = useMemo(
    () =>
      data
        ? [...data.data]
            .map((e) => ({
              date: dateKey(new Date(e.timestamp)),
              bcvUsd: e.bcvUsd,
              bcvEur: e.bcvEur,
              binance: e.binance,
            }))
            .reverse()
        : [],
    [data]
  );

  const handleApplyDay = useCallback((snapshot: RateSnapshot) => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDay(snapshot);
  }, []);

  const handleApplySelectedDay = useCallback(
    (rate: number, source: string) => {
      if (!selectedDay) return;
      hapticSuccess();
      applyHistory(selectedDay.date, rate);
    },
    [applyHistory, selectedDay]
  );

  const handleApplyCustom = useCallback(() => {
    if (customRate.value <= 0) {
      setCustomError(true);
      hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
    setCustomError(false);
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    applyCustom(customRate.value);
  }, [customRate.value, applyCustom]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          tintColor={c.accent}
          colors={[c.accent]}
        />
      }
    >
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={s.titleIcon}>
            <Icon name="graphic" size={28} color={c.accent} />
          </View>
          <View>
            <Text style={s.title}>Historial</Text>
            <Text style={s.subtitle}>Evolución del dólar BCV</Text>
          </View>
        </View>
      </View>

      {isOverride && (
        <View style={s.activeBar}>
          <View style={s.activeInfo}>
            <Icon name="tendencia" size={18} color={c.accent} />
            <Text style={s.activeText}>
              Calculando con <Text style={s.activeStrong}>{config.label}</Text> ·{' '}
              {(config.value ?? 0).toFixed(2)} Bs/$
            </Text>
          </View>
          <TouchableOpacity
            style={s.revertButton}
            activeOpacity={0.7}
            onPress={() => {
              hapticImpact(Haptics.ImpactFeedbackStyle.Light);
              revert();
            }}
            accessibilityRole="button"
            accessibilityLabel="Usar la tasa del día de hoy"
          >
            <Icon name="restore" size={14} color={c.accent} />
            <Text style={s.revertText}>Usar tasa de hoy</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.periodContainer}>
        {PERIODS.map(({ value, label }) => {
          const active = period === value;
          return (
            <TouchableOpacity
              key={value}
              style={[s.periodButton, active && s.periodButtonActive]}
              onPress={() => handlePeriodChange(value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.periodText, active && s.periodTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && (
        <View style={s.centerBox}>
          <Text style={s.placeholderText}>Cargando historial…</Text>
        </View>
      )}

      {isError && !isLoading && (
        <View style={s.centerBox}>
          <Text style={s.placeholderText}>No se pudo cargar el historial local</Text>
          <TouchableOpacity style={s.retryButton} onPress={() => refetch()}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {data && !isLoading && (
        <>
          {data.data.length >= 2 && (
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={s.statLabel}>MÍNIMO</Text>
                <Text style={[s.statValue, { color: c.accent }]}>
                  {trend?.minBcv.toFixed(2)}
                </Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statLabel}>MÁXIMO</Text>
                <Text style={[s.statValue, { color: c.red }]}>
                  {trend?.maxBcv.toFixed(2)}
                </Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statLabel}>PROMEDIO</Text>
                <Text style={s.statValue}>{trend?.avgBcv.toFixed(2)}</Text>
              </View>
            </View>
          )}

          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>DÍAS</Text>
            <Text style={s.sectionHint}>Toca un día para usarlo en los cálculos</Text>
          </View>

          {daySnapshots.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>
                Aún no hay historial guardado. La app guarda la tasa de cada día
                automáticamente.
              </Text>
            </View>
          ) : (
            daySnapshots.map((snap) => (
              <RateDayCard
                key={snap.date}
                snapshot={snap}
                applied={config.mode === 'history' && config.date === snap.date}
                onPress={() => handleApplyDay(snap)}
              />
            ))
          )}

          <View style={s.customCard}>
            <Text style={s.sectionTitle}>TASA PERSONALIZADA</Text>
            <Text style={s.customHint}>
              Elegí un valor manual (ej: un pago pactado a otra tasa)
            </Text>
            <CurrencyInput
              currency="RATE"
              value={customRate.display}
              onChange={(d, v) => {
                setCustomError(false);
                setCustomRate({ display: d, value: v });
              }}
            />
            {customError && (
              <Text style={s.customErrorText}>Ingresa una tasa válida</Text>
            )}
            <TouchableOpacity style={s.customButton} onPress={handleApplyCustom}>
              <Text style={s.customButtonText}>Usar esta tasa</Text>
            </TouchableOpacity>
          </View>

          <View style={s.infoContainer}>
            <Icon name="light" size={16} color={c.amber} />
            <Text style={s.infoText}>
              El historial se guarda en el teléfono y se limpia solo después de 7 días
            </Text>
          </View>
        </>
      )}
      <DayRateModal
        snapshot={selectedDay}
        onClose={() => setSelectedDay(null)}
        onApply={handleApplySelectedDay}
      />
    </ScrollView>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: { padding: spacing.screen, paddingTop: spacing.screenTop, paddingBottom: spacing.bottom },
    header: { marginBottom: 18 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    titleIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: c.accentSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    title: { fontSize: 26, fontWeight: 'bold', color: c.text },
    subtitle: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    activeBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.cardBest,
      borderWidth: 1,
      borderColor: c.accentBorder,
      borderRadius: radii.card,
      padding: 12,
      marginBottom: 14,
    },
    activeInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    activeText: { color: c.textMuted, fontSize: 12, marginLeft: 8, flexShrink: 1 },
    activeStrong: { color: c.accent, fontWeight: 'bold' },
    revertButton: {
      backgroundColor: c.accent,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginLeft: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    revertText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    periodContainer: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 999,
      padding: 4,
      marginBottom: 16,
    },
    periodButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 999 },
    periodButtonActive: { backgroundColor: c.accent },
    periodText: { fontSize: 14, fontWeight: 'bold', color: c.textMuted },
    periodTextActive: { color: '#fff' },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    statCard: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    statLabel: { fontSize: 10, color: c.textDim, marginBottom: 4, fontWeight: 'bold' },
    statValue: { fontSize: 16, fontWeight: 'bold', color: c.text },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 10,
    },
    sectionTitle: { fontSize: 12, color: c.textDim, fontWeight: 'bold', letterSpacing: 0.5 },
    sectionHint: { fontSize: 11, color: c.textDim },
    emptyBox: {
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    emptyText: { color: c.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
    customCard: {
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 16,
      marginTop: 14,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    customHint: { color: c.textMuted, fontSize: 12, marginTop: 4, marginBottom: 12 },
    customErrorText: { color: c.red, fontSize: 12, fontWeight: '600', marginTop: 8 },
    customButton: {
      backgroundColor: c.accent,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    customButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    infoContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      paddingHorizontal: 10,
    },
    infoText: { color: c.textDim, fontSize: 12, marginLeft: 8, textAlign: 'center', flexShrink: 1 },
    centerBox: { alignItems: 'center', padding: 30, gap: 14 },
    placeholderText: { color: c.textDim, fontSize: 14, textAlign: 'center' },
    retryButton: {
      backgroundColor: c.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    retryText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  });
}
