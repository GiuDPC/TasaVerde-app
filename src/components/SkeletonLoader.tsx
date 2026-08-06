import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { Palette } from '../theme';
import { useThemeColors } from '../state/ThemeContext';



interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        s.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function MainCardSkeleton() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  return (
    <View style={s.mainCard}>
      <View style={s.cardHeader}>
        <Skeleton width={44} height={44} borderRadius={12} />
        <View style={s.cardTitleContainer}>
          <Skeleton width={100} height={18} style={{ marginBottom: 6 }} />
          <Skeleton width={160} height={12} />
        </View>
      </View>
      <View style={s.rateRow}>
        <Skeleton width={150} height={52} borderRadius={8} />
        <Skeleton width={50} height={20} style={{ marginLeft: 12 }} />
      </View>
    </View>
  );
}

export function SecondaryCardSkeleton() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  return (
    <View style={s.secondaryCard}>
      <Skeleton width={40} height={40} borderRadius={10} style={{ marginBottom: 10 }} />
      <Skeleton width={70} height={12} style={{ marginBottom: 8 }} />
      <Skeleton width={80} height={26} borderRadius={6} />
      <Skeleton width={40} height={12} style={{ marginTop: 4 }} />
    </View>
  );
}

export function BannerSkeleton() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  return (
    <View style={s.banner}>
      <Skeleton width={28} height={28} borderRadius={14} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width={180} height={15} style={{ marginBottom: 6 }} />
        <Skeleton width={140} height={12} />
      </View>
    </View>
  );
}

export function DashboardSkeleton() {
  const c = useThemeColors();
  const s = useMemo(() => createStyles(c), [c]);
  
  const [showSyncMsg, setShowSyncMsg] = React.useState(false);
  const syncOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      setShowSyncMsg(true);
      Animated.timing(syncOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 4000);
    return () => clearTimeout(t);
  }, [syncOpacity]);

  return (
    <View style={s.container}>
      {showSyncMsg && (
        <Animated.View style={[s.syncBanner, { opacity: syncOpacity }]}>
          <Text style={s.syncText}>Conectando con el servidor...</Text>
        </Animated.View>
      )}
      {/* Header Skeleton */}
      <View style={s.header}>
        <View style={s.logoContainer}>
          <Skeleton width={50} height={50} borderRadius={14} style={{ marginRight: 12 }} />
          <View>
            <Skeleton width={80} height={26} style={{ marginBottom: 4 }} />
            <Skeleton width={120} height={12} />
          </View>
        </View>
        <View style={s.updateInfo}>
          <Skeleton width={80} height={10} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={16} />
        </View>
      </View>

      {/* Banner Skeleton */}
      <BannerSkeleton />

      {/* Main Card Skeleton */}
      <MainCardSkeleton />

      {/* Grid Skeleton */}
      <View style={s.cardGrid}>
        <SecondaryCardSkeleton />
        <SecondaryCardSkeleton />
      </View>

      {/* Comparison Card Skeleton */}
      <View style={s.comparisonCard}>
        <View style={s.comparisonHeader}>
          <Skeleton width={20} height={20} borderRadius={10} style={{ marginRight: 8 }} />
          <Skeleton width={140} height={14} />
        </View>
        <Skeleton width="100%" height={40} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      padding: 20,
      paddingTop: 50,
    },
    skeleton: {
      backgroundColor: c.skeleton,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    updateInfo: {
      alignItems: 'flex-end',
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.accentSoft,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    mainCard: {
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitleContainer: {
      flex: 1,
      marginLeft: 12,
    },
    rateRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardGrid: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    secondaryCard: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 6,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    comparisonCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    comparisonHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    syncBanner: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 50,
    },
    syncText: {
      backgroundColor: c.accentSoft,
      color: c.accent,
      borderWidth: 1,
      borderColor: c.accentBorder,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 'bold',
      overflow: 'hidden',
    },
  });
}
