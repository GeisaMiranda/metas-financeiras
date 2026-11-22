/**
 * Tipos do domínio. Espelham as entidades do diagrama de classes (UML)
 * e as tabelas do DER descritos na documentação.
 *
 * Convenções:
 *  - valores em dinheiro são sempre guardados em CENTAVOS (número inteiro);
 *  - datas são texto ISO: "AAAA-MM-DD" (datas) ou ISO completo (data/hora).
 */

export type StatusMeta = 'EM_ANDAMENTO' | 'CONCLUIDA';
export type StatusDesafio = 'EM_ANDAMENTO' | 'CONCLUIDO';

/** Situação do desafio para o usuário (derivada, não é gravada no banco). */
export type SituacaoDesafio = 'DISPONIVEL' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ENCERRADO';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  pontuacaoTotal: number;
  dataCadastro: string;
}

/** Usuário com o hash da senha. Só existe dentro da camada de dados/serviço de login. */
export interface UsuarioComSenha extends Usuario {
  senhaHash: string;
}

export interface Meta {
  id: number;
  usuarioId: number;
  titulo: string;
  descricao: string | null;
  valorObjetivo: number;
  valorAcumulado: number;
  dataCriacao: string;
  prazo: string;
  status: StatusMeta;
}

/** Meta para listagens: inclui a data do último valor registrado. */
export interface MetaListada extends Meta {
  ultimoRegistroEm: string | null;
}

export interface RegistroProgresso {
  id: number;
  metaId: number;
  valor: number;
  data: string;
}

export interface Desafio {
  id: number;
  titulo: string;
  descricao: string;
  objetivo: number;
  prazo: string;
  pontosRecompensa: number;
}

export interface ParticipacaoDesafio {
  id: number;
  usuarioId: number;
  desafioId: number;
  progresso: number;
  status: StatusDesafio;
  dataInicio: string;
}

export interface DesafioComSituacao extends Desafio {
  participacao: ParticipacaoDesafio | null;
  situacao: SituacaoDesafio;
}

/* ---------- Dados de entrada dos serviços ---------- */

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

export interface DadosMeta {
  titulo: string;
  descricao?: string;
  /** em centavos */
  valorObjetivo: number;
  /** "AAAA-MM-DD" */
  prazo: string;
}

/* ---------- Resultados ---------- */

export interface ResultadoRegistroValor {
  meta: Meta;
  pontosGanhos: number;
  metaConcluida: boolean;
  desafiosConcluidos: Desafio[];
}

export interface ResumoUsuario {
  totalGuardado: number;
  metasEmAndamento: number;
  metasConcluidas: number;
  pontuacaoTotal: number;
}
