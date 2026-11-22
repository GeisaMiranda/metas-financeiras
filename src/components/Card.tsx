import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { cores, espaco, raio } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espaco.lg,
    gap: espaco.sm,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
      default: {},
    }),
  },
});
