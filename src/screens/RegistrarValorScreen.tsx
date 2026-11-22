import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../components/Button';
import { MoneyInput } from '../components/MoneyInput';
import { Screen } from '../components/Screen';
import { useMetaDetalhe, useUsuario } from '../hooks/useMetas';
import type { AppStackParamList } from '../navigation/types';
import { obterServicos } from '../services/container';
import { mensagemDeErro } from '../services/errors';
import { useAuthStore } from '../store/authStore';
import { cores, fonte } from '../theme';
import { formatarReais } from '../utils/money';

type Props = NativeStackScreenProps<AppStackParamList, 'RegistrarValor'>;

export function RegistrarValorScreen({ navigation, route }: Props) {
  const { metaId } = route.params;
  const usuario = useUsuario();
  const recarregarUsuario = useAuthStore((e) => e.recarregarUsuario);
  const { dados } = useMetaDetalhe(metaId);
  const [valor, setValor] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function registrar() {
    if (!usuario) return;
    setErro(null);
    setEnviando(true);
    try {
      const r = await obterServicos().metas.registrarValor(usuario.id, metaId, valor);
      await recarregarUsuario();
      const linhas = [`Você ganhou ${r.pontosGanhos} pontos.`];
      if (r.metaConcluida) linhas.unshift('🎉 Meta concluída! Parabéns!');
      for (const d of r.desafiosConcluidos) linhas.push(`🏆 Desafio "${d.titulo}" concluído: +${d.pontosRecompensa} pontos.`);
      Alert.alert(r.metaConcluida ? 'Meta alcançada!' : 'Valor registrado', linhas.join('\n'));
      navigation.goBack();
    } catch (e) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <Screen>
      {dados ? (
        <Text style={fonte.corpo}>
          Meta: <Text style={styles.negrito}>{dados.meta.titulo}</Text>
          {'\n'}
          Já guardado: {formatarReais(dados.meta.valorAcumulado)}
        </Text>
      ) : null}
      <MoneyInput rotulo="Quanto você guardou?" valor={valor} onChange={setValor} />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <Button titulo="Registrar" onPress={() => void registrar()} carregando={enviando} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  negrito: { fontWeight: '700' },
  erro: { color: cores.perigo, fontSize: 14 },
});
