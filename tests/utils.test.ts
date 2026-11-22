import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcularProgresso, estaConcluida, fracaoProgresso, nivelDaPontuacao, valorRestante } from '../src/domain/metaRegras';
import {
  adicionarDias,
  adicionarMeses,
  dataISOValida,
  diasEntre,
  formatarData,
  hojeISO,
  mascaraData,
  parseDataBR,
} from '../src/utils/date';
import { digitosParaCentavos, formatarReais, reaisParaCentavos } from '../src/utils/money';
import { emailValido, normalizarEmail } from '../src/utils/validation';

describe('dinheiro', () => {
  it('formata centavos como reais', () => {
    assert.equal(formatarReais(0), 'R$ 0,00');
    assert.equal(formatarReais(5), 'R$ 0,05');
    assert.equal(formatarReais(123456), 'R$ 1.234,56');
    assert.equal(formatarReais(100000000), 'R$ 1.000.000,00');
    assert.equal(formatarReais(-2500), '-R$ 25,00');
  });

  it('converte o texto digitado em centavos', () => {
    assert.equal(digitosParaCentavos(''), 0);
    assert.equal(digitosParaCentavos('R$ 1.234,56'), 123456);
    assert.equal(digitosParaCentavos('abc'), 0);
    assert.equal(reaisParaCentavos(50), 5000);
    assert.equal(reaisParaCentavos(19.9), 1990);
  });
});

describe('datas', () => {
  it('valida e converte datas', () => {
    assert.equal(dataISOValida('2026-11-23'), true);
    assert.equal(dataISOValida('2026-02-30'), false);
    assert.equal(dataISOValida('23/11/2026'), false);
    assert.equal(parseDataBR('23/11/2026'), '2026-11-23');
    assert.equal(parseDataBR('31/04/2026'), null);
    assert.equal(parseDataBR('23/11/26'), null);
    assert.equal(formatarData('2026-11-23'), '23/11/2026');
    assert.equal(formatarData('2026-11-23T15:30:00.000Z'), '23/11/2026');
  });

  it('aplica a máscara enquanto digita', () => {
    assert.equal(mascaraData('2'), '2');
    assert.equal(mascaraData('231'), '23/1');
    assert.equal(mascaraData('23112026'), '23/11/2026');
    assert.equal(mascaraData('2311202699'), '23/11/2026');
  });

  it('soma dias e meses', () => {
    assert.equal(adicionarDias('2026-11-23', 30), '2026-12-23');
    assert.equal(adicionarDias('2026-12-31', 1), '2027-01-01');
    assert.equal(adicionarMeses('2026-01-31', 1), '2026-02-28');
    assert.equal(adicionarMeses('2026-11-23', 3), '2027-02-23');
    assert.equal(diasEntre('2026-11-23', '2026-12-03'), 10);
    assert.equal(diasEntre('2026-12-03', '2026-11-23'), -10);
  });

  it('hojeISO usa a data local', () => {
    assert.equal(hojeISO(new Date(2026, 10, 23, 23, 59)), '2026-11-23');
    assert.equal(hojeISO(new Date(2026, 0, 5, 0, 1)), '2026-01-05');
  });
});

describe('regras da meta (RN04, RN05, RN12)', () => {
  it('calcula o progresso em porcentagem', () => {
    assert.equal(calcularProgresso({ valorAcumulado: 25000, valorObjetivo: 100000 }), 25);
    assert.equal(calcularProgresso({ valorAcumulado: 0, valorObjetivo: 100000 }), 0);
    // arredonda para baixo: 99,9% não vira 100%
    assert.equal(calcularProgresso({ valorAcumulado: 99999, valorObjetivo: 100000 }), 99);
  });

  it('limita o progresso a 100% quando passa do objetivo (RN12)', () => {
    assert.equal(calcularProgresso({ valorAcumulado: 150000, valorObjetivo: 100000 }), 100);
    assert.equal(fracaoProgresso({ valorAcumulado: 150000, valorObjetivo: 100000 }), 1);
  });

  it('identifica meta concluída (RN05)', () => {
    assert.equal(estaConcluida({ valorAcumulado: 99999, valorObjetivo: 100000 }), false);
    assert.equal(estaConcluida({ valorAcumulado: 100000, valorObjetivo: 100000 }), true);
    assert.equal(valorRestante({ valorAcumulado: 25000, valorObjetivo: 100000 }), 75000);
    assert.equal(valorRestante({ valorAcumulado: 150000, valorObjetivo: 100000 }), 0);
  });

  it('calcula o nível pela pontuação', () => {
    assert.equal(nivelDaPontuacao(0), 1);
    assert.equal(nivelDaPontuacao(99), 1);
    assert.equal(nivelDaPontuacao(100), 2);
    assert.equal(nivelDaPontuacao(250), 3);
  });
});

describe('validação', () => {
  it('valida e normaliza e-mail', () => {
    assert.equal(emailValido('geisa@exemplo.com'), true);
    assert.equal(emailValido('geisa@exemplo'), false);
    assert.equal(emailValido('geisa exemplo.com'), false);
    assert.equal(normalizarEmail('  Geisa@Exemplo.COM '), 'geisa@exemplo.com');
  });
});
