import type { DatabaseService } from '../types';

/**
 * Migrações do banco. A versão aplicada fica guardada no próprio SQLite (PRAGMA user_version).
 * Para mudar o banco no futuro, NÃO edite a versão 1: crie a versão 2 com ALTER TABLE etc.
 *
 * As tabelas abaixo são exatamente as do DER da documentação.
 * Dinheiro em centavos (INTEGER); datas como TEXT ISO (o SQLite não tem tipo de data).
 */
const SQL_VERSAO_1 = `
CREATE TABLE IF NOT EXISTS usuario (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT    NOT NULL,
  email           TEXT    NOT NULL UNIQUE,
  senha_hash      TEXT    NOT NULL,
  pontuacao_total INTEGER NOT NULL DEFAULT 0,
  data_cadastro   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS meta_financeira (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  titulo          TEXT    NOT NULL,
  descricao       TEXT,
  valor_objetivo  INTEGER NOT NULL CHECK (valor_objetivo > 0),
  valor_acumulado INTEGER NOT NULL DEFAULT 0,
  data_criacao    TEXT    NOT NULL,
  prazo           TEXT    NOT NULL CHECK (prazo >= data_criacao),
  status          TEXT    NOT NULL DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDA'))
);

CREATE TABLE IF NOT EXISTS registro_progresso (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  meta_id INTEGER NOT NULL REFERENCES meta_financeira(id) ON DELETE CASCADE,
  valor   INTEGER NOT NULL CHECK (valor > 0),
  data    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS desafio (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo            TEXT    NOT NULL,
  descricao         TEXT    NOT NULL,
  objetivo          INTEGER NOT NULL CHECK (objetivo > 0),
  prazo             TEXT    NOT NULL,
  pontos_recompensa INTEGER NOT NULL DEFAULT 0 CHECK (pontos_recompensa >= 0)
);

CREATE TABLE IF NOT EXISTS participacao_desafio (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id  INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  desafio_id  INTEGER NOT NULL REFERENCES desafio(id),
  progresso   INTEGER NOT NULL DEFAULT 0,
  status      TEXT    NOT NULL DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDO')),
  data_inicio TEXT    NOT NULL,
  UNIQUE (usuario_id, desafio_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_usuario         ON meta_financeira(usuario_id);
CREATE INDEX IF NOT EXISTS idx_registro_meta        ON registro_progresso(meta_id);
CREATE INDEX IF NOT EXISTS idx_participacao_usuario ON participacao_desafio(usuario_id);
`;

interface Migracao {
  versao: number;
  sql: string;
}

const MIGRACOES: Migracao[] = [{ versao: 1, sql: SQL_VERSAO_1 }];

export const VERSAO_ATUAL_DO_BANCO = MIGRACOES[MIGRACOES.length - 1]?.versao ?? 0;

/** Cria/atualiza as tabelas até a versão mais nova. Pode ser chamada a cada abertura do app. */
export async function migrar(db: DatabaseService): Promise<void> {
  const linha = await db.consultarUm<{ user_version: number }>('PRAGMA user_version');
  const aplicada = linha?.user_version ?? 0;

  for (const migracao of MIGRACOES) {
    if (migracao.versao > aplicada) {
      await db.executarScript(migracao.sql);
      // PRAGMA não aceita parâmetros; o número vem da constante acima (seguro).
      await db.executar(`PRAGMA user_version = ${migracao.versao}`);
    }
  }
}
