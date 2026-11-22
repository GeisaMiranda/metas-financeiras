import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../components/Button';
import { DateInput } from '../components/DateInput';
import { Input } from '../components/Input';
import { MoneyInput } from '../components/MoneyInput';
import { Screen } from '../components/Screen';
import { useMetaDetalhe, useUsuario } from '../hooks/useMetas';
import type { AppStackParamList } from '../navigation/types';
import { obterServicos } from '../services/container';
import { mensagemDeErro } from '../services/errors';
import { cores } from '../theme';
import { formatarData, parseDataBR } from '../utils/date';

/** Serve para criar (sem parâmetros) e para editar (com `metaId`). */
export function CriarMetaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'EditarMeta'>>();
  const metaId = (route.params as { metaId?: number } | undefined)?.metaId;
  const editando = metaId !== undefined;
  const usuario = useUsuario();

  const existente = useMetaDetalhe(metaId ?? 0);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState(0);
  const [prazo, setPrazo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [preenchido, setPreenchido] = useState(false);

  useEffect(() => {
    if (editando && existente.dados && !preenchido) {
      const m = existente.dados.meta;
      setTitulo(m.titulo);
      setDescricao(m.descricao ?? '');
      setValor(m.valorObjetivo);
      setPrazo(formatarData(m.prazo));
      setPreenchido(true);
    }
  }, [editando, existente.dados, preenchido]);

  async function salvar() {
    if (!usuario) return;
    setErro(null);
    const prazoISO = parseDataBR(prazo);
    if (!prazoISO) {
      setErro('Informe uma data válida, no formato DD/MM/AAAA.');
      return;
    }
    setEnviando(true);
    try {
      const dados = { titulo, descricao, valorObjetivo: valor, prazo: prazoISO };
      const servicos = obterServicos();
      if (editando) {
        await servicos.metas.editarMeta(usuario.id, metaId, dados);
      } else {
        await servicos.metas.criarMeta(usuario.id, dados);
      }
      navigation.goBack();
    } catch (e) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <Screen>
      <Input rotulo="Nome da meta" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Viagem de férias" />
      <Input
        rotulo="Descrição (opcional)"
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Para que é esta meta?"
        multiline
        style={styles.multilinha}
      />
      <MoneyInput rotulo="Valor que quero juntar" valor={valor} onChange={setValor} />
      <DateInput rotulo="Prazo" valor={prazo} onChange={setPrazo} />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <Button titulo={editando ? 'Salvar alterações' : 'Criar meta'} onPress={() => void salvar()} carregando={enviando} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  multilinha: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
  erro: { color: cores.perigo, fontSize: 14 },
});
