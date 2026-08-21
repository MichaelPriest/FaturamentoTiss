const test = require('node:test');
const assert = require('node:assert/strict');
const { moneyToCents, centsToMoney, calculateAccountTotals, validateAppeal, assertSafeReturnXml } = require('./financial.cjs');

test('dinheiro usa centavos inteiros sem ponto flutuante', () => {
  assert.equal(moneyToCents('999999999999.99'), 99999999999999n);
  assert.equal(centsToMoney(1001n), '10.01');
  assert.deepEqual(calculateAccountTotals([{ valor_total: '0.10' }, { valor_total: '0.20' }], '0.05'), { bruto: '0.30', desconto: '0.05', liquido: '0.25' });
});

test('recurso exige documentação tipada', () => assert.throws(() => validateAppeal({ prazo_recurso: '2999-01-01', justificativa: 'Justificativa técnica suficientemente longa', anexos: [] }), /Anexos obrigatórios/));
test('XML bloqueia entidades externas', () => assert.throws(() => assertSafeReturnXml('<!DOCTYPE x [<!ENTITY a SYSTEM "file:///etc/passwd">]>'), /não são permitidas/));
