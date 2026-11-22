import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { cores, espaco, fonte } from '../theme';

/** Mostra "carregando" ou a mensagem de erro (com botão de tentar de novo). */
export function Estado({ carregando, erro, aoTentar }: { carregando: boolean; erro: string | null; aoTentar?: () => void }) {
  if (carregando) {
    return (
      <View style={styles.caixa}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }
  if (erro) {
    return (
      <View style={styles.caixa}>
        <Text style={styles.erro}>{erro}</Text>
        {aoTentar ? <Button titulo="Tentar de novo" variante="secundario" onPress={aoTentar} /> : null}
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  caixa: { alignItems: 'center', gap: espaco.md, paddingVertical: espaco.xxl },
  erro: { ...fonte.corpo, color: cores.perigo, textAlign: 'center' },
});
