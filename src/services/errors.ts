/**
 * Erro lançado quando o usuário tenta algo que quebra uma regra do sistema
 * (ex.: valor igual a zero, e-mail repetido). A mensagem já é amigável e pode ser
 * mostrada direto na tela (RNF08).
 */
export class RegraDeNegocioError extends Error {
  /** Código da regra da documentação (ex.: "RN01") ou do requisito (ex.: "RF03"). */
  readonly regra: string;

  constructor(regra: string, mensagem: string) {
    super(mensagem);
    this.name = 'RegraDeNegocioError';
    this.regra = regra;
  }
}

/** Transforma qualquer erro em um texto para mostrar ao usuário, sem derrubar o app. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof RegraDeNegocioError) return erro.message;
  return 'Algo deu errado. Tente novamente.';
}
