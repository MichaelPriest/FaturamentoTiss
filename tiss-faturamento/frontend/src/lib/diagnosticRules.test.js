import test from 'node:test';
import assert from 'node:assert/strict';
import { isDiagnosticDelayed, sortDiagnosticQueue, validateDiagnosticRequest } from './diagnosticRules.js';

test('exige indicação clínica em emergência', () => assert.equal(validateDiagnosticRequest({paciente_id:1,exame_id:2,prioridade:'emergencia'}),'Informe a indicação clínica para pedidos de emergência.'));
test('identifica solicitação fora do prazo', () => assert.equal(isDiagnosticDelayed({status:'solicitado',solicitado_em:'2026-08-24T08:00:00Z',exames_catalogo:{prazo_horas:2}},new Date('2026-08-24T10:01:00Z')),true));
test('prioriza emergência antes da rotina', () => assert.deepEqual(sortDiagnosticQueue([{id:1,prioridade:'rotina',solicitado_em:'2026-08-24T08:00:00Z'},{id:2,prioridade:'emergencia',solicitado_em:'2026-08-24T09:00:00Z'}]).map(item=>item.id),[2,1]));
