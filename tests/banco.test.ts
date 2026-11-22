import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { migrar, VERSAO_ATUAL_DO_BANCO } from '../src/database/migrations';
import { criarAmbiente, criarUsuario } from './helpers/ambiente';

async function deveFalhar(promessa: Promise<unknown>, trecho: RegExp) {
  try {
    await promessa;
  } catch (erro) {
    assert.match(String((erro as Error).message), trecho);
    return;
  }
  assert.fail('o banco deveria ter recusado');
}

describe('banco de dados (DER, RNF10)', () => {
  it('cria as 5 tabelas do DER', async () => {
    const amb = await criarAmbiente();
    const tabelas = await amb.db.consultar<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    assert.deepEqual(
      tabelas.map((t) => t.name),
      ['desafio', 'meta_financeira', 'participacao_desafio', 'registro_progresso', 'usuario'],
    );
  });

  it('rodar a migração de novo não quebra nem duplica nada', async () => {
    const amb = await criarAmbiente();
    await migrar(amb.banco);
    await migrar(amb.banco);
    const v = await amb.db.consultarUm<{ user_version: number }>('PRAGMA user_version');
    assert.equal(v?.user_version, VERSAO_ATUAL_DO_BANCO);
  });

  it('as colunas e tipos batem com o DER', async () => {
    const amb = await criarAmbiente();
    const colunas = async (t: string) =>
      (await amb.db.consultar<{ name: string; type: string }>(`PRAGMA table_info(${t})`)).map((c) => `${c.name}:${c.type}`);
    assert.deepEqual(await colunas('usuario'), ['id:INTEGER', 'nome:TEXT', 'email:TEXT', 'senha_hash:TEXT', 'pontuacao_total:INTEGER', 'data_cadastro:TEXT']);
    assert.deepEqual(await colunas('meta_financeira'), [
      'id:INTEGER', 'usuario_id:INTEGER', 'titulo:TEXT', 'descricao:TEXT', 'valor_objetivo:INTEGER',
      'valor_acumulado:INTEGER', 'data_criacao:TEXT', 'prazo:TEXT', 'status:TEXT',
    ]);
    assert.deepEqual(await colunas('registro_progresso'), ['id:INTEGER', 'meta_id:INTEGER', 'valor:INTEGER', 'data:TEXT']);
    assert.deepEqual(await colunas('desafio'), ['id:INTEGER', 'titulo:TEXT', 'descricao:TEXT', 'objetivo:INTEGER', 'prazo:TEXT', 'pontos_recompensa:INTEGER']);
    assert.deepEqual(await colunas('participacao_desafio'), ['id:INTEGER', 'usuario_id:INTEGER', 'desafio_id:INTEGER', 'progresso:INTEGER', 'status:TEXT', 'data_inicio:TEXT']);
  });

  it('o próprio banco recusa dados inválidos', async () => {
    const amb = await criarAmbiente();
    const u = await criarUsuario(amb);
    await deveFalhar(
      amb.db.executar("INSERT INTO usuario (nome, email, senha_hash, data_cadastro) VALUES ('X', 'geisa@exemplo.com', 'h', 'd')"),
      /UNIQUE/i,
    );
    await deveFalhar(
      amb.db.executar("INSERT INTO meta_financeira (usuario_id, titulo, valor_objetivo, data_criacao, prazo) VALUES (?, 'X', 0, '2026-11-23', '2027-01-01')", [u.id]),
      /CHECK/i,
    );
    await deveFalhar(
      amb.db.executar("INSERT INTO meta_financeira (usuario_id, titulo, valor_objetivo, data_criacao, prazo) VALUES (?, 'X', 100, '2026-11-23', '2026-11-01')", [u.id]),
      /CHECK/i,
    );
    await deveFalhar(
      amb.db.executar("INSERT INTO meta_financeira (usuario_id, titulo, valor_objetivo, data_criacao, prazo) VALUES (9999, 'X', 100, '2026-11-23', '2027-01-01')"),
      /FOREIGN KEY/i,
    );
    await deveFalhar(
      amb.db.executar("INSERT INTO registro_progresso (meta_id, valor, data) VALUES (1, -5, 'd')"),
      /CHECK|FOREIGN KEY/i,
    );
  });

  it('apagar a meta apaga os registros dela (ON DELETE CASCADE)', async () => {
    const amb = await criarAmbiente();
    const u = await criarUsuario(amb);
    const m = await amb.metas.criarMeta(u.id, { titulo: 'X', valorObjetivo: 10000, prazo: '2027-01-01' });
    await amb.metas.registrarValor(u.id, m.id, 500);
    await amb.db.executar('DELETE FROM meta_financeira WHERE id = ?', [m.id]);
    const r = await amb.db.consultarUm<{ total: number }>('SELECT COUNT(*) AS total FROM registro_progresso');
    assert.equal(r?.total, 0);
  });

  it('a transação desfaz tudo se algo falhar no meio (tudo ou nada)', async () => {
    const amb = await criarAmbiente();
    const u = await criarUsuario(amb);
    const m = await amb.metas.criarMeta(u.id, { titulo: 'X', valorObjetivo: 10000, prazo: '2027-01-01' });

    await assert.rejects(
      amb.db.transacao(async (tx) => {
        await tx.executar('INSERT INTO registro_progresso (meta_id, valor, data) VALUES (?, 500, ?)', [m.id, 'd']);
        await tx.executar('UPDATE usuario SET pontuacao_total = pontuacao_total + 10 WHERE id = ?', [u.id]);
        throw new Error('falha no meio');
      }),
      /falha no meio/,
    );

    const reg = await amb.db.consultarUm<{ total: number }>('SELECT COUNT(*) AS total FROM registro_progresso');
    assert.equal(reg?.total, 0);
    assert.equal(await amb.pontuacao.consultarTotal(u.id), 0);
  });
});
