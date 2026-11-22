import type { DatabaseService } from './types';
import { adicionarDias, hojeISO } from '../utils/date';
import { reaisParaCentavos } from '../utils/money';

interface DesafioInicial {
  titulo: string;
  descricao: string;
  objetivoReais: number;
  diasDePrazo: number;
  pontos: number;
}

/**
 * Os desafios já vêm cadastrados no banco desde o início (o usuário não cria desafios).
 * O prazo é contado a partir do dia em que o app foi aberto pela primeira vez.
 */
export const DESAFIOS_INICIAIS: DesafioInicial[] = [
  {
    titulo: 'Primeiro passo',
    descricao: 'Guarde R$ 50,00 em qualquer meta e comece o hábito de economizar.',
    objetivoReais: 50,
    diasDePrazo: 30,
    pontos: 30,
  },
  {
    titulo: 'Cofrinho de R$ 100',
    descricao: 'Junte R$ 100,00 somando tudo o que você registrar nas suas metas.',
    objetivoReais: 100,
    diasDePrazo: 30,
    pontos: 50,
  },
  {
    titulo: 'Meta do mês',
    descricao: 'Guarde R$ 300,00 e mostre que dá para manter o ritmo.',
    objetivoReais: 300,
    diasDePrazo: 45,
    pontos: 100,
  },
  {
    titulo: 'Reserva em construção',
    descricao: 'Chegue a R$ 500,00 guardados e fortaleça a sua reserva.',
    objetivoReais: 500,
    diasDePrazo: 90,
    pontos: 150,
  },
  {
    titulo: 'Mil reais',
    descricao: 'Um desafio de peso: guarde R$ 1.000,00 nas suas metas.',
    objetivoReais: 1000,
    diasDePrazo: 180,
    pontos: 250,
  },
  {
    titulo: 'Maratona do ano',
    descricao: 'Longo prazo: junte R$ 3.000,00 em até um ano.',
    objetivoReais: 3000,
    diasDePrazo: 365,
    pontos: 500,
  },
];

/** Cadastra os desafios iniciais se a tabela estiver vazia. Seguro para chamar toda vez. */
export async function carregarDesafiosIniciais(
  db: DatabaseService,
  hoje: string = hojeISO(),
): Promise<void> {
  const linha = await db.consultarUm<{ total: number }>('SELECT COUNT(*) AS total FROM desafio');
  if ((linha?.total ?? 0) > 0) return;

  await db.transacao(async (tx) => {
    for (const d of DESAFIOS_INICIAIS) {
      await tx.executar(
        'INSERT INTO desafio (titulo, descricao, objetivo, prazo, pontos_recompensa) VALUES (?, ?, ?, ?, ?)',
        [d.titulo, d.descricao, reaisParaCentavos(d.objetivoReais), adicionarDias(hoje, d.diasDePrazo), d.pontos],
      );
    }
  });
}
