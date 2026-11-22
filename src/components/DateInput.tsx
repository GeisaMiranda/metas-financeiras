import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Input } from './Input';
import { cores, espaco, raio } from '../theme';
import { adicionarDias, adicionarMeses, formatarData, hojeISO, mascaraData } from '../utils/date';

interface Props {
  rotulo: string;
  /** texto como o usuário vê: DD/MM/AAAA */
  valor: string;
  onChange: (texto: string) => void;
  erro?: string | null;
}

/** Campo de data com máscara DD/MM/AAAA e atalhos rápidos (evita erro de digitação). */
export function DateInput({ rotulo, valor, onChange, erro }: Props) {
  const hoje = hojeISO();
  const atalhos = [
    { nome: '1 mês', data: adicionarMeses(hoje, 1) },
    { nome: '3 meses', data: adicionarMeses(hoje, 3) },
    { nome: '6 meses', data: adicionarMeses(hoje, 6) },
    { nome: '1 ano', data: adicionarDias(hoje, 365) },
  ];
  return (
    <View style={styles.grupo}>
      <Input
        rotulo={rotulo}
        erro={erro}
        keyboardType="number-pad"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        value={valor}
        onChangeText={(t) => onChange(mascaraData(t))}
      />
      <View style={styles.atalhos}>
        {atalhos.map((a) => (
          <Pressable
            key={a.nome}
            accessibilityRole="button"
            accessibilityLabel={`Prazo de ${a.nome}`}
            onPress={() => onChange(formatarData(a.data))}
            style={styles.atalho}
          >
            <Text style={styles.atalhoTexto}>{a.nome}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: espaco.sm },
  atalhos: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  atalho: {
    paddingVertical: espaco.xs + 2,
    paddingHorizontal: espaco.md,
    borderRadius: raio.pill,
    backgroundColor: cores.primariaClara,
  },
  atalhoTexto: { color: cores.primariaEscura, fontWeight: '600', fontSize: 13 },
});
