import test from 'node:test';
import assert from 'node:assert/strict';
import { canAdvanceReception, normalizePatientSearch, shouldRefreshSession } from './hisApiRules.js';

test('normaliza busca e remove operadores PostgREST', () => assert.equal(normalizePatientSearch('  João%,(*)  '), 'Joao'));
test('permite apenas a próxima etapa da recepção', () => {
  assert.equal(canAdvanceReception('CHEGOU', 'TRIAGEM'), true);
  assert.equal(canAdvanceReception('CHEGOU', 'FINALIZADO'), false);
});
test('renova somente sessões com vencimento alcançado',()=>{
  assert.equal(shouldRefreshSession(900,1000),true);
  assert.equal(shouldRefreshSession(1100,1000),false);
  assert.equal(shouldRefreshSession(0,1000),false);
});
