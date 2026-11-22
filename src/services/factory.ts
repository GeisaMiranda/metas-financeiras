import type { DatabaseService } from '../database/types';
import { AuthService } from './authService';
import { DesafioService } from './desafioService';
import { MetaService } from './metaService';
import type { PasswordHasher } from './passwordHasher';
import { PontuacaoService } from './pontuacaoService';
import { PreferenciasStorage, SessaoStorage } from './storage';
import type { KeyValueStorage } from './storage';
import { relogioPadrao } from './tipos';
import type { Relogio } from './tipos';

export interface DependenciasDosServicos {
  db: DatabaseService;
  hasher: PasswordHasher;
  armazenamento: KeyValueStorage;
  relogio?: Relogio;
}

export interface Servicos {
  db: DatabaseService;
  auth: AuthService;
  metas: MetaService;
  desafios: DesafioService;
  pontuacao: PontuacaoService;
  sessao: SessaoStorage;
  preferencias: PreferenciasStorage;
}

/**
 * Monta todos os serviços a partir das dependências (banco, hash de senha, armazenamento).
 * Não depende do Expo, por isso é usada tanto pelo app (container.ts) quanto pelos testes.
 */
export function criarServicos(dep: DependenciasDosServicos): Servicos {
  const relogio = dep.relogio ?? relogioPadrao;
  const sessao = new SessaoStorage(dep.armazenamento);
  return {
    db: dep.db,
    auth: new AuthService(dep.db, dep.hasher, sessao, relogio),
    metas: new MetaService(dep.db, relogio),
    desafios: new DesafioService(dep.db, relogio),
    pontuacao: new PontuacaoService(dep.db),
    sessao,
    preferencias: new PreferenciasStorage(dep.armazenamento),
  };
}
