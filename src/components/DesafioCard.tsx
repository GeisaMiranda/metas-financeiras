import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { fracaoDoDesafio } from '../domain/desafioRegras';
import { cores, fonte } from '../theme';
import type { DesafioComSituacao, SituacaoDesafio } from '../types';
import { formatarData } from '../utils/date';
import { formatarReais } from '../utils/money';

export const ROTULO_SITUACAO: Record<SituacaoDesafio, string> = {
  DISPONIVEL: 'Disponível',
  EM_ANDAMENTO: 'Participando',
  CONCLUIDO: 'Concluído',
  ENCERRADO: 'Encerrado',
};
export const TOM_SITUACAO: Record<SituacaoDesafio, 'neutro' | 'sucesso' | 'alerta' | 'perigo'> = {
  DISPONIVEL: 'neutro',
  EM_ANDAMENTO: 'alerta',
  CONCLUIDO: 'sucesso',
  ENCERRADO: 'perigo',
};

export function DesafioCard({ desafio, onPress }: { desafio: DesafioComSituacao; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Desafio ${desafio.titulo}`} onPress={onPress}>
      <Card>
        <View style={styles.linha}>
          <Text style={styles.titulo} numberOfLines={1}>
            {desafio.titulo}
          </Text>
          <Badge texto={ROTULO_SITUACAO[desafio.situacao]} tom={TOM_SITUACAO[desafio.situacao]} />
        </View>
        <Text style={fonte.pequeno}>
          Guarde {formatarReais(desafio.objetivo)} até {formatarData(desafio.prazo)}
        </Text>
        {desafio.participacao ? <ProgressBar fracao={fracaoDoDesafio(desafio.participacao, desafio)} cor={cores.destaque} /> : null}
        <Text style={styles.pontos}>🏆 {desafio.pontosRecompensa} pontos</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  titulo: { ...fonte.subtitulo, flex: 1 },
  pontos: { fontWeight: '700', color: cores.alerta },
});
