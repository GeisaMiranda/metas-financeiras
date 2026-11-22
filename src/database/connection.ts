import * as SQLite from 'expo-sqlite';
import type { DatabaseService, Executor, ResultadoExecucao, ValorSql } from './types';
import { migrar } from './migrations';
import { carregarDesafiosIniciais } from './seed';

const NOME_DO_BANCO = 'metas-financeiras.db';

/** Executa SQL usando a conexão do expo-sqlite. */
class ExecutorExpo implements Executor {
  protected readonly conexao: SQLite.SQLiteDatabase;

  constructor(conexao: SQLite.SQLiteDatabase) {
    this.conexao = conexao;
  }

  async executar(sql: string, parametros: ValorSql[] = []): Promise<ResultadoExecucao> {
    const resultado = await this.conexao.runAsync(sql, parametros);
    return { ultimoIdInserido: resultado.lastInsertRowId, linhasAfetadas: resultado.changes };
  }

  async consultar<T>(sql: string, parametros: ValorSql[] = []): Promise<T[]> {
    return this.conexao.getAllAsync<T>(sql, parametros);
  }

  async consultarUm<T>(sql: string, parametros: ValorSql[] = []): Promise<T | null> {
    return this.conexao.getFirstAsync<T>(sql, parametros);
  }
}

/**
 * DatabaseService (SQLite) usado pelo aplicativo.
 * Diagrama de classes: abrir(), executar(), consultar(), transacao() e migrar().
 */
export class ExpoDatabaseService extends ExecutorExpo implements DatabaseService {
  /** Fila simples: só uma transação roda por vez (evita misturar duas transações). */
  private cauda: Promise<unknown> = Promise.resolve();

  /** Abre o arquivo do banco e liga as chaves estrangeiras. */
  static async abrir(): Promise<ExpoDatabaseService> {
    const conexao = await SQLite.openDatabaseAsync(NOME_DO_BANCO);
    await conexao.execAsync('PRAGMA foreign_keys = ON;');
    return new ExpoDatabaseService(conexao);
  }

  /** Cria as tabelas (se ainda não existirem) e carrega os desafios iniciais. */
  async migrar(): Promise<void> {
    await migrar(this);
    await carregarDesafiosIniciais(this);
  }

  async executarScript(sql: string): Promise<void> {
    await this.conexao.execAsync(sql);
  }

  transacao<T>(trabalho: (tx: Executor) => Promise<T>): Promise<T> {
    const rodar = async (): Promise<T> => {
      let resultado: T | undefined;
      await this.conexao.withTransactionAsync(async () => {
        resultado = await trabalho(this);
      });
      return resultado as T;
    };
    const proxima = this.cauda.then(rodar, rodar);
    this.cauda = proxima.catch(() => undefined);
    return proxima;
  }
}
