/**
 * Funções de dinheiro. Todo valor é tratado em CENTAVOS (inteiro) para
 * evitar erros de arredondamento de números decimais.
 */

/** 123456 -> "R$ 1.234,56" */
export function formatarReais(centavos: number): string {
  const negativo = centavos < 0;
  const abs = Math.abs(Math.trunc(centavos));
  const reais = Math.floor(abs / 100);
  const resto = abs % 100;
  const reaisComPontos = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const texto = `R$ ${reaisComPontos},${String(resto).padStart(2, '0')}`;
  return negativo ? `-${texto}` : texto;
}

/** Pega só os dígitos do texto digitado e devolve como centavos. "1.234,56" -> 123456 */
export function digitosParaCentavos(texto: string): number {
  const digitos = texto.replace(/\D/g, '');
  if (digitos === '') return 0;
  // limita a 12 dígitos para não estourar o inteiro seguro
  return parseInt(digitos.slice(0, 12), 10);
}

/** Valor em reais (ex.: 50) para centavos (5000). */
export function reaisParaCentavos(reais: number): number {
  return Math.round(reais * 100);
}
