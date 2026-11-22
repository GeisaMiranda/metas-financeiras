import * as Crypto from 'expo-crypto';
import { textosIguais } from './passwordHasher';
import type { PasswordHasher } from './passwordHasher';

const PREFIXO = 'sha256';

function paraHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function resumo(sal: string, senha: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${sal}:${senha}`);
}

/**
 * Hash da senha com SHA-256 + sal aleatório (expo-crypto).
 * Formato guardado: "sha256$<sal>$<hash>".
 *
 * Observação: para um app real em produção, o ideal é um algoritmo feito para senhas
 * (bcrypt/argon2) rodando em um servidor. Como o app é 100% offline, SHA-256 com sal
 * já cumpre o requisito de não guardar a senha em texto puro.
 */
export class HasherExpo implements PasswordHasher {
  async gerarHash(senha: string): Promise<string> {
    const sal = paraHex(await Crypto.getRandomBytesAsync(16));
    return `${PREFIXO}$${sal}$${await resumo(sal, senha)}`;
  }

  async verificar(senha: string, hashGuardado: string): Promise<boolean> {
    const partes = hashGuardado.split('$');
    if (partes.length !== 3 || partes[0] !== PREFIXO) return false;
    const [, sal, esperado] = partes as [string, string, string];
    return textosIguais(await resumo(sal, senha), esperado);
  }
}
