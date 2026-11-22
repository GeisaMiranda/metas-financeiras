import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Estado } from '../components/Estado';
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/Screen';
import { calcularProgresso, fracaoProgresso, valorRestante } from '../domain/metaRegras';
import { useMetaDetalhe, useUsuario } from '../hooks/useMetas';
import type { AppStackParamList } from '../navigation/types';
import { obterServicos } from '../services/container';
import { mensagemDeErro } from '../services/errors';
import { cores, espaco, fonte } from '../theme';
import { formatarData } from '../utils/date';
import { formatarReais } from '../utils/money';

type Props = NativeStackScreenProps<AppStackParamList, 'DetalheMeta'>;

export function DetalheMetaScreen({ navigation, route }: Props) {
  const { metaId } = route.params;
  const usuario = useUsuario();
  const { dados, carregando, erro, recarregar } = useMetaDetalhe(metaId);

  function confirmarExclusao() {
    Alert.alert('Excluir meta', 'Tem certeza? O histórico dos valores desta meta também será apagado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          if (!usuario) return;
          obterServicos()
            .metas.excluirMeta(usuario.id, metaId)
            .then(() => navigation.goBack())
            .catch((e: unknown) => Alert.alert('Não foi possível excluir', mensagemDeErro(e)));
        },
      },
    ]);
  }

  if (!dados) {
    return (
      <Screen>
        <Estado carregando={carregando} erro={erro} aoTentar={() => void recarregar()} />
      </Screen>
    );
  }

  const { meta, registros } = dados;
  const concluida = meta.status === 'CONCLUIDA';

  return (
    <Screen>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{meta.titulo}</Text>
        <Badge texto={concluida ? 'Concluída' : 'Em andamento'} tom={concluida ? 'sucesso' : 'neutro'} />
      </View>
      {meta.descricao ? <Text style={fonte.corpo}>{meta.descricao}</Text> : null}

      <Card>
        <Text style={styles.percentual}>{calcularProgresso(meta)}%</Text>
        <ProgressBar fracao={fracaoProgresso(meta)} cor={concluida ? cores.sucesso : cores.primaria} />
        <Text style={fonte.corpo}>
          {formatarReais(meta.valorAcumulado)} de {formatarReais(meta.valorObjetivo)}
        </Text>
        {!concluida ? <Text style={fonte.pequeno}>Faltam {formatarReais(valorRestante(meta))}</Text> : null}
        <Text style={fonte.pequeno}>Prazo: {formatarData(meta.prazo)}</Text>
      </Card>

      {concluida ? (
        <Card style={styles.parabens}>
          <Text style={styles.parabensTexto}>🎉 Parabéns! Você alcançou esta meta.</Text>
        </Card>
      ) : (
        <Button titulo="Registrar valor guardado" onPress={() => navigation.navigate('RegistrarValor', { metaId })} />
      )}

      <Text style={fonte.subtitulo}>Últimos registros</Text>
      {registros.length === 0 ? (
        <Text style={fonte.pequeno}>Nenhum valor registrado ainda.</Text>
      ) : (
        registros.slice(0, 3).map((r) => (
          <View key={r.id} style={styles.registro}>
            <Text style={fonte.corpo}>{formatarReais(r.valor)}</Text>
            <Text style={fonte.pequeno}>{formatarData(r.data.slice(0, 10))}</Text>
          </View>
        ))
      )}
      {registros.length > 0 ? (
        <Button titulo="Ver histórico completo" variante="secundario" onPress={() => navigation.navigate('Historico', { metaId })} />
      ) : null}

      <View style={styles.acoes}>
        <Button titulo="Editar" variante="secundario" onPress={() => navigation.navigate('EditarMeta', { metaId })} />
        <Button titulo="Excluir meta" variante="perigo" onPress={confirmarExclusao} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecalho: { gap: espaco.sm },
  titulo: fonte.titulo,
  percentual: { fontSize: 36, fontWeight: '800', color: cores.primariaEscura },
  parabens: { backgroundColor: cores.sucessoClaro },
  parabensTexto: { color: cores.sucesso, fontWeight: '700', fontSize: 16 },
  registro: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: espaco.sm, borderBottomWidth: 1, borderBottomColor: cores.borda },
  acoes: { gap: espaco.md, marginTop: espaco.md },
});
