import type { Desafio, ParticipacaoDesafio, SituacaoDesafio } from '../types';

/** RN08: cada desafio tem sua condição — aqui, juntar o valor `objetivo` dentro do prazo. */
export function verificarConclusao(
  participacao: Pick<ParticipacaoDesafio, 'progresso'>,
  desafio: Pick<Desafio, 'objetivo'>,
): boolean {
  return desafio.objetivo > 0 && participacao.progresso >= desafio.objetivo;
}

/** O desafio está encerrado quando o prazo já passou. */
export function desafioEncerrado(desafio: Pick<Desafio, 'prazo'>, hoje: string): boolean {
  return desafio.prazo < hoje;
}

export function situacaoDoDesafio(
  desafio: Pick<Desafio, 'prazo'>,
  participacao: Pick<ParticipacaoDesafio, 'status'> | null,
  hoje: string,
): SituacaoDesafio {
  if (participacao) {
    if (participacao.status === 'CONCLUIDO') return 'CONCLUIDO';
    return desafioEncerrado(desafio, hoje) ? 'ENCERRADO' : 'EM_ANDAMENTO';
  }
  return desafioEncerrado(desafio, hoje) ? 'ENCERRADO' : 'DISPONIVEL';
}

export function fracaoDoDesafio(
  participacao: Pick<ParticipacaoDesafio, 'progresso'>,
  desafio: Pick<Desafio, 'objetivo'>,
): number {
  if (desafio.objetivo <= 0) return 0;
  return Math.max(0, Math.min(1, participacao.progresso / desafio.objetivo));
}
