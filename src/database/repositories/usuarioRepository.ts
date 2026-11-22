import type { Executor } from '../types';
import type { Usuario, UsuarioComSenha } from '../../types';

interface LinhaUsuario {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  pontuacao_total: number;
  data_cadastro: string;
}

function paraUsuario(l: LinhaUsuario): Usuario {
  return {
    id: l.id,
    nome: l.nome,
    email: l.email,
    pontuacaoTotal: l.pontuacao_total,
    dataCadastro: l.data_cadastro,
  };
}

export interface NovoUsuario {
  nome: string;
  email: string;
  senhaHash: string;
  dataCadastro: string;
}

/** Único ponto de acesso à tabela `usuario`. */
export class UsuarioRepository {
  private readonly db: Executor;

  constructor(db: Executor) {
    this.db = db;
  }

  async inserir(novo: NovoUsuario): Promise<number> {
    const r = await this.db.executar(
      'INSERT INTO usuario (nome, email, senha_hash, pontuacao_total, data_cadastro) VALUES (?, ?, ?, 0, ?)',
      [novo.nome, novo.email, novo.senhaHash, novo.dataCadastro],
    );
    return r.ultimoIdInserido;
  }

  async buscarPorEmail(email: string): Promise<UsuarioComSenha | null> {
    const l = await this.db.consultarUm<LinhaUsuario>('SELECT * FROM usuario WHERE email = ?', [email]);
    return l ? { ...paraUsuario(l), senhaHash: l.senha_hash } : null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const l = await this.db.consultarUm<LinhaUsuario>('SELECT * FROM usuario WHERE id = ?', [id]);
    return l ? paraUsuario(l) : null;
  }

  async atualizarPontuacao(id: number, total: number): Promise<void> {
    await this.db.executar('UPDATE usuario SET pontuacao_total = ? WHERE id = ?', [total, id]);
  }

  /** Soma pontos direto no banco (seguro mesmo se duas ações acontecerem juntas). */
  async somarPontuacao(id: number, pontos: number): Promise<void> {
    await this.db.executar('UPDATE usuario SET pontuacao_total = pontuacao_total + ? WHERE id = ?', [pontos, id]);
  }
}
