import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RegraDeNegocioError } from '../src/services/errors';
import { criarAmbiente } from './helpers/ambiente';

async function falha(promessa: Promise<unknown>): Promise<RegraDeNegocioError> {
  try {
    await promessa;
  } catch (erro) {
    assert.ok(erro instanceof RegraDeNegocioError, `esperava RegraDeNegocioError, veio: ${String(erro)}`);
    return erro;
  }
  assert.fail('deveria ter lançado um erro');
}

describe('cadastro e login (RF01, RF02, RN17)', () => {
  it('cadastra um usuário e já deixa a sessão aberta', async () => {
    const amb = await criarAmbiente();
    const u = await amb.auth.cadastrar({ nome: ' Geisa ', email: ' Geisa@Exemplo.com ', senha: 'senha123' });
    assert.equal(u.nome, 'Geisa');
    assert.equal(u.email, 'geisa@exemplo.com');
    assert.equal(u.pontuacaoTotal, 0);
    assert.equal((await amb.auth.usuarioLogado())?.id, u.id);
  });

  it('guarda a senha só como hash (RN17, RNF09)', async () => {
    const amb = await criarAmbiente();
    await amb.auth.cadastrar({ nome: 'Geisa', email: 'g@exemplo.com', senha: 'senha123' });
    const linha = await amb.db.consultarUm<{ senha_hash: string }>('SELECT senha_hash FROM usuario');
    assert.ok(linha);
    assert.notEqual(linha.senha_hash, 'senha123');
    assert.ok(!linha.senha_hash.includes('senha123'));
  });

  it('não deixa repetir o e-mail, mesmo com maiúsculas (RN17)', async () => {
    const amb = await criarAmbiente();
    await amb.auth.cadastrar({ nome: 'Geisa', email: 'g@exemplo.com', senha: 'senha123' });
    const erro = await falha(amb.auth.cadastrar({ nome: 'Outra', email: 'G@EXEMPLO.com', senha: 'outrasenha' }));
    assert.equal(erro.regra, 'RN17');
  });

  it('valida nome, e-mail e tamanho da senha', async () => {
    const amb = await criarAmbiente();
    await falha(amb.auth.cadastrar({ nome: '', email: 'g@exemplo.com', senha: 'senha123' }));
    await falha(amb.auth.cadastrar({ nome: 'Geisa', email: 'sem-arroba', senha: 'senha123' }));
    await falha(amb.auth.cadastrar({ nome: 'Geisa', email: 'g@exemplo.com', senha: '123' }));
  });

  it('entra com a senha certa e recusa a errada', async () => {
    const amb = await criarAmbiente();
    await amb.auth.cadastrar({ nome: 'Geisa', email: 'g@exemplo.com', senha: 'senha123' });
    await amb.auth.sair();
    assert.equal(await amb.auth.usuarioLogado(), null);

    const u = await amb.auth.entrar('G@exemplo.com', 'senha123');
    assert.equal(u.email, 'g@exemplo.com');
    assert.ok(!('senhaHash' in u), 'o usuário devolvido não pode trazer o hash');
    assert.equal((await amb.auth.usuarioLogado())?.id, u.id);

    await amb.auth.sair();
    const erroSenha = await falha(amb.auth.entrar('g@exemplo.com', 'errada'));
    const erroEmail = await falha(amb.auth.entrar('naoexiste@exemplo.com', 'senha123'));
    assert.equal(erroSenha.message, erroEmail.message, 'a mensagem não pode revelar se o e-mail existe');
    assert.equal(await amb.auth.usuarioLogado(), null);
  });

  it('limpa a sessão se o usuário não existe mais', async () => {
    const amb = await criarAmbiente();
    await amb.sessao.salvarSessao(999);
    assert.equal(await amb.auth.usuarioLogado(), null);
    assert.equal(await amb.sessao.obterSessao(), null);
  });
});
