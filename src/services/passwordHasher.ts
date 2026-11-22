/**
 * Proteção da senha (RNF09, RN17): a senha nunca é guardada como foi digitada.
 * Esta interface é implementada com expo-crypto no app (hasherExpo.ts) e com o
 * módulo crypto do Node nos testes.
 */
export interface PasswordHasher {
  /** Gera o texto protegido que vai para o banco (inclui um "sal" aleatório). */
  gerarHash(senha: string): Promise<string>;
  /** Confere se a senha digitada corresponde ao texto guardado. */
  verificar(senha: string, hashGuardado: string): Promise<boolean>;
}

/** Compara dois textos sem parar no primeiro caractere diferente. */
export function textosIguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}
