import { create } from 'zustand';
import { inicializarServicos, obterServicos } from '../services/container';
import type { DadosCadastro, Usuario } from '../types';

/** Tempo mínimo da tela de abertura, para ela não "piscar". */
const TEMPO_MINIMO_ABERTURA_MS = 900;

interface AuthState {
  /** Usuário logado. Quando é `null`, só as telas de login/cadastro ficam disponíveis. */
  usuario: Usuario | null;
  /** `true` enquanto o app abre o banco e confere se já havia alguém logado. */
  iniciando: boolean;
  erroInicial: string | null;

  iniciar: () => Promise<void>;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  sair: () => Promise<void>;
  /** Busca o usuário de novo no banco (para atualizar a pontuação mostrada). */
  recarregarUsuario: () => Promise<void>;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Estado global do app: quem está logado (base das rotas protegidas). */
export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  iniciando: true,
  erroInicial: null,

  iniciar: async () => {
    set({ iniciando: true, erroInicial: null });
    try {
      const [servicos] = await Promise.all([inicializarServicos(), esperar(TEMPO_MINIMO_ABERTURA_MS)]);
      servicos.notificacoes.configurarExibicao();
      const usuario = await servicos.auth.usuarioLogado();
      set({ usuario, iniciando: false });
    } catch {
      set({ iniciando: false, erroInicial: 'Não foi possível abrir o banco de dados do aplicativo.' });
    }
  },

  entrar: async (email, senha) => {
    const usuario = await obterServicos().auth.entrar(email, senha);
    set({ usuario });
  },

  cadastrar: async (dados) => {
    const usuario = await obterServicos().auth.cadastrar(dados);
    set({ usuario });
  },

  sair: async () => {
    await obterServicos().auth.sair();
    set({ usuario: null });
  },

  recarregarUsuario: async () => {
    const atual = get().usuario;
    if (!atual) return;
    const usuario = await obterServicos().auth.usuarioLogado();
    set({ usuario });
  },
}));
