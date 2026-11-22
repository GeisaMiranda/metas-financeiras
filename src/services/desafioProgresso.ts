import type { Repositorios } from '../database/repositories';
import type { ParticipacaoComDesafio } from '../database/repositories/participacaoRepository';
import { desafioEncerrado, verificarConclusao } from '../domain/desafioRegras';
import type { Desafio } from '../types';
import { concederPontos } from './pontuacaoService';

export interface ResultadoDesafios {
  desafiosConcluidos: Desafio[];
  pontosGanhos: number;
}

/**
 * Soma um valor ao progresso de UMA participação e, se o desafio foi cumprido (RN08),
 * conclui e dá a recompensa uma única vez (RN15). Deve rodar dentro de uma transação.
 * Devolve os pontos ganhos (0 se ainda não concluiu).
 */
export async function somarNaParticipacao(
  repos: Repositorios,
  usuarioId: number,
  item: ParticipacaoComDesafio,
  valor: number,
): Promise<number> {
  const { participacao, desafio } = item;
  const novoProgresso = participacao.progresso + valor;
  const concluiu = verificarConclusao({ progresso: novoProgresso }, desafio);

  await repos.participacoes.atualizar({
    id: participacao.id,
    progresso: novoProgresso,
    status: concluiu ? 'CONCLUIDO' : 'EM_ANDAMENTO',
  });

  if (!concluiu) return 0;
  if (desafio.pontosRecompensa > 0) {
    await concederPontos(repos, usuarioId, desafio.pontosRecompensa);
  }
  return desafio.pontosRecompensa;
}

/**
 * Quando o usuário registra um valor em uma meta, esse valor também conta para todos os
 * desafios em andamento dele cujo prazo ainda não passou (RF15).
 */
export async function aplicarValorNosDesafios(
  repos: Repositorios,
  usuarioId: number,
  valor: number,
  hoje: string,
): Promise<ResultadoDesafios> {
  const emAndamento = await repos.participacoes.listarEmAndamentoComDesafio(usuarioId);
  const resultado: ResultadoDesafios = { desafiosConcluidos: [], pontosGanhos: 0 };

  for (const item of emAndamento) {
    if (desafioEncerrado(item.desafio, hoje)) continue;
    const pontos = await somarNaParticipacao(repos, usuarioId, item, valor);
    const progressoFinal = item.participacao.progresso + valor;
    if (verificarConclusao({ progresso: progressoFinal }, item.desafio)) {
      resultado.desafiosConcluidos.push(item.desafio);
      resultado.pontosGanhos += pontos;
    }
  }
  return resultado;
}
