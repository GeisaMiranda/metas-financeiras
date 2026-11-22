/**
 * Funções de data. As datas do sistema são texto "AAAA-MM-DD" (sem fuso)
 * e a data/hora dos registros é ISO completo (UTC).
 * Os cálculos usam UTC para não haver erro por causa de fuso horário/horário de verão.
 */

const MS_DIA = 24 * 60 * 60 * 1000;

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

/** Data de hoje no horário LOCAL do aparelho, como "AAAA-MM-DD". */
export function hojeISO(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;
}

/** Data e hora atual em ISO completo (UTC). */
export function agoraISO(agora: Date = new Date()): string {
  return agora.toISOString();
}

/** Verifica se o texto é uma data real no formato "AAAA-MM-DD". */
export function dataISOValida(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** "2026-11-23" -> "23/11/2026". Aceita também data/hora ISO completa. */
export function formatarData(iso: string): string {
  const parte = iso.slice(0, 10);
  const [ano, mes, dia] = parte.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

/** "23/11/2026" -> "2026-11-23". Devolve null se não for uma data real. */
export function parseDataBR(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return dataISOValida(iso) ? iso : null;
}

/** Máscara enquanto digita: "23112026" -> "23/11/2026". */
export function mascaraData(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function paraUTC(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(a as number, (m as number) - 1, d as number));
}

function deUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())}`;
}

export function adicionarDias(iso: string, dias: number): string {
  return deUTC(new Date(paraUTC(iso).getTime() + dias * MS_DIA));
}

/** Soma meses mantendo o dia (se o dia não existir no mês, usa o último dia do mês). */
export function adicionarMeses(iso: string, meses: number): string {
  const base = paraUTC(iso);
  const diaOriginal = base.getUTCDate();
  const alvo = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(diaOriginal, ultimoDia));
  return deUTC(alvo);
}

/** Dias de `de` até `ate` (positivo se `ate` for depois). */
export function diasEntre(de: string, ate: string): number {
  return Math.round((paraUTC(ate).getTime() - paraUTC(de).getTime()) / MS_DIA);
}
