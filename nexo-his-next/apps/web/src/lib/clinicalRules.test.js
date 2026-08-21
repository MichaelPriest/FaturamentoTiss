import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClinicalEvolution } from './clinicalRules.js';

const valid={subjetivo:'Dor abdominal',objetivo:'Abdome doloroso',avaliacao:'Dor a esclarecer',plano:'Solicitar exames',cid10:'R10.4',desfecho:'PERMANECE',finalizar:false};
test('valida evolução SOAP completa',()=>assert.deepEqual(validateClinicalEvolution(valid),[]));
test('exige desfecho ao finalizar',()=>assert.match(validateClinicalEvolution({...valid,finalizar:true})[0],/desfecho/));
test('rejeita CID-10 malformado',()=>assert.match(validateClinicalEvolution({...valid,cid10:'123'})[0],/CID-10/));
