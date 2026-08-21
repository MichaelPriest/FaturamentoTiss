import test from 'node:test';import assert from 'node:assert/strict';import { resolveTissVersion,validateTissTransmissionContext } from './tissCompliance.js';
test('prioriza versão do convênio sobre o padrão',()=>assert.equal(resolveTissVersion({convenio:{versao_tiss:'4.02.00'}}),'4.02.00'));
test('aceita versão explícita já homologada',()=>assert.equal(resolveTissVersion({explicitVersion:'4.01.00',convenio:{versao_tiss:'4.03.00'}}),'4.01.00'));
test('rejeita versão ainda sem schemas homologados no sistema',()=>assert.throws(()=>resolveTissVersion({explicitVersion:'4.04.00'}),/não homologada/));
test('valida contexto mínimo de transmissão',()=>assert.deepEqual(validateTissTransmissionContext({version:'4.03.00',registroANS:'123',codigoPrestador:'9',numeroCarteira:'ABC',procedimentos:[{codigo:'101'}]}),[]));
