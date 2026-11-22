import type { DatabaseService } from '../database/types';
import { criarRepositorios } from '../database/repositories';
import { desafioEncerrado, situacaoDoDesafio } from '../domain/desafioRegras';
import type { Desafio, DesafioComSituacao, ParticipacaoDesafio } from '../types';
import { hojeISO } from '../utils/date';
import { somarNaParticipacao } from './desafioProgresso';
import { RegraDeNegocioError } from './errors';
import { relogioPadrao } from './tipos';
import type { Relogio } from './tipos';

function montar(desafio: Desafio, participacao: ParticipacaoDesafio | null, hoje: string): DesafioComSituacao {
  return { ...desafio, participacao, situacao: situacaoDoDesafio(desafio, participacao, hoje) };
}

/** Desafios de economia: listar, participar e acompanhar (RF13, RF14, RF15). */
export class DesafioService {
  private readonly db: DatabaseService;
  private readonly relogio: Relogio;

  constructor(db: DatabaseService, relogio: Relogio = relogioPadrao) {
    this.db = db;
    this.relogio = relogio;
  }

  /** Todos os desafios, já com a situação de cada um para este usuário. */
  async listarDesafios(usuarioId: number): Promise<DesafioComSituacao[]> {
    const repos = criarRepositorios(this.db);
    const hoje = hojeISO(this.relogio());
    const [desafios, participacoes] = await Promise.all([
      repos.desafios.listarTodos(),
      repos.participacoes.listarPorUsuario(usuarioId),
    ]);
    return desafios.map((d) =>
      montar(d, participacoes.find((p) => p.desafioId === d.id) ?? null, hoje),
    );
  }

  async buscarDesafio(usuarioId: number, desafioId: number): Promise<DesafioComSituacao> {
    const repos = criarRepositorios(this.db);
    const desafio = await repos.desafios.buscarPorId(desafioId);
    if (!desafio) throw new RegraDeNegocioError('RF13', 'Desafio não encontrado.');
    const participacao = await repos.participacoes.buscarPorUsuarioEDesafio(usuarioId, desafioId);
    return montar(desafio, participacao, hojeISO(this.relogio()));
  }

  /** RF14. RN16: só uma participação por desafio. */
  async participar(usuarioId: number, desafioId: number): Promise<ParticipacaoDesafio> {
    const hoje = hojeISO(this.relogio());
    return this.db.transacao(async (tx) => {
      const repos = criarRepositorios(tx);
      const desafio = await repos.desafios.buscarPorId(desafioId);
      if (!desafio) throw new RegraDeNegocioError('RF14', 'Desafio não encontrado.');
      if (desafioEncerrado(desafio, hoje)) {
        throw new RegraDeNegocioError('RF14', 'Este desafio já foi encerrado.');
      }
      if (await repos.participacoes.buscarPorUsuarioEDesafio(usuarioId, desafioId)) {
        throw new RegraDeNegocioError('RN16', 'Você já participa (ou já participou) deste desafio.');
      }
      const id = await repos.participacoes.inserir({ usuarioId, desafioId, dataInicio: hoje });
      return {
        id,
        usuarioId,
        desafioId,
        progresso: 0,
        status: 'EM_ANDAMENTO',
        dataInicio: hoje,
      };
    });
  }

  /**
   * RF15. Soma `valor` ao progresso do desafio. No dia a dia isso acontece sozinho quando o
   * usuário registra valores nas metas (ver MetaService.registrarValor); este método permite
   * atualizar um desafio específico diretamente.
   * Devolve true se o desafio foi concluído agora.
   */
  async atualizarProgresso(usuarioId: number, desafioId: number, valor: number): Promise<boolean> {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new RegraDeNegocioError('RN07', 'O valor precisa ser maior que zero.');
    }
    const hoje = hojeISO(this.relogio());
    return this.db.transacao(async (tx) => {
      const repos = criarRepositorios(tx);
      const desafio = await repos.desafios.buscarPorId(desafioId);
      const participacao = await repos.participacoes.buscarPorUsuarioEDesafio(usuarioId, desafioId);
      if (!desafio || !participacao) {
        throw new RegraDeNegocioError('RF15', 'Você ainda não participa deste desafio.');
      }
      if (participacao.status === 'CONCLUIDO') {
        throw new RegraDeNegocioError('RN15', 'Este desafio já foi concluído.');
      }
      if (desafioEncerrado(desafio, hoje)) {
        throw new RegraDeNegocioError('RF15', 'Este desafio já foi encerrado.');
      }
      await somarNaParticipacao(repos, usuarioId, { participacao, desafio }, valor);
      const depois = await repos.participacoes.buscarPorUsuarioEDesafio(usuarioId, desafioId);
      return depois?.status === 'CONCLUIDO';
    });
  }
}
