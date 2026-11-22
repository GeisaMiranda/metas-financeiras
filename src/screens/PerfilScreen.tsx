import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { nivelDaPontuacao, PONTOS_POR_NIVEL } from '../domain/metaRegras';
import { useCarregar } from '../hooks/useCarregar';
import { useUsuario } from '../hooks/useMetas';
import { obterServicos } from '../services/container';
import { mensagemDeErro } from '../services/errors';
import { useAuthStore } from '../store/authStore';
import { cores, espaco, fonte } from '../theme';
import { ProgressBar } from '../components/ProgressBar';

export function PerfilScreen() {
  const usuario = useUsuario();
  const sair = useAuthStore((e) => e.sair);
  const recarregarUsuario = useAuthStore((e) => e.recarregarUsuario);
  const [alterando, setAlterando] = useState(false);

  // Atualiza a pontuação sempre que a aba é aberta.
  useCarregar(async () => {
    await recarregarUsuario();
    return true;
  }, [usuario?.id], usuario !== null);

  const lembrete = useCarregar<boolean>(
    () => obterServicos().notificacoes.lembretesAtivos(usuario?.id ?? 0),
    [usuario?.id],
    usuario !== null,
  );

  if (!usuario) return null;
  const pontos = usuario.pontuacaoTotal;

  async function alternar(ativar: boolean) {
    if (!usuario) return;
    setAlterando(true);
    try {
      const ficou = await obterServicos().notificacoes.definirLembretes(usuario.id, ativar);
      if (ativar && !ficou) {
        Alert.alert('Permissão necessária', 'Para receber lembretes, permita as notificações nas configurações do celular.');
      }
      await lembrete.recarregar();
    } catch (e) {
      Alert.alert('Erro', mensagemDeErro(e));
    } finally {
      setAlterando(false);
    }
  }

  return (
    <Screen>
      <Text style={fonte.titulo}>Perfil</Text>
      <Card>
        <Text style={fonte.subtitulo}>{usuario.nome}</Text>
        <Text style={fonte.pequeno}>{usuario.email}</Text>
      </Card>
      <Card>
        <Text style={styles.pontos}>🏆 {pontos} pontos</Text>
        <Text style={fonte.corpo}>Nível {nivelDaPontuacao(pontos)}</Text>
        <ProgressBar fracao={(pontos % PONTOS_POR_NIVEL) / PONTOS_POR_NIVEL} cor={cores.destaque} />
        <Text style={fonte.pequeno}>Faltam {PONTOS_POR_NIVEL - (pontos % PONTOS_POR_NIVEL)} pontos para o próximo nível</Text>
      </Card>
      <Card>
        <View style={styles.linha}>
          <View style={styles.flex}>
            <Text style={fonte.corpo}>Lembrete diário</Text>
            <Text style={fonte.pequeno}>Aviso todos os dias às 20h para registrar o que guardou.</Text>
          </View>
          <Switch
            accessibilityLabel="Lembrete diário"
            value={lembrete.dados ?? false}
            disabled={alterando}
            onValueChange={(v) => void alternar(v)}
            trackColor={{ true: cores.primaria, false: cores.borda }}
          />
        </View>
      </Card>
      <Button titulo="Sair da conta" variante="perigo" onPress={() => void sair()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pontos: { fontSize: 24, fontWeight: '800', color: cores.alerta },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  flex: { flex: 1, gap: 2 },
});
