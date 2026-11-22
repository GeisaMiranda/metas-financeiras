import type { Meta } from '../types';

/** Pontuação do sistema (RN13, RN14). Valores iniciais, fáceis de ajustar. */
export const PONTOS_POR_REGISTRO = 10;
export const PONTOS_POR_META_CONCLUIDA = 100;
/** A cada quantos pontos o usuário sobe de nível (só para a tela). */
export const PONTOS_POR_NIVEL = 100;

type DadosProgresso = Pick<Meta, 'valorAcumulado' | 'valorObjetivo'>;

/**
 * RN04: progresso = valor acumulado ÷ valor objetivo × 100.
 * RN12: o progresso mostrado nunca passa de 100%.
 * Usa arredondamento para baixo: só mostra 100% quando a meta realmente foi atingida.
 */
export function calcularProgresso(meta: DadosProgresso): number {
  if (meta.valorObjetivo <= 0) return 0;
  const pct = Math.floor((meta.valorAcumulado * 100) / meta.valorObjetivo);
  return Math.max(0, Math.min(100, pct));
}

/** Fração de 0 a 1, para desenhar a barra de progresso. */
export function fracaoProgresso(meta: DadosProgresso): number {
  if (meta.valorObjetivo <= 0) return 0;
  return Math.max(0, Math.min(1, meta.valorAcumulado / meta.valorObjetivo));
}

/** RN05: a meta está concluída quando o valor acumulado atinge o objetivo. */
export function estaConcluida(meta: DadosProgresso): boolean {
  return meta.valorObjetivo > 0 && meta.valorAcumulado >= meta.valorObjetivo;
}

/** Quanto ainda falta (nunca negativo). */
export function valorRestante(meta: DadosProgresso): number {
  return Math.max(0, meta.valorObjetivo - meta.valorAcumulado);
}

export function nivelDaPontuacao(pontos: number): number {
  return Math.floor(Math.max(0, pontos) / PONTOS_POR_NIVEL) + 1;
}
