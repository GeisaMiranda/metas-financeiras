import type { DatabaseService } from '../database/types';
import { criarRepositorios } from '../database/repositories';
import type { DadosCadastro, Usuario } from '../types';
import { agoraISO } from '../utils/date';
import { emailValido, normalizarEmail, SENHA_MINIMA, textoVazio } from '../utils/validation';
import { RegraDeNegocioError } from './errors';
import type { PasswordHasher } from './passwordHasher';
import type { SessaoStorage } from './storage';
import { relogioPadrao } from './tipos';
import type { Relogio } from './tipos';

const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha incorretos.';

/** Cadastro, login e sessão do usuário (RF01, RF02). Tudo local, sem servidor. */
export class AuthService {
  private readonly db: DatabaseService;
  private readonly hasher: PasswordHasher;
  private readonly sessao: SessaoStorage;
  private readonly relogio: Relogio;

  constructor(db: DatabaseService, hasher: PasswordHasher, sessao: SessaoStorage, relogio: Relogio = relogioPadrao) {
    this.db = db;
    this.hasher = hasher;
    this.sessao = sessao;
    this.relogio = relogio;
  }

  /** Cria a conta e já entra no app. */
  async cadastrar(dados: DadosCadastro): Promise<Usuario> {
    const nome = dados.nome.trim();
    const email = normalizarEmail(dados.email);

    if (nome.length < 2) throw new RegraDeNegocioError('RF01', 'Informe o seu nome.');
    if (!emailValido(email)) throw new RegraDeNegocioError('RF01', 'Informe um e-mail válido.');
    if (textoVazio(dados.senha) || dados.senha.length < SENHA_MINIMA) {
      throw new RegraDeNegocioError('RF01', `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    }

    const repos = criarRepositorios(this.db);
    // RN17: o e-mail não pode se repetir.
    if (await repos.usuarios.buscarPorEmail(email)) {
      throw new RegraDeNegocioError('RN17', 'Este e-mail já está cadastrado.');
    }

    const senhaHash = await this.hasher.gerarHash(dados.senha);
    const id = await repos.usuarios.inserir({ nome, email, senhaHash, dataCadastro: agoraISO(this.relogio()) });

    const usuario = await repos.usuarios.buscarPorId(id);
    if (!usuario) throw new RegraDeNegocioError('RF01', 'Não foi possível criar a conta.');
    await this.sessao.salvarSessao(usuario.id);
    return usuario;
  }

  async entrar(email: string, senha: string): Promise<Usuario> {
    const repos = criarRepositorios(this.db);
    const encontrado = await repos.usuarios.buscarPorEmail(normalizarEmail(email));
    // Mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem).
    if (!encontrado) throw new RegraDeNegocioError('RF02', MENSAGEM_LOGIN_INVALIDO);
    if (!(await this.hasher.verificar(senha, encontrado.senhaHash))) {
      throw new RegraDeNegocioError('RF02', MENSAGEM_LOGIN_INVALIDO);
    }
    await this.sessao.salvarSessao(encontrado.id);
    const { senhaHash: _senhaHash, ...usuario } = encontrado;
    return usuario;
  }

  async sair(): Promise<void> {
    await this.sessao.limparSessao();
  }

  /** Usuário que estava logado quando o app foi fechado (ou null). */
  async usuarioLogado(): Promise<Usuario | null> {
    const id = await this.sessao.obterSessao();
    if (id === null) return null;
    const usuario = await criarRepositorios(this.db).usuarios.buscarPorId(id);
    if (!usuario) await this.sessao.limparSessao();
    return usuario;
  }
}
