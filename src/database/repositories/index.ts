import type { Executor } from '../types';
import { DesafioRepository } from './desafioRepository';
import { MetaRepository } from './metaRepository';
import { ParticipacaoRepository } from './participacaoRepository';
import { RegistroRepository } from './registroRepository';
import { UsuarioRepository } from './usuarioRepository';

export { DesafioRepository, MetaRepository, ParticipacaoRepository, RegistroRepository, UsuarioRepository };

export interface Repositorios {
  usuarios: UsuarioRepository;
  metas: MetaRepository;
  registros: RegistroRepository;
  desafios: DesafioRepository;
  participacoes: ParticipacaoRepository;
}

/**
 * Cria todos os repositórios ligados a um mesmo Executor.
 * Dentro de uma transação, passe o Executor da transação: assim todos
 * os repositórios participam da mesma transação.
 */
export function criarRepositorios(db: Executor): Repositorios {
  return {
    usuarios: new UsuarioRepository(db),
    metas: new MetaRepository(db),
    registros: new RegistroRepository(db),
    desafios: new DesafioRepository(db),
    participacoes: new ParticipacaoRepository(db),
  };
}
