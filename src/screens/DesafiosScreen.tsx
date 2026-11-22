import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { DesafioCard } from '../components/DesafioCard';
import { Estado } from '../components/Estado';
import { Screen } from '../components/Screen';
import { useDesafios } from '../hooks/useDesafios';
import type { AppStackParamList, TabsParamList } from '../navigation/types';
import { cores, fonte } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, 'Desafios'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function DesafiosScreen({ navigation }: Props) {
  const { dados, carregando, erro, recarregar } = useDesafios();
  return (
    <Screen>
      <Text style={fonte.titulo}>Desafios</Text>
      <Text style={{ ...fonte.corpo, color: cores.textoSuave }}>Participe, guarde dinheiro e ganhe pontos.</Text>
      <Estado carregando={carregando} erro={erro} aoTentar={() => void recarregar()} />
      {(dados ?? []).map((d) => (
        <DesafioCard key={d.id} desafio={d} onPress={() => navigation.navigate('DetalheDesafio', { desafioId: d.id })} />
      ))}
    </Screen>
  );
}
