/**
 * Contratos da camada de banco de dados.
 *
 * Os repositórios e serviços só conhecem estas interfaces. Quem fala de verdade com o
 * SQLite é o `DatabaseService` (ver connection.ts, que usa expo-sqlite). Nos testes, a mesma
 * interface é implementada com o SQLite que vem junto do Node — assim as regras são testadas
 * com SQL real, sem precisar de celular.
 */

export type ValorSql = string | number | null;

export interface ResultadoExecucao {
  ultimoIdInserido: number;
  linhasAfetadas: number;
}

/** Executa comandos SQL. Dentro de uma transação, o serviço recebe um Executor. */
export interface Executor {
  executar(sql: string, parametros?: ValorSql[]): Promise<ResultadoExecucao>;
  consultar<T>(sql: string, parametros?: ValorSql[]): Promise<T[]>;
  consultarUm<T>(sql: string, parametros?: ValorSql[]): Promise<T | null>;
}

export interface DatabaseService extends Executor {
  /**
   * Roda o trabalho dentro de uma transação: ou tudo é salvo, ou nada é (RNF10).
   * Se o trabalho lançar um erro, tudo é desfeito (rollback) e o erro é repassado.
   */
  transacao<T>(trabalho: (tx: Executor) => Promise<T>): Promise<T>;
  /** Roda vários comandos de uma vez (usado nas migrações). */
  executarScript(sql: string): Promise<void>;
}
