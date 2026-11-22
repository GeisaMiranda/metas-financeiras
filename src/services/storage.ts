/**
 * Armazenamento local simples (chave/valor). No app é o AsyncStorage;
 * nos testes é um objeto em memória.
 */
export interface KeyValueStorage {
  getItem(chave: string): Promise<string | null>;
  setItem(chave: string, valor: string): Promise<void>;
  removeItem(chave: string): Promise<void>;
}

/** Guarda no celular quem está logado (diagrama: SessaoStorage). */
export class SessaoStorage {
  private readonly armazenamento: KeyValueStorage;
  private static readonly CHAVE = 'sessao.usuarioId';

  constructor(armazenamento: KeyValueStorage) {
    this.armazenamento = armazenamento;
  }

  async salvarSessao(usuarioId: number): Promise<void> {
    await this.armazenamento.setItem(SessaoStorage.CHAVE, String(usuarioId));
  }

  async obterSessao(): Promise<number | null> {
    const valor = await this.armazenamento.getItem(SessaoStorage.CHAVE);
    if (valor === null) return null;
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  async limparSessao(): Promise<void> {
    await this.armazenamento.removeItem(SessaoStorage.CHAVE);
  }
}

/** Preferências do usuário neste aparelho (ex.: lembretes ligados). */
export class PreferenciasStorage {
  private readonly armazenamento: KeyValueStorage;

  constructor(armazenamento: KeyValueStorage) {
    this.armazenamento = armazenamento;
  }

  private chaveLembretes(usuarioId: number): string {
    return `prefs.lembretes.${usuarioId}`;
  }

  async lembretesAtivos(usuarioId: number): Promise<boolean> {
    return (await this.armazenamento.getItem(this.chaveLembretes(usuarioId))) === '1';
  }

  async definirLembretes(usuarioId: number, ativo: boolean): Promise<void> {
    if (ativo) {
      await this.armazenamento.setItem(this.chaveLembretes(usuarioId), '1');
    } else {
      await this.armazenamento.removeItem(this.chaveLembretes(usuarioId));
    }
  }
}
