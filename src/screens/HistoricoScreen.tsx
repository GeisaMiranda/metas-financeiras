import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { Estado } from '../components/Estado';
import { Screen } from '../components/Screen';
import { useMetaDetalhe } from '../hooks/useMetas';
import type { AppStackParamList } from '../navigation/types';
import { cores, espaco, fonte } from '../theme';
import { formatarData } from '../utils/date';
import { formatarReais } from '../utils/money';

type Props = NativeStackScreenProps<AppStackParamList, 'Historico'>;

export function HistoricoScreen({ route }: Props) {
  const { dados, carregando, erro, recarregar } = useMetaDetalhe(route.params.metaId);
  return (
    <Screen>
      <Estado carregando={carregando} erro={erro} aoTentar={() => void recarregar()} />
      {dados ? (
        <>
          <Text style={fonte.titulo}>{dados.meta.titulo}</Text>
          {dados.registros.length === 0 ? (
            <EmptyState titulo="Sem registros" texto="Os valores que você guardar vão aparecer aqui." />
          ) : (
            dados.registros.map((r) => (
              <View key={r.id} style={styles.linha}>
                <Text style={styles.valor}>{formatarReais(r.valor)}</Text>
                <Text style={fonte.pequeno}>{formatarData(r.data.slice(0, 10))}</Text>
              </View>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: espaco.md, borderBottomWidth: 1, borderBottomColor: cores.borda },
  valor: { ...fonte.corpo, fontWeight: '600' },
});
