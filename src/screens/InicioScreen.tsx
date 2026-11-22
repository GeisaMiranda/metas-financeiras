import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Estado } from '../components/Estado';
import { MetaCard } from '../components/MetaCard';
import { Screen } from '../components/Screen';
import { nivelDaPontuacao } from '../domain/metaRegras';
import { useMetas, useResumo, useUsuario } from '../hooks/useMetas';
import type { AppStackParamList, TabsParamList } from '../navigation/types';
import { cores, espaco, fonte } from '../theme';
import { formatarReais } from '../utils/money';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, 'Inicio'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function InicioScreen({ navigation }: Props) {
  const usuario = useUsuario();
  const resumo = useResumo();
  const metas = useMetas('EM_ANDAMENTO');
  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';
  const lista = (metas.dados ?? []).slice(0, 3);

  return (
    <Screen>
      <Text style={styles.ola}>Olá, {primeiroNome}! 👋</Text>

      <Estado carregando={resumo.carregando} erro={resumo.erro} aoTentar={() => void resumo.recarregar()} />
      {resumo.dados ? (
        <>
          <Card style={styles.destaque}>
            <Text style={styles.destaqueRotulo}>Total guardado</Text>
            <Text style={styles.destaqueValor}>{formatarReais(resumo.dados.totalGuardado)}</Text>
          </Card>
          <View style={styles.linha}>
            <Card style={styles.metade}>
              <Text style={styles.numero}>{resumo.dados.metasEmAndamento}</Text>
              <Text style={fonte.pequeno}>em andamento</Text>
            </Card>
            <Card style={styles.metade}>
              <Text style={styles.numero}>{resumo.dados.metasConcluidas}</Text>
              <Text style={fonte.pequeno}>concluídas</Text>
            </Card>
          </View>
          <Card>
            <Text style={fonte.pequeno}>Seus pontos</Text>
            <Text style={styles.numero}>
              🏆 {resumo.dados.pontuacaoTotal} · Nível {nivelDaPontuacao(resumo.dados.pontuacaoTotal)}
            </Text>
          </Card>
        </>
      ) : null}

      <Text style={fonte.subtitulo}>Suas metas</Text>
      {lista.length === 0 && !metas.carregando ? (
        <EmptyState
          titulo="Nenhuma meta ainda"
          texto="Crie a sua primeira meta e comece a guardar para o que importa."
          acao={{ titulo: 'Criar meta', onPress: () => navigation.navigate('CriarMeta') }}
        />
      ) : (
        lista.map((m) => <MetaCard key={m.id} meta={m} onPress={() => navigation.navigate('DetalheMeta', { metaId: m.id })} />)
      )}
      {lista.length > 0 ? <Button titulo="Nova meta" variante="secundario" onPress={() => navigation.navigate('CriarMeta')} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ola: { ...fonte.titulo, marginTop: espaco.sm },
  destaque: { backgroundColor: cores.primaria },
  destaqueRotulo: { color: cores.primariaClara, fontSize: 14 },
  destaqueValor: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  linha: { flexDirection: 'row', gap: espaco.md },
  metade: { flex: 1 },
  numero: { fontSize: 22, fontWeight: '700', color: cores.texto },
});
