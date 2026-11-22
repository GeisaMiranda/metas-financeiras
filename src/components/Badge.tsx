import { StyleSheet, Text, View } from 'react-native';
import { cores, espaco, raio } from '../theme';

type Tom = 'neutro' | 'sucesso' | 'alerta' | 'perigo';
const FUNDO: Record<Tom, string> = {
  neutro: cores.primariaClara,
  sucesso: cores.sucessoClaro,
  alerta: cores.alertaClaro,
  perigo: cores.perigoClaro,
};
const TEXTO: Record<Tom, string> = {
  neutro: cores.primariaEscura,
  sucesso: cores.sucesso,
  alerta: cores.alerta,
  perigo: cores.perigo,
};

export function Badge({ texto, tom = 'neutro' }: { texto: string; tom?: Tom }) {
  return (
    <View style={[styles.badge, { backgroundColor: FUNDO[tom] }]}>
      <Text style={[styles.texto, { color: TEXTO[tom] }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: espaco.sm + 2, borderRadius: raio.pill },
  texto: { fontSize: 12, fontWeight: '700' },
});
