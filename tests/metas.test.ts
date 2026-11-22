import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RegraDeNegocioError } from '../src/services/errors';
import { reaisParaCentavos } from '../src/utils/money';
import { criarAmbiente, criarUsuario } from './helpers/ambiente';
import type { Ambiente } from './helpers/ambiente';

async function falha(promessa: Promise<unknown>): Promise<RegraDeNegocioError> {
  try {
    await promessa;
  } catch (erro) {
    assert.ok(erro instanceof RegraDeNegocioError, `esperava RegraDeNegocioError, veio: ${String(erro)}`);
    return erro;
  }
  assert.fail('deveria ter lançado um erro');
}

const R = reaisParaCentavos;

async function comMeta(objetivoReais = 1000) {
  const amb = await criarAmbiente();
  const usuario = await criarUsuario(amb);
  const meta = await amb.metas.criarMeta(usuario.id, { titulo: 'Viagem', valorObjetivo: R(objetivoReais), prazo: '2027-06-01' });
  return { amb, usuario, meta };
}

async function pontos(amb: Ambiente, usuarioId: number) {
  return amb.pontuacao.consultarTotal(usuarioId);
}

describe('criar meta (RF03, RF04, RF05, RN01, RN02, RN03)', () => {
  it('cria a meta com acumulado zero, em andamento e com id único', async () => {
    const amb = await criarAmbiente();
    const u = await criarUsuario(amb);
    const m1 = await amb.metas.criarMeta(u.id, { titulo: ' Viagem ', descricao: 'Praia', valorObjetivo: R(2000), prazo: '2027-01-10' });
    const m2 = await amb.metas.criarMeta(u.id, { titulo: 'Notebook', valorObjetivo: R(3500), prazo: '2027-03-10' });
    assert.equal(m1.titulo, 'Viagem');
    assert.equal(m1.valorAcumulado, 0);
    assert.equal(m1.status, 'EM_ANDAMENTO');
    assert.equal(m1.dataCriacao, '2026-11-23');
    assert.equal(m2.descricao, null);
    assert.notEqual(m1.id, m2.id);
  });

  it('recusa valor zero ou negativo (RN01)', async () => {
    const amb = await criarAmbiente();
    const u = await criarUsuario(amb);
    for (const valor of [0, -100, 10.5]) {
      const erro = await falha(amb.metas.criarMeta(u.id, { titulo: 'X', valorObjetivo: valor, prazo: '2027-01-10' }));
      assert.equal(erro.regra, 'RN01');
    }
  });

  it('recusa prazo que já passou, mas aceita o dia de hoje (RN03)', async () => {
    const amb = await criarAmbiente();
    const u = await criarUsuario(amb);
    const erro = await falha(amb.metas.criarMeta(u.id, { titulo: 'X', valorObjetivo: R(10), prazo: '2026-11-22' }));
    assert.equal(erro.regra, 'RN03');
    const hoje = await amb.metas.criarMeta(u.id, { titulo: 'Hoje', valorObjetivo: R(10), prazo: '2026-11-23' });
    assert.equal(hoje.prazo, '2026-11-23');
    await falha(amb.metas.criarMeta(u.id, { titulo: 'X', valorObjetivo: R(10), prazo: '2026-02-30' }));
  });

  it('recusa nome vazio ou grande demais', async () => {
    const amb = await criarAmbiente();
    const u = await criarUsuario(amb);
    await falha(amb.metas.criarMeta(u.id, { titulo: '   ', valorObjetivo: R(10), prazo: '2027-01-10' }));
    await falha(amb.metas.criarMeta(u.id, { titulo: 'a'.repeat(61), valorObjetivo: R(10), prazo: '2027-01-10' }));
  });
});

