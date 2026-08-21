import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClinicalEvolution } from './clinicalRules.js';

const valid={subjetivo:'Dor abdominal',objetivo:'Abdome doloroso',avaliacao:'Dor a esclarecer',plano:'Solicitar exames',cid10:'R10.4',prescricao:'Dipirona se dor',exames_solicitados:'Hemograma',orientacoes:'Retornar se houver piora',desfecho:'PERMANECE',finalizar:false};
test('valida evolução SOAP completa',()=>assert.deepEqual(validateClinicalEvolution(valid),[]));
test('exige desfecho ao finalizar',()=>assert.match(validateClinicalEvolution({...valid,finalizar:true})[0],/desfecho/));
test('rejeita CID-10 malformado',()=>assert.match(validateClinicalEvolution({...valid,cid10:'123'})[0],/CID-10/));
test('exige orientação ao encerrar o cuidado',()=>assert.match(validateClinicalEvolution({...valid,finalizar:true,desfecho:'ALTA',orientacoes:''})[0],/orientações/));
test('exige agendamento para reavaliação',()=>assert.match(validateClinicalEvolution({...valid,desfecho:'REAVALIACAO',reavaliar_em:''})[0],/data e hora/));
test('valida dados do atestado médico',()=>assert.equal(validateClinicalEvolution({...valid,emitir_atestado:true,dias_atestado:0,texto_atestado:'curto'}).length,2));
