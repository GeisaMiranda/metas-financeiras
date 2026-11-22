import { createHash, randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type { DatabaseService, Executor, ResultadoExecucao, ValorSql } from '../../src/database/types';
import { migrar } from '../../src/database/migrations';
import { carregarDesafiosIniciais } from '../../src/database/seed';
import { criarServicos } from '../../src/services/factory';
import type { Servicos } from '../../src/services/factory';
import { textosIguais } from '../../src/services/passwordHasher';
import type { PasswordHasher } from '../../src/services/passwordHasher';
import type { KeyValueStorage } from '../../src/services/storage';
import { hojeISO } from '../../src/utils/date';

/**
 * Banco SQLite em memória usando o SQLite que vem no Node (node:sqlite).
 * Implementa o mesmo contrato `DatabaseService` do app, então as regras de negócio
 * são testadas com SQL de verdade (CHECK, UNIQUE, chaves estrangeiras...).
 */
export class BancoEmMemoria implements DatabaseService {
  readonly sqlite: DatabaseSync;

  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
    this.sqlite.exec('PRAGMA foreign_keys = ON;');
  }

  async executar(sql: string, parametros: ValorSql[] = []): Promise<ResultadoExecucao> {
    const r = this.sqlite.prepare(sql).run(...parametros);
    return { ultimoIdInserido: Number(r.lastInsertRowid), linhasAfetadas: Number(r.changes) };
  }

  async consultar<T>(sql: string, parametros: ValorSql[] = []): Promise<T[]> {
    return this.sqlite.prepare(sql).all(...parametros) as unknown as T[];
  }

  async consultarUm<T>(sql: string, parametros: ValorSql[] = []): Promise<T | null> {
    const linha = this.sqlite.prepare(sql).get(...parametros);
    return (linha as unknown as T | undefined) ?? null;
  }

  async executarScript(sql: string): Promise<void> {
    this.sqlite.exec(sql);
  }

  async transacao<T>(trabalho: (tx: Executor) => Promise<T>): Promise<T> {
    this.sqlite.exec('BEGIN');
    try {
      const resultado = await trabalho(this);
      this.sqlite.exec('COMMIT');
      return resultado;
    } catch (erro) {
      this.sqlite.exec('ROLLBACK');
      throw erro;
    }
  }
}

/** Hash simples só para os testes (o app usa expo-crypto). */
export class HasherDeTeste implements PasswordHasher {
  async gerarHash(senha: string): Promise<string> {
    const sal = randomBytes(8).toString('hex');
    return `teste$${sal}$${createHash('sha256').update(`${sal}:${senha}`).digest('hex')}`;
  }

  async verificar(senha: string, hashGuardado: string): Promise<boolean> {
    const [, sal, esperado] = hashGuardado.split('$');
    if (!sal || !esperado) return false;
    return textosIguais(createHash('sha256').update(`${sal}:${senha}`).digest('hex'), esperado);
  }
}

export class ArmazenamentoEmMemoria implements KeyValueStorage {
  readonly dados = new Map<string, string>();

  async getItem(chave: string): Promise<string | null> {
    return this.dados.get(chave) ?? null;
  }

  async setItem(chave: string, valor: string): Promise<void> {
    this.dados.set(chave, valor);
  }

  async removeItem(chave: string): Promise<void> {
    this.dados.delete(chave);
  }
}

export interface Ambiente extends Servicos {
  banco: BancoEmMemoria;
  armazenamento: ArmazenamentoEmMemoria;
  /** Troca o "agora" usado pelos serviços (ano, mês 1-12, dia). */
  definirDia(ano: number, mes: number, dia: number): void;
}

/** Cria um app completo em memória: banco migrado, desafios carregados e serviços prontos. */
export async function criarAmbiente(dia = { ano: 2026, mes: 11, dia: 23 }): Promise<Ambiente> {
  let agora = new Date(dia.ano, dia.mes - 1, dia.dia, 12, 0, 0);
  const relogio = () => agora;

  const banco = new BancoEmMemoria();
  await migrar(banco);
  await carregarDesafiosIniciais(banco, hojeISO(agora));

  const armazenamento = new ArmazenamentoEmMemoria();
  const servicos = criarServicos({ db: banco, hasher: new HasherDeTeste(), armazenamento, relogio });

  return {
    ...servicos,
    banco,
    armazenamento,
    definirDia(ano, mes, d) {
      agora = new Date(ano, mes - 1, d, 12, 0, 0);
    },
  };
}

/** Cria um usuário já cadastrado para os testes. */
export async function criarUsuario(amb: Ambiente, email = 'geisa@exemplo.com') {
  return amb.auth.cadastrar({ nome: 'Geisa', email, senha: 'senha123' });
}
