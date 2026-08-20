import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateOnly, parseDateWithoutTimezone } from './dateUtils.js';

test('formata data civil sem aplicar conversão de fuso horário', () => {
  const parsed = parseDateWithoutTimezone('2026-08-20');
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 7);
  assert.equal(parsed.getDate(), 20);
  assert.equal(formatDateOnly('2026-08-20'), '20/08/2026');
});
