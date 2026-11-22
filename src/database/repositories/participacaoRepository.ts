import type { Executor } from '../types';
import type { Desafio, ParticipacaoDesafio, StatusDesafio } from '../../types';
import { paraDesafio } from './desafioRepository';

interface LinhaParticipacao {
  id: number;
  usuario_id: number;
  desafio_id: number;
  progresso: number;
  status: StatusDesafio;
  data_inicio: string;
}

interface LinhaParticipacaoComDesafio extends LinhaParticipacao {
  d_titulo: string;
  d_descricao: string;
  d_objetivo: number;
  d_prazo: string;
  d_pontos_recompensa: number;
}

function paraParticipacao(l: LinhaParticipacao): ParticipacaoDesafio {
  return {
    id: l.id,
    usuarioId: l.usuario_id,
    desafioId: l.desafio_id,
    progresso: l.progresso,
    status: l.status,
    dataInicio: l.data_inicio,
  };
}

export interface NovaParticipacao {
  usuarioId: number;
  desafioId: number;
  dataInicio: string;
}

export interface ParticipacaoComDesafio {
  participacao: ParticipacaoDesafio;
  desafio: Desafio;
}

/** Único ponto de acesso à tabela `participacao_desafio`. */
export class ParticipacaoRepository {
  private readonly db: Executor;

  constructor(db: Executor) {
    this.db = db;
  }

  async inserir(nova: NovaParticipacao): Promise<number> {
    const r = await this.db.executar(
      "INSERT INTO participacao_desafio (usuario_id, desafio_id, progresso, status, data_inicio) VALUES (?, ?, 0, 'EM_ANDAMENTO', ?)",
      [nova.usuarioId, nova.desafioId, nova.dataInicio],
    );
    return r.ultimoIdInserido;
  }

  async atualizar(p: Pick<ParticipacaoDesafio, 'id' | 'progresso' | 'status'>): Promise<void> {
    await this.db.executar('UPDATE participacao_desafio SET progresso = ?, status = ? WHERE id = ?', [
      p.progresso,
      p.status,
      p.id,
    ]);
  }

  async buscarPorUsuarioEDesafio(usuarioId: number, desafioId: number): Promise<ParticipacaoDesafio | null> {
    const l = await this.db.consultarUm<LinhaParticipacao>(
      'SELECT * FROM participacao_desafio WHERE usuario_id = ? AND desafio_id = ?',
      [usuarioId, desafioId],
    );
    return l ? paraParticipacao(l) : null;
  }

  async listarPorUsuario(usuarioId: number): Promise<ParticipacaoDesafio[]> {
    const linhas = await this.db.consultar<LinhaParticipacao>(
      'SELECT * FROM participacao_desafio WHERE usuario_id = ?',
      [usuarioId],
    );
    return linhas.map(paraParticipacao);
  }

  /** Participações ainda em andamento, já com os dados do desafio (usado ao registrar valores). */
  async listarEmAndamentoComDesafio(usuarioId: number): Promise<ParticipacaoComDesafio[]> {
    const linhas = await this.db.consultar<LinhaParticipacaoComDesafio>(
      `SELECT p.*,
              d.titulo            AS d_titulo,
              d.descricao         AS d_descricao,
              d.objetivo          AS d_objetivo,
              d.prazo             AS d_prazo,
              d.pontos_recompensa AS d_pontos_recompensa
         FROM participacao_desafio p
         JOIN desafio d ON d.id = p.desafio_id
        WHERE p.usuario_id = ? AND p.status = 'EM_ANDAMENTO'
        ORDER BY p.id ASC`,
      [usuarioId],
    );
    return linhas.map((l) => ({
      participacao: paraParticipacao(l),
      desafio: paraDesafio({
        id: l.desafio_id,
        titulo: l.d_titulo,
        descricao: l.d_descricao,
        objetivo: l.d_objetivo,
        prazo: l.d_prazo,
        pontos_recompensa: l.d_pontos_recompensa,
      }),
    }));
  }
}
