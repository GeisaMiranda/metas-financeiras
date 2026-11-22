import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { cores, espaco, raio } from '../theme';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'perigo';
  carregando?: boolean;
  desabilitado?: boolean;
}

export function Button({ titulo, onPress, variante = 'primario', carregando = false, desabilitado = false }: Props) {
  const inativo = desabilitado || carregando;
  const corTexto = variante === 'primario' ? '#FFFFFF' : variante === 'perigo' ? cores.perigo : cores.primaria;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: inativo }}
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        styles.base,
        variante === 'primario' && styles.primario,
        variante === 'secundario' && styles.secundario,
        variante === 'perigo' && styles.perigo,
        inativo && styles.inativo,
        pressed && styles.pressionado,
      ]}
    >
      {carregando ? <ActivityIndicator color={corTexto} /> : <Text style={[styles.texto, { color: corTexto }]}>{titulo}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: raio.md,
    paddingHorizontal: espaco.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: { backgroundColor: cores.primaria },
  secundario: { backgroundColor: cores.superficie, borderWidth: 1.5, borderColor: cores.primaria },
  perigo: { backgroundColor: cores.superficie, borderWidth: 1.5, borderColor: cores.perigo },
  inativo: { opacity: 0.5 },
  pressionado: { opacity: 0.8 },
  texto: { fontSize: 16, fontWeight: '600' },
});
