import type { DatabaseService } from '../database/types';
import { criarRepositorios } from '../database/repositories';
import type { Repositorios } from '../database/repositories';
import { estaConcluida, PONTOS_POR_META_CONCLUIDA, PONTOS_POR_REGISTRO } from '../domain/metaRegras';
import type {
  DadosMeta,
  Meta,
  MetaListada,
  RegistroProgresso,
  ResultadoRegistroValor,
  ResumoUsuario,
  StatusMeta,
} from '../types';
import { agoraISO, dataISOValida, formatarData, hojeISO } from '../utils/date';
import { aplicarValorNosDesafios } from './desafioProgresso';
import { RegraDeNegocioError } from './errors';
import { concederPontos } from './pontuacaoService';
import { relogioPadrao } from './tipos';
import type { Relogio } from './tipos';

const TAMANHO_MAXIMO_TITULO = 60;
const TAMANHO_MAXIMO_DESCRICAO = 200;

interface DadosValidados {
  titulo: string;
  descricao: string | null;
  valorObjetivo: number;
  prazo: string;
}

/** Busca a meta garantindo que ela é do usuário (RN10). */
async function carregarMetaDoUsuario(repos: Repositorios, usuarioId: number, metaId: number): Promise<Meta> {
  const meta = await repos.metas.buscarPorId(metaId);
  if (!meta || meta.usuarioId !== usuarioId) {
    throw new RegraDeNegocioError('RN10', 'Meta não encontrada.');
  }
  return meta;
}

/** Metas: criar, editar, excluir, registrar valores e consultar (RF03 a RF12). */
export class MetaService {
  private readonly db: DatabaseService;
  private readonly relogio: Relogio;

  constructor(db: DatabaseService, relogio: Relogio = relogioPadrao) {
    this.db = db;
    this.relogio = relogio;
  }

  private validar(dados: DadosMeta, dataCriacao: string, aoCriar: boolean): DadosValidados {
    const titulo = dados.titulo.trim();
    if (titulo.length === 0) throw new RegraDeNegocioError('RF03', 'Informe o nome da meta.');
    if (titulo.length > TAMANHO_MAXIMO_TITULO) {
      throw new RegraDeNegocioError('RF03', `O nome da meta pode ter até ${TAMANHO_MAXIMO_TITULO} caracteres.`);
    }

    const descricaoTexto = (dados.descricao ?? '').trim();
    if (descricaoTexto.length > TAMANHO_MAXIMO_DESCRICAO) {
      throw new RegraDeNegocioError('RF03', `A descrição pode ter até ${TAMANHO_MAXIMO_DESCRICAO} caracteres.`);
    }

    // RN01: valor da meta maior que zero.
    if (!Number.isInteger(dados.valorObjetivo) || dados.valorObjetivo <= 0) {
      throw new RegraDeNegocioError('RN01', 'O valor da meta precisa ser maior que zero.');
    }

    if (!dataISOValida(dados.prazo)) {
      throw new RegraDeNegocioError('RF05', 'Informe um prazo válido (dia/mês/ano).');
    }
    // RN03: prazo não pode ser anterior à data de criação.
    if (dados.prazo < dataCriacao) {
      throw new RegraDeNegocioError(
        'RN03',
        aoCriar
          ? 'O prazo da meta não pode ser uma data que já passou.'
          : `O prazo não pode ser anterior à data de criação da meta (${formatarData(dataCriacao)}).`,
      );
    }

    return {
      titulo,
      descricao: descricaoTexto.length > 0 ? descricaoTexto : null,
      valorObjetivo: dados.valorObjetivo,
      prazo: dados.prazo,
    };
  }

  /** RF03, RF04, RF05. A meta nasce com valor acumulado zero e status "em andamento". */
  async criarMeta(usuarioId: number, dados: DadosMeta): Promise<Meta> {
    const hoje = hojeISO(this.relogio());
    const v = this.validar(dados, hoje, true);

    return this.db.transacao(async (tx) => {
      const repos = criarRepositorios(tx);
      if (!(await repos.usuarios.buscarPorId(usuarioId))) {
        throw new RegraDeNegocioError('RN10', 'Usuário não encontrado.');
      }
      const id = await repos.metas.inserir({
        usuarioId,
        titulo: v.titulo,
        descricao: v.descricao,
        valorObjetivo: v.valorObjetivo,
        valorAcumulado: 0,
        dataCriacao: hoje,
        prazo: v.prazo,
        status: 'EM_ANDAMENTO',
      });
      return carregarMetaDoUsuario(repos, usuarioId, id);
    });
  }

