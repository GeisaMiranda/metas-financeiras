import type { Executor } from '../types';
import type { Desafio } from '../../types';

interface LinhaDesafio {
  id: number;
  titulo: string;
  descricao: string;
  objetivo: number;
  prazo: string;
  pontos_recompensa: number;
}

export function paraDesafio(l: LinhaDesafio): Desafio {
  return {
    id: l.id,
    titulo: l.titulo,
    descricao: l.descricao,
    objetivo: l.objetivo,
    prazo: l.prazo,
    pontosRecompensa: l.pontos_recompensa,
  };
}

/** Único ponto de acesso à tabela `desafio`. */
export class DesafioRepository {
  private readonly db: Executor;

  constructor(db: Executor) {
    this.db = db;
  }

  async listarTodos(): Promise<Desafio[]> {
    const linhas = await this.db.consultar<LinhaDesafio>('SELECT * FROM desafio ORDER BY objetivo ASC, id ASC');
    return linhas.map(paraDesafio);
  }

  async buscarPorId(id: number): Promise<Desafio | null> {
    const l = await this.db.consultarUm<LinhaDesafio>('SELECT * FROM desafio WHERE id = ?', [id]);
    return l ? paraDesafio(l) : null;
  }
}
