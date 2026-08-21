import test from 'node:test';import assert from 'node:assert/strict';import { buildPatientJourney,getPatientAlerts } from './patientJourney.js';
test('marca terapêutica durante internação com exames',()=>{const stages=buildPatientJourney({internacoes:[{status:'ativa'}],exames:[{status:'solicitado'}]});assert.equal(stages.find(item=>item.status==='active').id,'terapeutica')});
test('marca alta quando internação foi encerrada',()=>{const stages=buildPatientJourney({internacoes:[{status:'alta'}]});assert.equal(stages.find(item=>item.status==='active').id,'alta')});
test('gera alertas assistenciais sem interpretar diagnóstico',()=>assert.equal(getPatientAlerts({triagens:[{prioridade:'vermelho',status:'aguardando'}]}).length,1));
