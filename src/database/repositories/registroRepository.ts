import type { Executor } from '../types';
import type { RegistroProgresso } from '../../types';

interface LinhaRegistro {
  id: number;
  meta_id: number;
  valor: number;
  data: string;
}

export interface NovoRegistro {
  metaId: number;
  valor: number;
  data: string;
}

/** Único ponto de acesso à tabela `registro_progresso`. */
export class RegistroRepository {
  private readonly db: Executor;

  constructor(db: Executor) {
    this.db = db;
  }

  async inserir(novo: NovoRegistro): Promise<number> {
    const r = await this.db.executar('INSERT INTO registro_progresso (meta_id, valor, data) VALUES (?, ?, ?)', [
      novo.metaId,
      novo.valor,
      novo.data,
    ]);
    return r.ultimoIdInserido;
  }

  async listarPorMeta(metaId: number): Promise<RegistroProgresso[]> {
    const linhas = await this.db.consultar<LinhaRegistro>(
      'SELECT * FROM registro_progresso WHERE meta_id = ? ORDER BY data DESC, id DESC',
      [metaId],
    );
    return linhas.map((l) => ({ id: l.id, metaId: l.meta_id, valor: l.valor, data: l.data }));
  }

  /** RN11: o valor acumulado da meta é a soma de todos os registros dela. */
  async somarPorMeta(metaId: number): Promise<number> {
    const l = await this.db.consultarUm<{ total: number }>(
      'SELECT COALESCE(SUM(valor), 0) AS total FROM registro_progresso WHERE meta_id = ?',
      [metaId],
    );
    return l?.total ?? 0;
  }

  async excluirPorMeta(metaId: number): Promise<void> {
    await this.db.executar('DELETE FROM registro_progresso WHERE meta_id = ?', [metaId]);
  }
}
