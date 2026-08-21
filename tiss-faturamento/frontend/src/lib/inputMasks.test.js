import test from 'node:test';
import assert from 'node:assert/strict';
import { maskAns, maskCep, maskCnpj, maskCpf, maskPhone, unmask } from './inputMasks.js';

test('applies Brazilian document and contact masks with length limits', () => {
  assert.equal(maskCpf('1234567890199'), '123.456.789-01');
  assert.equal(maskCnpj('12345678000199'), '12.345.678/0001-99');
  assert.equal(maskPhone('11987654321'), '(11) 98765-4321');
  assert.equal(maskPhone('1132654321'), '(11) 3265-4321');
  assert.equal(maskCep('013109309'), '01310-930');
  assert.equal(maskAns('1234567'), '123456');
  assert.equal(unmask('12.345.678/0001-99'), '12345678000199');
});

