import type { Executor } from '../types';
import type { Meta, MetaListada, StatusMeta } from '../../types';

interface LinhaMeta {
  id: number;
  usuario_id: number;
  titulo: string;
  descricao: string | null;
  valor_objetivo: number;
  valor_acumulado: number;
  data_criacao: string;
  prazo: string;
  status: StatusMeta;
}

interface LinhaMetaListada extends LinhaMeta {
  ultimo_registro_em: string | null;
}

function paraMeta(l: LinhaMeta): Meta {
  return {
    id: l.id,
    usuarioId: l.usuario_id,
    titulo: l.titulo,
    descricao: l.descricao,
    valorObjetivo: l.valor_objetivo,
    valorAcumulado: l.valor_acumulado,
    dataCriacao: l.data_criacao,
    prazo: l.prazo,
    status: l.status,
  };
}

export type NovaMeta = Omit<Meta, 'id'>;
export type AlteracaoMeta = Pick<Meta, 'id' | 'titulo' | 'descricao' | 'valorObjetivo' | 'prazo'>;

export interface ResumoDeMetas {
  totalGuardado: number;
  metasEmAndamento: number;
  metasConcluidas: number;
}

/** Único ponto de acesso à tabela `meta_financeira`. */
export class MetaRepository {
  private readonly db: Executor;

  constructor(db: Executor) {
    this.db = db;
  }

  async inserir(m: NovaMeta): Promise<number> {
    const r = await this.db.executar(
      `INSERT INTO meta_financeira
         (usuario_id, titulo, descricao, valor_objetivo, valor_acumulado, data_criacao, prazo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.usuarioId, m.titulo, m.descricao, m.valorObjetivo, m.valorAcumulado, m.dataCriacao, m.prazo, m.status],
    );
    return r.ultimoIdInserido;
  }

  async atualizar(m: AlteracaoMeta): Promise<void> {
    await this.db.executar(
      'UPDATE meta_financeira SET titulo = ?, descricao = ?, valor_objetivo = ?, prazo = ? WHERE id = ?',
      [m.titulo, m.descricao, m.valorObjetivo, m.prazo, m.id],
    );
  }

  async atualizarAcumulado(id: number, valorAcumulado: number, status: StatusMeta): Promise<void> {
    await this.db.executar('UPDATE meta_financeira SET valor_acumulado = ?, status = ? WHERE id = ?', [
      valorAcumulado,
      status,
      id,
    ]);
  }

  async excluir(id: number): Promise<void> {
    await this.db.executar('DELETE FROM meta_financeira WHERE id = ?', [id]);
  }

  async buscarPorId(id: number): Promise<Meta | null> {
    const l = await this.db.consultarUm<LinhaMeta>('SELECT * FROM meta_financeira WHERE id = ?', [id]);
    return l ? paraMeta(l) : null;
  }

  /** Metas do usuário (RN10). Sem `status`, traz todas: em andamento primeiro, por prazo. */
  async listarPorUsuario(usuarioId: number, status?: StatusMeta): Promise<MetaListada[]> {
    const filtro = status ? 'AND m.status = ?' : '';
    const parametros: (string | number)[] = status ? [usuarioId, status] : [usuarioId];
    const ordem =
      status === 'CONCLUIDA'
        ? 'ORDER BY ultimo_registro_em DESC, m.id DESC'
        : "ORDER BY CASE m.status WHEN 'EM_ANDAMENTO' THEN 0 ELSE 1 END, m.prazo ASC, m.id ASC";

    const linhas = await this.db.consultar<LinhaMetaListada>(
      `SELECT m.*,
              (SELECT MAX(r.data) FROM registro_progresso r WHERE r.meta_id = m.id) AS ultimo_registro_em
         FROM meta_financeira m
        WHERE m.usuario_id = ? ${filtro}
        ${ordem}`,
      parametros,
    );
    return linhas.map((l) => ({ ...paraMeta(l), ultimoRegistroEm: l.ultimo_registro_em }));
  }

  async resumoPorUsuario(usuarioId: number): Promise<ResumoDeMetas> {
    const l = await this.db.consultarUm<{ guardado: number; andamento: number; concluidas: number }>(
      `SELECT COALESCE(SUM(valor_acumulado), 0)                          AS guardado,
              COALESCE(SUM(CASE WHEN status = 'EM_ANDAMENTO' THEN 1 ELSE 0 END), 0) AS andamento,
              COALESCE(SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END), 0)    AS concluidas
         FROM meta_financeira
        WHERE usuario_id = ?`,
      [usuarioId],
    );
    return {
      totalGuardado: l?.guardado ?? 0,
      metasEmAndamento: l?.andamento ?? 0,
      metasConcluidas: l?.concluidas ?? 0,
    };
  }
}
