/** Devolve "agora". Nos testes é trocado por uma data fixa. */
export type Relogio = () => Date;

export const relogioPadrao: Relogio = () => new Date();
