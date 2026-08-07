const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('./orizon-soap');

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('proxy SOAP rejeita métodos diferentes de POST', async () => {
  const res = responseRecorder();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'POST');
});

test('proxy SOAP exige autenticação', async () => {
  const res = responseRecorder();
  await handler({ method: 'POST', headers: {}, body: {} }, res);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /Sessão inválida/);
});
