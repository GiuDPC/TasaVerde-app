import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const enabled = Platform.OS !== 'web';

export function hapticImpact(style: Haptics.ImpactFeedbackStyle) {
  if (!enabled) return;
  void Haptics.impactAsync(style).catch(() => {});
}

export function hapticSelection() {
  if (!enabled) return;
  void Haptics.selectionAsync().catch(() => {});
}

export function hapticSuccess() {
  if (!enabled) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
