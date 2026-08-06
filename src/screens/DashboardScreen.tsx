import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticImpact, hapticSelection, hapticSuccess } from '../utils/haptics';
import { useRates } from '../hooks/useRates';
import { FadeInView, PulsingBadge } from '../components/AnimatedComponents';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Icon } from '../components/Icon';
import { TasaVerdeLogo } from '../components/TasaVerdeLogo';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { useThemeColors, useTheme } from '../state/ThemeContext';
import { Palette, spacing, radii } from '../theme';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export function DashboardScreen() {
  const { data: rates, isLoading, refetch, isRefetching } = useRates();
  const c = useThemeColors();
  const { openSettings } = useTheme();
  const s = useMemo(() => createStyles(c), [c]);

  const offline = rates?.source === 'cache';

  const diferencia = useMemo(() => {
    if (!rates) return '0.0';
    return ((rates.binance - rates.bcv.usd) / rates.bcv.usd * 100).toFixed(1);
  }, [rates]);

  const handleRefresh = useCallback(() => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  }, [refetch]);

  const handleRetry = useCallback(() => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    refetch();
  }, [refetch]);

  if (isLoading) return <DashboardSkeleton />;

  if (!rates) {
    return (
      <View style={s.errorContainer}>
        <Icon name="alertCircle" size={64} color={c.red} />
        <Text style={s.errorText}>Error al cargar las tasas</Text>
        <Text style={s.errorSub}>Sin conexión y sin datos guardados</Text>
        <TouchableOpacity style={s.retryButton} onPress={handleRetry}>
          <Icon name="restore" size={18} color="#FFFFFF" />
          <Text style={s.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lastUpdated = offline
    ? timeAgo(rates.fetchedAt)
    : new Date(rates.lastUpdated).toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
      });

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
      <FadeInView delay={0}>
        <View style={s.header}>
          <View style={s.logoContainer}>
            <TasaVerdeLogo width={40} height={40} color={c.accent} />
            <View style={s.logoText}>
              <Text style={s.logo}>TasaVerde</Text>
              <Text style={s.logoSubtitle}>Tasas en tiempo real</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity
              style={s.settingsButton}
              onPress={openSettings}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Configuración"
            >
              <Icon name="ellipsis" size={20} color={c.textMuted} />
            </TouchableOpacity>
            <View style={s.updateInfo}>
              {offline ? (
                <View style={s.offlineBadge}>
                  <View style={s.offlineDot} />
                  <Text style={s.offlineText}>Sin conexión</Text>
                </View>
              ) : (
                <Text style={s.updateLabel}>ACTUALIZADO</Text>
              )}
              <Text style={s.updateTime}>{lastUpdated}</Text>
            </View>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={80}>
        <View style={s.bestOptionBanner}>
          <View style={s.lightIconContainer}>
            <Icon name="light" size={28} color={c.amber} />
          </View>
          <View style={s.bestOptionText}>
            <Text style={s.bestOptionTitle}>
              Mejor opción:{' '}
              <Text style={s.bestOptionHighlight}>
                {rates.bestOption === 'bcv' ? 'BCV' : 'Binance'}
              </Text>
            </Text>
            <Text style={s.bestOptionSubtitle}>
              Diferencia del {diferencia}% entre tasas
            </Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={140}>
        <View style={[s.mainCard, rates.bestOption === 'bcv' && s.mainCardBest]}>
          <View style={s.cardHeader}>
            <View style={s.cardIconContainer}>
              <Icon name="bcv" size={26} color={c.accent} />
            </View>
            <View style={s.cardTitleContainer}>
              <Text style={s.cardTitle}>BCV Dólar</Text>
              <Text style={s.cardSubtitle}>Banco Central de Venezuela</Text>
            </View>
            {rates.bestOption === 'bcv' && <PulsingBadge text="MEJOR" color={c.accent} />}
          </View>
          <View style={s.rateRow}>
            <AnimatedNumber value={rates.bcv.usd} variant="bs" style={s.mainRate} />
            <Text style={s.mainCurrency}>Bs/$</Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <View style={s.cardGrid}>
          <View style={s.secondaryCard}>
            <View style={[s.secondaryIcon, { backgroundColor: c.blueSoft }]}>
              <Icon name="euro" size={24} color={c.blue} />
            </View>
            <Text style={s.secondaryTitle}>BCV Euro</Text>
            <AnimatedNumber value={rates.bcv.eur} variant="bs" style={s.secondaryRate} />
            <Text style={s.secondaryUnit}>Bs/€</Text>
          </View>

          <View style={[s.secondaryCard, rates.bestOption === 'binance' && s.secondaryCardBest]}>
            <View style={[s.secondaryIcon, { backgroundColor: c.binanceSoft }]}>
              <Icon name="binance" size={24} color={c.binance} />
            </View>
            <Text style={s.secondaryTitle}>Binance P2P</Text>
            <AnimatedNumber value={rates.binance} variant="bs" style={s.secondaryRate} />
            <Text style={s.secondaryUnit}>Bs/$</Text>
            {rates.bestOption === 'binance' && (
              <View style={s.secondaryBestBadge}>
                <Text style={s.secondaryBestText}>MEJOR</Text>
              </View>
            )}
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={260}>
        <View style={s.comparisonCard}>
          <View style={s.comparisonHeader}>
            <TasaVerdeLogo width={20} height={20} color={c.accent} />
            <Text style={s.comparisonTitle}>Comparación de Tasas</Text>
          </View>
          <View style={s.comparisonRow}>
            <Text style={s.comparisonLabel}>BCV vs Binance:</Text>
            <View style={s.comparisonValueWrap}>
              <Icon
                name={parseFloat(diferencia) > 0 ? 'tendencia' : 'trendingDown'}
                size={16}
                color={parseFloat(diferencia) > 0 ? c.red : c.accent}
              />
              <Text
                style={[
                  s.comparisonValue,
                  parseFloat(diferencia) > 0 ? s.comparisonUp : s.comparisonDown,
                ]}
              >
                {diferencia}%
              </Text>
            </View>
          </View>
          <Text style={s.comparisonExplain}>
            {parseFloat(diferencia) > 0
              ? `Binance está ${diferencia}% más alto que BCV`
              : `BCV está ${Math.abs(parseFloat(diferencia))}% más alto que Binance`}
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={320}>
        <View style={s.footerContainer}>
          <Icon name="arrowDown" size={16} color={c.textDim} />
          <Text style={s.footer}>Desliza hacia abajo para actualizar</Text>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: { padding: spacing.screen, paddingTop: spacing.screenTop, paddingBottom: spacing.bottom },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.bg,
      padding: 20,
      gap: 10,
    },
    errorText: { color: c.text, fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
    errorSub: { color: c.textMuted, fontSize: 13, marginBottom: 10 },
    retryButton: {
      backgroundColor: c.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    headerRight: { alignItems: 'flex-end', gap: 8 },
    settingsButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.cardInner,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoText: { marginLeft: 12 },
    logo: { fontSize: 24, fontWeight: 'bold', color: c.text },
    logoSubtitle: { fontSize: 12, color: c.textMuted },
    updateInfo: { alignItems: 'flex-end' },
    updateLabel: { fontSize: 10, color: c.textDim, letterSpacing: 0.5 },
    updateTime: { fontSize: 14, fontWeight: 'bold', color: c.text },
    offlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.binanceSoft,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 2,
    },
    offlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.binance,
      marginRight: 5,
    },
    offlineText: { fontSize: 10, fontWeight: 'bold', color: c.binance },
    bestOptionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: radii.card,
      padding: 16,
      marginBottom: 20,
    },
    lightIconContainer: { marginRight: 12 },
    bestOptionText: { flex: 1 },
    bestOptionTitle: { fontSize: 15, color: c.text },
    bestOptionHighlight: { color: c.accent, fontWeight: 'bold' },
    bestOptionSubtitle: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    mainCard: {
      backgroundColor: c.card,
      borderRadius: radii.mainCard,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    mainCardBest: { backgroundColor: c.cardBest, borderColor: c.accent, borderWidth: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    cardIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: c.accentSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardTitleContainer: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
    cardSubtitle: { fontSize: 12, color: c.textDim },
    rateRow: { flexDirection: 'row', alignItems: 'baseline' },
    mainRate: { fontSize: 48, fontWeight: 'bold', color: c.text },
    mainCurrency: { fontSize: 18, color: c.textMuted, marginLeft: 8 },
    cardGrid: { flexDirection: 'row', marginBottom: 16 },
    secondaryCard: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 16,
      marginHorizontal: 6,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    secondaryCardBest: { borderColor: c.accent, borderWidth: 2, backgroundColor: c.cardBest },
    secondaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    secondaryTitle: { fontSize: 12, color: c.textMuted, marginBottom: 8 },
    secondaryRate: { fontSize: 24, fontWeight: 'bold', color: c.text },
    secondaryUnit: { fontSize: 12, color: c.textDim },
    secondaryBestBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: c.accent,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    secondaryBestText: { fontSize: 8, fontWeight: 'bold', color: '#FFFFFF' },
    comparisonCard: {
      backgroundColor: c.card,
      borderRadius: radii.card,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    comparisonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    comparisonTitle: { fontSize: 14, fontWeight: 'bold', color: c.text, marginLeft: 8 },
    comparisonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    comparisonLabel: { fontSize: 14, color: c.textMuted },
    comparisonValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    comparisonValue: { fontSize: 16, fontWeight: 'bold' },
    comparisonUp: { color: c.red },
    comparisonDown: { color: c.accent },
    comparisonExplain: { fontSize: 12, color: c.textDim, fontStyle: 'italic' },
    footerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    footer: { color: c.textDim, fontSize: 12, marginLeft: 8 },
  });
}
