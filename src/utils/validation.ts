export const SENHA_MINIMA = 6;

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function textoVazio(texto: string | null | undefined): boolean {
  return texto === null || texto === undefined || texto.trim().length === 0;
}
