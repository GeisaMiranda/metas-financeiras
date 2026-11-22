import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Estado } from '../components/Estado';
import { MetaCard } from '../components/MetaCard';
import { Screen } from '../components/Screen';
import { useMetas } from '../hooks/useMetas';
import type { AppStackParamList, TabsParamList } from '../navigation/types';
import { cores, espaco, fonte, raio } from '../theme';
import type { StatusMeta } from '../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, 'Metas'>,
  NativeStackScreenProps<AppStackParamList>
>;

const FILTROS: { rotulo: string; valor: StatusMeta | undefined }[] = [
  { rotulo: 'Todas', valor: undefined },
  { rotulo: 'Em andamento', valor: 'EM_ANDAMENTO' },
  { rotulo: 'Concluídas', valor: 'CONCLUIDA' },
];

export function ListaMetasScreen({ navigation }: Props) {
  const [filtro, setFiltro] = useState<StatusMeta | undefined>(undefined);
  const { dados, carregando, erro, recarregar } = useMetas(filtro);

  return (
    <Screen rolavel={false}>
      <Text style={fonte.titulo}>Minhas metas</Text>
      <View style={styles.filtros}>
        {FILTROS.map((f) => (
          <Pressable
            key={f.rotulo}
            accessibilityRole="button"
            accessibilityState={{ selected: filtro === f.valor }}
            onPress={() => setFiltro(f.valor)}
            style={[styles.filtro, filtro === f.valor && styles.filtroAtivo]}
          >
            <Text style={[styles.filtroTexto, filtro === f.valor && styles.filtroTextoAtivo]}>{f.rotulo}</Text>
          </Pressable>
        ))}
      </View>
      <Estado carregando={carregando} erro={erro} aoTentar={() => void recarregar()} />
      {!carregando && !erro ? (
        <FlatList
          data={dados ?? []}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => <MetaCard meta={item} onPress={() => navigation.navigate('DetalheMeta', { metaId: item.id })} />}
          ItemSeparatorComponent={() => <View style={{ height: espaco.md }} />}
          ListEmptyComponent={
            <EmptyState titulo="Nada por aqui" texto="Você ainda não tem metas nesta lista." />
          }
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
      <View style={styles.rodape}>
        <Button titulo="Nova meta" onPress={() => navigation.navigate('CriarMeta')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filtros: { flexDirection: 'row', gap: espaco.sm, marginVertical: espaco.md },
  filtro: { paddingVertical: 6, paddingHorizontal: espaco.md, borderRadius: raio.pill, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda },
  filtroAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  filtroTexto: { color: cores.texto, fontWeight: '600', fontSize: 13 },
  filtroTextoAtivo: { color: '#FFFFFF' },
  lista: { paddingBottom: espaco.lg, flexGrow: 1 },
  rodape: { paddingVertical: espaco.md },
});
