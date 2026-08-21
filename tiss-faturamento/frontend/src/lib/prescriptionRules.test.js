import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTodayAdministrations, normalizeSchedule, validatePrescriptionItem } from './prescriptionRules.js';

test('normaliza, remove duplicados e ordena horários', () => {
  assert.deepEqual(normalizeSchedule('18:00, 06:00;18:00'), ['06:00', '18:00']);
});

test('valida os campos clínicos essenciais', () => {
  assert.equal(validatePrescriptionItem({ tipo: 'medicamento', descricao: 'Dipirona', horarios: '08:00' }), 'Informe a via de administração.');
  assert.equal(validatePrescriptionItem({ tipo: 'medicamento', descricao: 'Dipirona', via: 'VO', horarios: '25:00' }), 'Use horários válidos no formato HH:MM.');
  assert.equal(validatePrescriptionItem({ tipo: 'cuidado', descricao: 'Verificar sinais', horarios: '08:00' }), null);
});

test('monta agenda diária em ordem cronológica', () => {
  const result = buildTodayAdministrations([{ id: 1, horarios: ['18:00', '06:00'] }], new Date(2026, 7, 22));
  assert.deepEqual(result.map(item => item.horarioPrevisto), ['2026-08-22T06:00:00.000Z', '2026-08-22T18:00:00.000Z']);
});
