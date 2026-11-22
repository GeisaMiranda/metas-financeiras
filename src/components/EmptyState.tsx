import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { cores, espaco, fonte } from '../theme';

interface Props {
  titulo: string;
  texto: string;
  acao?: { titulo: string; onPress: () => void };
}

export function EmptyState({ titulo, texto, acao }: Props) {
  return (
    <View style={styles.caixa}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.texto}>{texto}</Text>
      {acao ? <Button titulo={acao.titulo} onPress={acao.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { alignItems: 'center', gap: espaco.md, paddingVertical: espaco.xxl, paddingHorizontal: espaco.lg },
  titulo: { ...fonte.subtitulo, textAlign: 'center' },
  texto: { ...fonte.corpo, color: cores.textoSuave, textAlign: 'center' },
});
