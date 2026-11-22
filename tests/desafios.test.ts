import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DESAFIOS_INICIAIS } from '../src/database/seed';
import { RegraDeNegocioError } from '../src/services/errors';
import { reaisParaCentavos } from '../src/utils/money';
import { criarAmbiente, criarUsuario } from './helpers/ambiente';

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

async function preparar() {
  const amb = await criarAmbiente();
  const usuario = await criarUsuario(amb);
  const meta = await amb.metas.criarMeta(usuario.id, { titulo: 'Reserva', valorObjetivo: R(5000), prazo: '2027-12-01' });
  const desafios = await amb.desafios.listarDesafios(usuario.id);
  const porTitulo = (t: string) => {
    const d = desafios.find((x) => x.titulo === t);
    assert.ok(d, `desafio ${t} não encontrado`);
    return d;
  };
  return { amb, usuario, meta, porTitulo };
}

describe('desafios (RF13, RF14, RF15, RN08, RN09, RN15, RN16)', () => {
  it('carrega os desafios iniciais uma única vez', async () => {
    const amb = await criarAmbiente();
    const { carregarDesafiosIniciais } = await import('../src/database/seed');
    await carregarDesafiosIniciais(amb.banco, '2026-11-23');
    const u = await criarUsuario(amb);
    const lista = await amb.desafios.listarDesafios(u.id);
    assert.equal(lista.length, DESAFIOS_INICIAIS.length);
    assert.ok(lista.every((d) => d.situacao === 'DISPONIVEL' && d.participacao === null));
  });

  it('participa de um desafio começando com progresso zero (RN09)', async () => {
    const { amb, usuario, porTitulo } = await preparar();
    const d = porTitulo('Primeiro passo');
    const p = await amb.desafios.participar(usuario.id, d.id);
    assert.equal(p.progresso, 0);
    assert.equal(p.status, 'EM_ANDAMENTO');
    const depois = await amb.desafios.buscarDesafio(usuario.id, d.id);
    assert.equal(depois.situacao, 'EM_ANDAMENTO');
  });

  it('não deixa participar duas vezes do mesmo desafio (RN16)', async () => {
    const { amb, usuario, porTitulo } = await preparar();
    const d = porTitulo('Primeiro passo');
    await amb.desafios.participar(usuario.id, d.id);
    assert.equal((await falha(amb.desafios.participar(usuario.id, d.id))).regra, 'RN16');
  });

  it('o progresso do desafio anda sozinho ao registrar valores nas metas', async () => {
    const { amb, usuario, meta, porTitulo } = await preparar();
    const d = porTitulo('Cofrinho de R$ 100');
    await amb.desafios.participar(usuario.id, d.id);
    await amb.metas.registrarValor(usuario.id, meta.id, R(40));
    const meio = await amb.desafios.buscarDesafio(usuario.id, d.id);
    assert.equal(meio.participacao?.progresso, R(40));
    assert.equal(meio.participacao?.status, 'EM_ANDAMENTO');
  });

  it('conclui o desafio e dá a recompensa uma única vez (RN15)', async () => {
    const { amb, usuario, meta, porTitulo } = await preparar();
    const d = porTitulo('Primeiro passo'); // R$ 50, 30 pontos
    await amb.desafios.participar(usuario.id, d.id);

    const r1 = await amb.metas.registrarValor(usuario.id, meta.id, R(50));
    assert.deepEqual(r1.desafiosConcluidos.map((x) => x.titulo), ['Primeiro passo']);
    assert.equal(r1.pontosGanhos, 10 + 30);
    assert.equal(await amb.pontuacao.consultarTotal(usuario.id), 40);
    assert.equal((await amb.desafios.buscarDesafio(usuario.id, d.id)).situacao, 'CONCLUIDO');

    const r2 = await amb.metas.registrarValor(usuario.id, meta.id, R(50));
    assert.equal(r2.desafiosConcluidos.length, 0);
    assert.equal(r2.pontosGanhos, 10, 'não ganha a recompensa de novo');
    assert.equal(await amb.pontuacao.consultarTotal(usuario.id), 50);
  });

  it('um mesmo valor conta para vários desafios em andamento', async () => {
    const { amb, usuario, meta, porTitulo } = await preparar();
    await amb.desafios.participar(usuario.id, porTitulo('Primeiro passo').id);
    await amb.desafios.participar(usuario.id, porTitulo('Cofrinho de R$ 100').id);
    const r = await amb.metas.registrarValor(usuario.id, meta.id, R(100));
    assert.equal(r.desafiosConcluidos.length, 2);
    assert.equal(r.pontosGanhos, 10 + 30 + 50);
  });

  it('valores registrados ANTES de participar não contam', async () => {
    const { amb, usuario, meta, porTitulo } = await preparar();
    await amb.metas.registrarValor(usuario.id, meta.id, R(500));
    const d = porTitulo('Primeiro passo');
    await amb.desafios.participar(usuario.id, d.id);
    assert.equal((await amb.desafios.buscarDesafio(usuario.id, d.id)).participacao?.progresso, 0);
  });

  it('não conta valores depois do prazo e não deixa participar de desafio encerrado', async () => {
    const { amb, usuario, meta, porTitulo } = await preparar();
    const d = porTitulo('Primeiro passo'); // prazo: 30 dias a partir de 23/11/2026 = 23/12/2026
    await amb.desafios.participar(usuario.id, d.id);

    amb.definirDia(2026, 12, 24); // um dia depois do prazo
    const r = await amb.metas.registrarValor(usuario.id, meta.id, R(50));
    assert.equal(r.desafiosConcluidos.length, 0);
    const depois = await amb.desafios.buscarDesafio(usuario.id, d.id);
    assert.equal(depois.participacao?.progresso, 0);
    assert.equal(depois.situacao, 'ENCERRADO');

    const outro = porTitulo('Cofrinho de R$ 100');
    await amb.desafios.participar(usuario.id, outro.id).then(
      () => assert.fail('o desafio também já está encerrado'),
      (e) => assert.ok(e instanceof RegraDeNegocioError),
    );
  });

  it('atualiza o progresso de um desafio direto (atualizarProgresso)', async () => {
    const { amb, usuario, porTitulo } = await preparar();
    const d = porTitulo('Primeiro passo');
    await falha(amb.desafios.atualizarProgresso(usuario.id, d.id, R(10))); // ainda não participa
    await amb.desafios.participar(usuario.id, d.id);
    assert.equal(await amb.desafios.atualizarProgresso(usuario.id, d.id, R(20)), false);
    assert.equal(await amb.desafios.atualizarProgresso(usuario.id, d.id, R(30)), true);
    assert.equal(await amb.pontuacao.consultarTotal(usuario.id), 30);
    await falha(amb.desafios.atualizarProgresso(usuario.id, d.id, R(1)));
    await falha(amb.desafios.atualizarProgresso(usuario.id, d.id, 0));
  });

  it('cada usuário tem o próprio progresso nos desafios (RN09)', async () => {
    const { amb, usuario, porTitulo } = await preparar();
    const outro = await criarUsuario(amb, 'outro@exemplo.com');
    const d = porTitulo('Primeiro passo');
    await amb.desafios.participar(usuario.id, d.id);
    assert.equal((await amb.desafios.buscarDesafio(outro.id, d.id)).situacao, 'DISPONIVEL');
  });
});