describe('registrar valor (RF06, RF07, RN04, RN05, RN07, RN11, RN12, RN13, RN14)', () => {
  it('soma os registros, calcula o acumulado e dá 10 pontos por registro', async () => {
    const { amb, usuario, meta } = await comMeta(1000);
    const r1 = await amb.metas.registrarValor(usuario.id, meta.id, R(100));
    const r2 = await amb.metas.registrarValor(usuario.id, meta.id, R(150));
    assert.equal(r1.meta.valorAcumulado, R(100));
    assert.equal(r2.meta.valorAcumulado, R(250));
    assert.equal(r2.meta.status, 'EM_ANDAMENTO');
    assert.equal(r1.pontosGanhos, 10);
    assert.equal(await pontos(amb, usuario.id), 20);

    const registros = await amb.metas.listarRegistros(usuario.id, meta.id);
    assert.equal(registros.length, 2);
    assert.equal(registros.reduce((s, r) => s + r.valor, 0), R(250));
  });

  it('recusa valor zero, negativo ou quebrado (RN07) sem alterar nada', async () => {
    const { amb, usuario, meta } = await comMeta();
    for (const valor of [0, -50, 1.5]) {
      const erro = await falha(amb.metas.registrarValor(usuario.id, meta.id, valor));
      assert.equal(erro.regra, 'RN07');
    }
    assert.equal((await amb.metas.buscarMeta(usuario.id, meta.id)).valorAcumulado, 0);
    assert.equal(await pontos(amb, usuario.id), 0);
  });

  it('conclui a meta ao atingir o objetivo e dá 100 pontos além dos 10 (RN05, RN14)', async () => {
    const { amb, usuario, meta } = await comMeta(1000);
    await amb.metas.registrarValor(usuario.id, meta.id, R(900));
    const final = await amb.metas.registrarValor(usuario.id, meta.id, R(100));
    assert.equal(final.metaConcluida, true);
    assert.equal(final.meta.status, 'CONCLUIDA');
    assert.equal(final.pontosGanhos, 110);
    assert.equal(await pontos(amb, usuario.id), 10 + 110);
  });

  it('permite passar do objetivo e conclui (RN12)', async () => {
    const { amb, usuario, meta } = await comMeta(1000);
    const r = await amb.metas.registrarValor(usuario.id, meta.id, R(1500));
    assert.equal(r.meta.valorAcumulado, R(1500));
    assert.equal(r.metaConcluida, true);
  });

  it('não aceita novos valores em meta concluída (RN06) e não dá pontos de novo', async () => {
    const { amb, usuario, meta } = await comMeta(100);
    await amb.metas.registrarValor(usuario.id, meta.id, R(100));
    const antes = await pontos(amb, usuario.id);
    const erro = await falha(amb.metas.registrarValor(usuario.id, meta.id, R(10)));
    assert.equal(erro.regra, 'RN06');
    assert.equal(await pontos(amb, usuario.id), antes);
  });

  it('separa metas em andamento e concluídas (RF11, RF12)', async () => {
    const { amb, usuario, meta } = await comMeta(100);
    const outra = await amb.metas.criarMeta(usuario.id, { titulo: 'Outra', valorObjetivo: R(500), prazo: '2027-01-01' });
    await amb.metas.registrarValor(usuario.id, meta.id, R(100));

    const andamento = await amb.metas.listarMetas(usuario.id, 'EM_ANDAMENTO');
    const concluidas = await amb.metas.listarMetas(usuario.id, 'CONCLUIDA');
    const todas = await amb.metas.listarMetas(usuario.id);
    assert.deepEqual(andamento.map((m) => m.id), [outra.id]);
    assert.deepEqual(concluidas.map((m) => m.id), [meta.id]);
    assert.ok(concluidas[0]?.ultimoRegistroEm);
    assert.equal(todas.length, 2);
    assert.equal(todas[0]?.id, outra.id, 'em andamento vem primeiro');
  });
});