  /** RF09. Só metas em andamento podem ser editadas. */
  async editarMeta(usuarioId: number, metaId: number, dados: DadosMeta): Promise<Meta> {
    return this.db.transacao(async (tx) => {
      const repos = criarRepositorios(tx);
      const meta = await carregarMetaDoUsuario(repos, usuarioId, metaId);
      if (meta.status === 'CONCLUIDA') {
        throw new RegraDeNegocioError('RN06', 'Metas concluídas não podem ser editadas.');
      }
      const v = this.validar(dados, meta.dataCriacao, false);
      await repos.metas.atualizar({ id: meta.id, titulo: v.titulo, descricao: v.descricao, valorObjetivo: v.valorObjetivo, prazo: v.prazo });

      // Se o novo objetivo já foi alcançado pelo que está guardado, a meta é concluída (RN05).
      if (estaConcluida({ valorAcumulado: meta.valorAcumulado, valorObjetivo: v.valorObjetivo })) {
        await repos.metas.atualizarAcumulado(meta.id, meta.valorAcumulado, 'CONCLUIDA');
        await concederPontos(repos, usuarioId, PONTOS_POR_META_CONCLUIDA);
      }
      return carregarMetaDoUsuario(repos, usuarioId, metaId);
    });
  }

  /** RF10. Os registros da meta são apagados junto; os pontos já ganhos continuam (RN18). */
  async excluirMeta(usuarioId: number, metaId: number): Promise<void> {
    await this.db.transacao(async (tx) => {
      const repos = criarRepositorios(tx);
      const meta = await carregarMetaDoUsuario(repos, usuarioId, metaId);
      await repos.registros.excluirPorMeta(meta.id);
      await repos.metas.excluir(meta.id);
    });
  }

  /**
   * RF06, RF07, RF11, RF15, RF16. Tudo em uma transação:
   * grava o registro, recalcula o acumulado (RN11), dá os pontos (RN13), conclui a meta se
   * atingiu o objetivo (RN05, RN14) e atualiza os desafios em andamento (RN15).
   */
  async registrarValor(usuarioId: number, metaId: number, valor: number): Promise<ResultadoRegistroValor> {
    // RN07: o valor registrado precisa ser maior que zero.
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new RegraDeNegocioError('RN07', 'O valor registrado precisa ser maior que zero.');
    }
    const agora = this.relogio();

    return this.db.transacao(async (tx) => {
      const repos = criarRepositorios(tx);
      const meta = await carregarMetaDoUsuario(repos, usuarioId, metaId);
      if (meta.status === 'CONCLUIDA') {
        throw new RegraDeNegocioError('RN06', 'Esta meta já foi concluída e não aceita novos valores.');
      }

      await repos.registros.inserir({ metaId: meta.id, valor, data: agoraISO(agora) });
      const acumulado = await repos.registros.somarPorMeta(meta.id); // RN11
      const concluida = estaConcluida({ valorAcumulado: acumulado, valorObjetivo: meta.valorObjetivo });
      const status: StatusMeta = concluida ? 'CONCLUIDA' : 'EM_ANDAMENTO';
      await repos.metas.atualizarAcumulado(meta.id, acumulado, status);

      let pontos = PONTOS_POR_REGISTRO; // RN13
      await concederPontos(repos, usuarioId, PONTOS_POR_REGISTRO);
      if (concluida) {
        pontos += PONTOS_POR_META_CONCLUIDA; // RN14: uma vez só, pois meta concluída não aceita mais valores
        await concederPontos(repos, usuarioId, PONTOS_POR_META_CONCLUIDA);
      }

      const desafios = await aplicarValorNosDesafios(repos, usuarioId, valor, hojeISO(agora));
      pontos += desafios.pontosGanhos;

      return {
        meta: await carregarMetaDoUsuario(repos, usuarioId, meta.id),
        pontosGanhos: pontos,
        metaConcluida: concluida,
        desafiosConcluidos: desafios.desafiosConcluidos,
      };
    });
  }

  /** Lista as metas do usuário (RF08, RF11, RF12). */
  async listarMetas(usuarioId: number, status?: StatusMeta): Promise<MetaListada[]> {
    return criarRepositorios(this.db).metas.listarPorUsuario(usuarioId, status);
  }

  async buscarMeta(usuarioId: number, metaId: number): Promise<Meta> {
    return carregarMetaDoUsuario(criarRepositorios(this.db), usuarioId, metaId);
  }

  async listarRegistros(usuarioId: number, metaId: number): Promise<RegistroProgresso[]> {
    const repos = criarRepositorios(this.db);
    await carregarMetaDoUsuario(repos, usuarioId, metaId);
    return repos.registros.listarPorMeta(metaId);
  }

  /** Números da tela inicial. */
  async resumo(usuarioId: number): Promise<ResumoUsuario> {
    const repos = criarRepositorios(this.db);
    const metas = await repos.metas.resumoPorUsuario(usuarioId);
    const usuario = await repos.usuarios.buscarPorId(usuarioId);
    return { ...metas, pontuacaoTotal: usuario?.pontuacaoTotal ?? 0 };
  }
}
