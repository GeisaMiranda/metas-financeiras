import { StyleSheet, View } from 'react-native';
import { cores, raio } from '../theme';

/** Barra de progresso. `fracao` vai de 0 a 1. */
export function ProgressBar({ fracao, cor = cores.primaria }: { fracao: number; cor?: string }) {
  const largura = `${Math.round(Math.min(1, Math.max(0, fracao)) * 100)}%` as `${number}%`;
  return (
    <View style={styles.fundo} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(fracao * 100) }}>
      <View style={[styles.preenchido, { width: largura, backgroundColor: cor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: { height: 10, borderRadius: raio.pill, backgroundColor: cores.borda, overflow: 'hidden' },
  preenchido: { height: '100%', borderRadius: raio.pill },
});
