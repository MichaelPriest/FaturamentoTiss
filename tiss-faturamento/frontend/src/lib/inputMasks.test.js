import test from 'node:test';
import assert from 'node:assert/strict';
import { maskANS, maskCEP, maskCNPJ, maskCPF, maskPhone, unmask } from './inputMasks.js';

test('aplica máscaras brasileiras e limita o número de dígitos', () => {
  assert.equal(maskCPF('123456789012'), '123.456.789-01');
  assert.equal(maskCNPJ('12345678000199'), '12.345.678/0001-99');
  assert.equal(maskCEP('123456789'), '12345-678');
  assert.equal(maskPhone('11987654321'), '(11) 98765-4321');
  assert.equal(maskANS('1234567'), '123456');
  assert.equal(unmask('12.345-6'), '123456');
});
