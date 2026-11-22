import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Cadastro: undefined;
};

export type TabsParamList = {
  Inicio: undefined;
  Metas: undefined;
  Desafios: undefined;
  Perfil: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  CriarMeta: undefined;
  EditarMeta: { metaId: number };
  DetalheMeta: { metaId: number };
  RegistrarValor: { metaId: number };
  DetalheDesafio: { desafioId: number };
  Historico: { metaId: number };
};
