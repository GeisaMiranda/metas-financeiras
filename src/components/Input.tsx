import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { cores, espaco, fonte, raio } from '../theme';

interface Props extends TextInputProps {
  rotulo: string;
  erro?: string | null;
}

export function Input({ rotulo, erro, style, ...resto }: Props) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoSuave}
        style={[styles.campo, erro ? styles.campoErro : null, style]}
        {...resto}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: espaco.xs },
  rotulo: { ...fonte.corpo, fontWeight: '600' },
  campo: {
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    backgroundColor: cores.superficie,
    fontSize: 16,
    color: cores.texto,
  },
  campoErro: { borderColor: cores.perigo },
  erro: { color: cores.perigo, fontSize: 13 },
});
