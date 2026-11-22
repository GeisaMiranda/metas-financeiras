import type { DatabaseService } from '../database/types';
import { criarRepositorios } from '../database/repositories';
import type { Repositorios } from '../database/repositories';
import { RegraDeNegocioError } from './errors';

/**
 * Soma pontos ao usuário usando os repositórios recebidos. É a função usada por dentro das
 * transações (registrar valor, concluir meta, concluir desafio), para que os pontos entrem
 * junto com o resto ou não entrem (RNF10).
 */
export async function concederPontos(
  repos: Pick<Repositorios, 'usuarios'>,
  usuarioId: number,
  pontos: number,
): Promise<void> {
  if (!Number.isInteger(pontos) || pontos <= 0) {
    throw new RegraDeNegocioError('RF16', 'A pontuação a conceder precisa ser maior que zero.');
  }
  await repos.usuarios.somarPontuacao(usuarioId, pontos);
}

/** Pontuação do usuário (RF16). */
export class PontuacaoService {
  private readonly db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async conceder(usuarioId: number, pontos: number): Promise<void> {
    await this.db.transacao(async (tx) => {
      await concederPontos(criarRepositorios(tx), usuarioId, pontos);
    });
  }

  async consultarTotal(usuarioId: number): Promise<number> {
    const usuario = await criarRepositorios(this.db).usuarios.buscarPorId(usuarioId);
    return usuario?.pontuacaoTotal ?? 0;
  }
}
