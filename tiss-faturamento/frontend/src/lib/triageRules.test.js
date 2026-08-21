import test from 'node:test';
import assert from 'node:assert/strict';
import { getTriageTiming, sortTriageQueue, validateVitals } from './triageRules.js';

test('valida limites plausíveis dos sinais vitais', () => {
  assert.equal(validateVitals({ saturacao: 101 }), 'Saturação fora do intervalo aceito.');
  assert.equal(validateVitals({ pressao_sistolica: 120, pressao_diastolica: 80, saturacao: 98, escala_dor: 3 }), null);
});
test('identifica estouro do tempo-alvo', () => {
  const timing = getTriageTiming('laranja', '2026-08-23T10:00:00Z', new Date('2026-08-23T10:11:00Z'));
  assert.equal(timing.overdue, true);
  assert.equal(timing.elapsedMinutes, 11);
});
test('ordena por gravidade e depois por chegada', () => {
  const queue = sortTriageQueue([{ id: 1, prioridade: 'verde', classificado_em: '2026-08-23T09:00:00Z' }, { id: 2, prioridade: 'vermelho', classificado_em: '2026-08-23T10:00:00Z' }]);
  assert.deepEqual(queue.map(item => item.id), [2, 1]);
});
