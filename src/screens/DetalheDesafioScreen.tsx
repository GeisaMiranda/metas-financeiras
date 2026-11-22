import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ROTULO_SITUACAO, TOM_SITUACAO } from '../components/DesafioCard';
import { Badge } from '../components/Badge';
import { Estado } from '../components/Estado';
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/Screen';
import { fracaoDoDesafio } from '../domain/desafioRegras';
import { useDesafio } from '../hooks/useDesafios';
import { useUsuario } from '../hooks/useMetas';
import type { AppStackParamList } from '../navigation/types';
import { obterServicos } from '../services/container';
import { mensagemDeErro } from '../services/errors';
import { cores, fonte } from '../theme';
import { formatarData } from '../utils/date';
import { formatarReais } from '../utils/money';

type Props = NativeStackScreenProps<AppStackParamList, 'DetalheDesafio'>;

export function DetalheDesafioScreen({ route }: Props) {
  const usuario = useUsuario();
  const { dados, carregando, erro, recarregar } = useDesafio(route.params.desafioId);
  const [enviando, setEnviando] = useState(false);

  async function participar() {
    if (!usuario || !dados) return;
    setEnviando(true);
    try {
      await obterServicos().desafios.participar(usuario.id, dados.id);
      await recarregar();
    } catch (e) {
      Alert.alert('Não foi possível participar', mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  if (!dados) {
    return (
      <Screen>
        <Estado carregando={carregando} erro={erro} aoTentar={() => void recarregar()} />
      </Screen>
    );
  }

  const p = dados.participacao;
  return (
    <Screen>
      <Text style={fonte.titulo}>{dados.titulo}</Text>
      <Badge texto={ROTULO_SITUACAO[dados.situacao]} tom={TOM_SITUACAO[dados.situacao]} />
      <Text style={fonte.corpo}>{dados.descricao}</Text>
      <Card>
        <Text style={fonte.corpo}>Objetivo: guardar {formatarReais(dados.objetivo)}</Text>
        <Text style={fonte.corpo}>Prazo: {formatarData(dados.prazo)}</Text>
        <Text style={styles.pontos}>🏆 Recompensa: {dados.pontosRecompensa} pontos</Text>
      </Card>
      {p ? (
        <Card>
          <Text style={fonte.subtitulo}>Seu progresso</Text>
          <ProgressBar fracao={fracaoDoDesafio(p, dados)} cor={cores.destaque} />
          <Text style={fonte.corpo}>
            {formatarReais(p.progresso)} de {formatarReais(dados.objetivo)}
          </Text>
          {dados.situacao === 'EM_ANDAMENTO' ? (
            <Text style={fonte.pequeno}>Cada valor que você registrar em uma meta conta para este desafio.</Text>
          ) : null}
        </Card>
      ) : null}
      {dados.situacao === 'DISPONIVEL' ? <Button titulo="Participar do desafio" onPress={() => void participar()} carregando={enviando} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pontos: { fontWeight: '700', color: cores.alerta, fontSize: 16 },
});
