import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTriage } from './triageRules.js';

test('valida limites de sinais vitais e dados obrigatórios',()=>{
  assert.deepEqual(validateTriage({atendimento_id:'1',classificacao:'VERDE',queixa_principal:'Dor',saturacao:98,temperatura:36.5,escala_dor:3}),[]);
  assert.match(validateTriage({atendimento_id:'1',classificacao:'VERDE',queixa_principal:'Dor',saturacao:120})[0],/saturacao/);
});
