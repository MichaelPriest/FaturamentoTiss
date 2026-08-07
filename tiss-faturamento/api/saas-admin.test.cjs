const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('./saas-admin');

const responseRecorder = () => ({
  statusCode: 200, body: null,
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; }
});

test('API SaaS rejeita métodos diferentes de POST', async () => {
  const res = responseRecorder();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 405);
});

test('API SaaS falha de forma clara sem service role no servidor', async () => {
  const res = responseRecorder();
  await handler({ method: 'POST', headers: {}, body: {} }, res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body.error, /não configurada/);
  assert.equal(res.body.code, 'SAAS_ENV_MISSING');
  assert.ok(Array.isArray(res.body.missing));
});