describe('editar e excluir meta (RF09, RF10, RN18)', () => {
  it('edita uma meta em andamento', async () => {
    const { amb, usuario, meta } = await comMeta();
    const nova = await amb.metas.editarMeta(usuario.id, meta.id, { titulo: 'Viagem 2', descricao: 'Nova', valorObjetivo: R(2500), prazo: '2027-09-01' });
    assert.equal(nova.titulo, 'Viagem 2');
    assert.equal(nova.valorObjetivo, R(2500));
    assert.equal(nova.dataCriacao, meta.dataCriacao);
  });

  it('recusa editar com valor zero ou prazo antes da criação', async () => {
    const { amb, usuario, meta } = await comMeta();
    assert.equal((await falha(amb.metas.editarMeta(usuario.id, meta.id, { titulo: 'X', valorObjetivo: 0, prazo: '2027-01-01' }))).regra, 'RN01');
    assert.equal((await falha(amb.metas.editarMeta(usuario.id, meta.id, { titulo: 'X', valorObjetivo: R(10), prazo: '2026-11-22' }))).regra, 'RN03');
  });

  it('se baixar o objetivo até o que já foi guardado, conclui a meta', async () => {
    const { amb, usuario, meta } = await comMeta(1000);
    await amb.metas.registrarValor(usuario.id, meta.id, R(300));
    const antes = await pontos(amb, usuario.id);
    const editada = await amb.metas.editarMeta(usuario.id, meta.id, { titulo: 'Viagem', valorObjetivo: R(300), prazo: '2027-06-01' });
    assert.equal(editada.status, 'CONCLUIDA');
    assert.equal(await pontos(amb, usuario.id), antes + 100);
  });

  it('não edita meta concluída', async () => {
    const { amb, usuario, meta } = await comMeta(100);
    await amb.metas.registrarValor(usuario.id, meta.id, R(100));
    await falha(amb.metas.editarMeta(usuario.id, meta.id, { titulo: 'X', valorObjetivo: R(500), prazo: '2027-01-01' }));
  });

  it('exclui a meta e os registros dela, mantendo os pontos já ganhos (RN18)', async () => {
    const { amb, usuario, meta } = await comMeta();
    await amb.metas.registrarValor(usuario.id, meta.id, R(50));
    await amb.metas.registrarValor(usuario.id, meta.id, R(50));
    await amb.metas.excluirMeta(usuario.id, meta.id);

    assert.equal((await amb.metas.listarMetas(usuario.id)).length, 0);
    const sobra = await amb.db.consultarUm<{ total: number }>('SELECT COUNT(*) AS total FROM registro_progresso');
    assert.equal(sobra?.total, 0);
    assert.equal(await pontos(amb, usuario.id), 20, 'os pontos continuam');
  });
});

describe('cada usuário só vê as próprias metas (RN10)', () => {
  it('bloqueia ver, editar, excluir e registrar valor na meta de outro usuário', async () => {
    const { amb, usuario, meta } = await comMeta();
    const outro = await criarUsuario(amb, 'outro@exemplo.com');

    assert.equal((await amb.metas.listarMetas(outro.id)).length, 0);
    assert.equal((await falha(amb.metas.buscarMeta(outro.id, meta.id))).regra, 'RN10');
    assert.equal((await falha(amb.metas.listarRegistros(outro.id, meta.id))).regra, 'RN10');
    assert.equal((await falha(amb.metas.registrarValor(outro.id, meta.id, R(10)))).regra, 'RN10');
    assert.equal((await falha(amb.metas.editarMeta(outro.id, meta.id, { titulo: 'X', valorObjetivo: R(10), prazo: '2027-01-01' }))).regra, 'RN10');
    assert.equal((await falha(amb.metas.excluirMeta(outro.id, meta.id))).regra, 'RN10');

    assert.equal((await amb.metas.buscarMeta(usuario.id, meta.id)).valorAcumulado, 0);
  });
});

describe('resumo da tela inicial', () => {
  it('soma o que foi guardado e conta as metas', async () => {
    const { amb, usuario, meta } = await comMeta(100);
    await amb.metas.criarMeta(usuario.id, { titulo: 'B', valorObjetivo: R(500), prazo: '2027-01-01' });
    await amb.metas.registrarValor(usuario.id, meta.id, R(100));
    const resumo = await amb.metas.resumo(usuario.id);
    assert.equal(resumo.totalGuardado, R(100));
    assert.equal(resumo.metasEmAndamento, 1);
    assert.equal(resumo.metasConcluidas, 1);
    assert.equal(resumo.pontuacaoTotal, 110);
  });
});
