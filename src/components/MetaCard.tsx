import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { fracaoProgresso, calcularProgresso } from '../domain/metaRegras';
import { cores, fonte } from '../theme';
import type { Meta } from '../types';
import { formatarData } from '../utils/date';
import { formatarReais } from '../utils/money';

export function MetaCard({ meta, onPress }: { meta: Meta; onPress: () => void }) {
  const concluida = meta.status === 'CONCLUIDA';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Meta ${meta.titulo}`} onPress={onPress}>
      <Card>
        <View style={styles.linha}>
          <Text style={styles.titulo} numberOfLines={1}>
            {meta.titulo}
          </Text>
          <Badge texto={concluida ? 'Concluída' : 'Em andamento'} tom={concluida ? 'sucesso' : 'neutro'} />
        </View>
        <ProgressBar fracao={fracaoProgresso(meta)} cor={concluida ? cores.sucesso : cores.primaria} />
        <View style={styles.linha}>
          <Text style={fonte.pequeno}>
            {formatarReais(meta.valorAcumulado)} de {formatarReais(meta.valorObjetivo)}
          </Text>
          <Text style={styles.percentual}>{calcularProgresso(meta)}%</Text>
        </View>
        <Text style={fonte.pequeno}>Prazo: {formatarData(meta.prazo)}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  titulo: { ...fonte.subtitulo, flex: 1 },
  percentual: { fontWeight: '700', color: cores.primariaEscura },
});
