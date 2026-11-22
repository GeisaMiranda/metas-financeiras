import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { cores } from '../theme';
import { useAuthStore } from '../store/authStore';
import { AberturaScreen } from '../screens/AberturaScreen';
import { CadastroScreen } from '../screens/CadastroScreen';
import { CriarMetaScreen } from '../screens/CriarMetaScreen';
import { DesafiosScreen } from '../screens/DesafiosScreen';
import { DetalheDesafioScreen } from '../screens/DetalheDesafioScreen';
import { DetalheMetaScreen } from '../screens/DetalheMetaScreen';
import { HistoricoScreen } from '../screens/HistoricoScreen';
import { InicioScreen } from '../screens/InicioScreen';
import { ListaMetasScreen } from '../screens/ListaMetasScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PerfilScreen } from '../screens/PerfilScreen';
import { RegistrarValorScreen } from '../screens/RegistrarValorScreen';
import type { AppStackParamList, AuthStackParamList, TabsParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

const ICONES: Record<keyof TabsParamList, keyof typeof Ionicons.glyphMap> = {
  Inicio: 'home',
  Metas: 'flag',
  Desafios: 'trophy',
  Perfil: 'person',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONES[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Metas" component={ListaMetasScreen} options={{ title: 'Metas' }} />
      <Tab.Screen name="Desafios" component={DesafiosScreen} options={{ title: 'Desafios' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const opcoesCabecalho = {
  headerTintColor: cores.primariaEscura,
  headerStyle: { backgroundColor: cores.fundo },
  headerShadowVisible: false,
  headerBackTitle: 'Voltar',
};

/**
 * Rotas protegidas: sem usuário logado, só existem Login e Cadastro.
 * Ao entrar, o estado muda e o app troca de grupo de telas automaticamente.
 */
export function RootNavigator() {
  const iniciando = useAuthStore((e) => e.iniciando);
  const erroInicial = useAuthStore((e) => e.erroInicial);
  const usuario = useAuthStore((e) => e.usuario);

  if (iniciando || erroInicial) return <AberturaScreen />;

  return (
    <NavigationContainer>
      {usuario === null ? (
        <AuthStack.Navigator screenOptions={{ ...opcoesCabecalho, headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Cadastro" component={CadastroScreen} />
        </AuthStack.Navigator>
      ) : (
        <AppStack.Navigator screenOptions={opcoesCabecalho}>
          <AppStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <AppStack.Screen name="CriarMeta" component={CriarMetaScreen} options={{ title: 'Nova meta' }} />
          <AppStack.Screen name="EditarMeta" component={CriarMetaScreen} options={{ title: 'Editar meta' }} />
          <AppStack.Screen name="DetalheMeta" component={DetalheMetaScreen} options={{ title: 'Meta' }} />
          <AppStack.Screen name="RegistrarValor" component={RegistrarValorScreen} options={{ title: 'Registrar valor' }} />
          <AppStack.Screen name="DetalheDesafio" component={DetalheDesafioScreen} options={{ title: 'Desafio' }} />
          <AppStack.Screen name="Historico" component={HistoricoScreen} options={{ title: 'Histórico' }} />
        </AppStack.Navigator>
      )}
    </NavigationContainer>
  );
}
