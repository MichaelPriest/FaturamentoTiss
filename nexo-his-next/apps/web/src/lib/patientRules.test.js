import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidCpf,validatePatientRegistration } from './patientRules.js';
test('valida CPF pelos dígitos verificadores',()=>{assert.equal(isValidCpf('529.982.247-25'),true);assert.equal(isValidCpf('111.111.111-11'),false);});
test('exige dados do convênio somente para beneficiário',()=>{const base={nome:'Maria da Silva',cpf:'52998224725',data_nascimento:'1990-01-01',telefone:'11999999999'};assert.deepEqual(validatePatientRegistration({...base,modalidade_pagamento:'PARTICULAR'}),[]);assert.match(validatePatientRegistration({...base,modalidade_pagamento:'CONVENIO'})[0],/convênio/);});
