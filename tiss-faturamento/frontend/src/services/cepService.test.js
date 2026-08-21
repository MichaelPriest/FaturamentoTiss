import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarCEP } from './cepService.js';

test('consulta BrasilAPI e normaliza endereço', async () => {
  const previous = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ street:'Praça da Sé', neighborhood:'Sé', city:'São Paulo', state:'SP' }) });
  try { assert.deepEqual(await consultarCEP('01001-000'), { endereco:'Praça da Sé', bairro:'Sé', cidade:'São Paulo', estado:'SP' }); }
  finally { global.fetch = previous; }
});
