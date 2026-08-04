import React, { ComponentProps } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import BcvIcon from '../../assets/icons/Bank-icon-bcv.svg';
import BinanceIcon from '../../assets/icons/Binance-icon.svg';
import EuroIcon from '../../assets/icons/Euro-icon.svg';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const icons = {
  calculator: 'calculator' as IoniconName,
  dollar: 'logo-usd' as IoniconName,
  arrowDown: 'arrow-down' as IoniconName,
  graphic: 'stats-chart' as IoniconName,
  light: 'bulb' as IoniconName,
  historialMenu: 'time' as IoniconName,
  tendencia: 'trending-up' as IoniconName,
  trendingDown: 'trending-down' as IoniconName,
  copiar: 'copy' as IoniconName,
  ellipsis: 'ellipsis-horizontal' as IoniconName,
  moon: 'moon' as IoniconName,
  sunny: 'sunny' as IoniconName,
  palette: 'color-palette' as IoniconName,
  restore: 'refresh' as IoniconName,
  refresh: 'refresh-circle' as IoniconName,
  alertCircle: 'alert-circle' as IoniconName,
  cash: 'cash' as IoniconName,
  wallet: 'wallet' as IoniconName,
  info: 'information-circle' as IoniconName,
  close: 'close' as IoniconName,
  checkmark: 'checkmark' as IoniconName,
  chevronDown: 'chevron-down' as IoniconName,
  wifi: 'wifi' as IoniconName,
  cloudOffline: 'cloud-offline' as IoniconName,
} as const;

// Logos de marca que se renderizan como SVG propio.
const brandIcons = new Set(['bcv', 'binance', 'euro']);

const brandSvg = {
  bcv: BcvIcon,
  binance: BinanceIcon,
  euro: EuroIcon,
} as const;

export type IconName = keyof typeof icons | keyof typeof brandSvg;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export function Icon({ name, size = 24, color = '#F8FAFC', style }: IconProps) {
  if (name === 'bcv') {
    return <BcvBadge size={size} style={style} />;
  }
  if (name in brandSvg) {
    const SvgIcon = brandSvg[name as keyof typeof brandSvg];
    return (
      <View style={[styles.container, style]}>
        <SvgIcon width={size} height={size} />
      </View>
    );
  }

  const ionName = icons[name as keyof typeof icons];
  if (!ionName) return null;

  return (
    <View style={[styles.container, style]}>
      <Ionicons name={ionName} size={size} color={color} />
    </View>
  );
}

function BcvBadge({ size, style }: { size: number; style?: any }) {
  return (
    <View
      style={[
        styles.container,
        style,
        { width: size, height: size, position: 'relative' },
      ]}
    >
      <BcvIcon width={size} height={size} style={StyleSheet.absoluteFill} />
      <Text
        style={{
          color: '#FFFFFF',
          fontWeight: '800',
          fontSize: size * 0.4,
          letterSpacing: size * 0.012,
        }}
        allowFontScaling={false}
      >
        BCV
      </Text>
    </View>
  );
}

export function AppLogo({ size = 50 }: { size?: number }) {
  return (
    <View style={[styles.logoContainer, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Image
        source={require('../../assets/TasaVerde-Logo.png')}
        style={{ width: size, height: size, borderRadius: size * 0.28 }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  logoContainer: { overflow: 'hidden' },
});
