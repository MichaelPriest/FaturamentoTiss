import test from 'node:test';
import assert from 'node:assert/strict';
import { inferProcedureSpecialties, rankProfessionalsForProcedure } from './professionalRecommendation.js';

test('infere psicologia a partir da descrição do procedimento', () => {
  assert.deepEqual(inferProcedureSpecialties({ nome: 'Sessão de Psicoterapia individual' }), ['psicologia']);
});

test('retorna somente profissionais da especialidade inferida', () => {
  const professionals = [
    { id: 1, nome: 'Ana', especialidades: [{ principal: true, especialidade: { nome: 'Psicologia' } }] },
    { id: 2, nome: 'Bruno', especialidades: [{ principal: true, especialidade: { nome: 'Cardiologia' } }] }
  ];
  const result = rankProfessionalsForProcedure(professionals, { nome: 'Avaliação psicológica' });
  assert.deepEqual(result.map(item => item.id), [1]);
  assert.equal(result[0].recommendationReason, 'Psicologia');
});

test('mantém todos os profissionais como fallback quando não há correspondência cadastrada', () => {
  const professionals = [{ id: 1, nome: 'Ana', especialidades: [] }, { id: 2, nome: 'Bruno', especialidades: [] }];
  const result = rankProfessionalsForProcedure(professionals, { nome: 'Sessão de psicoterapia' });
  assert.deepEqual(result.map(item => item.id), [1, 2]);
  assert.equal(result.every(item => item.recommendationFallback), true);
});
