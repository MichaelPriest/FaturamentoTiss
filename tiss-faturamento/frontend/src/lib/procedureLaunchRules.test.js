import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeProcedureSearch,
  resolveProcedureValue,
  validateAuthorizedQuantity,
  validateExecutionPeriod
} from './procedureLaunchRules.js';

test('preserva valor de convênio igual a zero', () => {
  assert.equal(resolveProcedureValue({ valor_convenio: 0, valor_sugerido: 90 }, { multiplicador: 1.2 }), 0);
});

test('usa valor sugerido e multiplicador quando não existe valor de convênio', () => {
  assert.equal(resolveProcedureValue({ valor_sugerido: 100 }, { multiplicador: 1.1 }), 110.00000000000001);
});

test('devolve a quantidade antiga ao saldo durante uma edição', () => {
  const result = validateAuthorizedQuantity({
    authorizedItem: { quantidade_autorizada: 5, quantidade_utilizada: 3 },
    quantity: 4,
    restoredQuantity: 3
  });
  assert.equal(result.pode, true);
  assert.equal(result.saldo, 5);
});

test('rejeita quantidade acima do saldo autorizado', () => {
  const result = validateAuthorizedQuantity({
    authorizedItem: { quantidade_autorizada: 2, quantidade_utilizada: 1 },
    quantity: 2
  });
  assert.equal(result.pode, false);
  assert.match(result.mensagem, /Saldo disponível: 1/);
});

test('valida período e normaliza busca sem acentos', () => {
  assert.match(validateExecutionPeriod({ dataExecucao: '2026-08-20', horaInicial: '11:00', horaFinal: '10:00' }), /hora final/i);
  assert.equal(normalizeProcedureSearch('  Ressonância Magnética  '), 'ressonancia magnetica');
});
