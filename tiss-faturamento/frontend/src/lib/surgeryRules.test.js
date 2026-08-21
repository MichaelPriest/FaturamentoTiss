import test from 'node:test';import assert from 'node:assert/strict';
import { hasSurgeryRoomConflict,isPreoperativeChecklistComplete,validateSurgery } from './surgeryRules.js';
test('valida período cirúrgico',()=>assert.equal(validateSurgery({paciente_id:1,procedimento:'A',sala:'1',inicio_previsto:'2026-08-26T10:00',fim_previsto:'2026-08-26T09:00'}),'O término previsto deve ser posterior ao início.'));
test('detecta conflito da mesma sala',()=>assert.equal(hasSurgeryRoomConflict({sala:'Sala 1',inicio_previsto:'2026-08-26T10:30',fim_previsto:'2026-08-26T11:30'},[{sala:'sala 1',inicio_previsto:'2026-08-26T10:00',fim_previsto:'2026-08-26T11:00',status:'confirmada'}]),true));
test('exige todos os itens pré-operatórios',()=>assert.equal(isPreoperativeChecklistComplete({identidade_confirmada:true}),false));
