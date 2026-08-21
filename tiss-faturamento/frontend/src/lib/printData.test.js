import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContractorData, paginateTissGuideItems } from './printData.js';

test('prioriza os dados completos da unidade na impressão', () => {
  const data = buildContractorData({
    unidade: { nome: 'Clínica Central', cnpj: '123', cnes: '456', cidade: 'São Paulo', uf: 'SP' },
    configuracao: { nome_contratado: 'Configuração antiga', cnpj: '999' }
  });
  assert.equal(data.nome_contratado, 'Clínica Central');
  assert.equal(data.cnpj, '123');
  assert.equal(data.cnes, '456');
  assert.equal(data.cidade, 'São Paulo');
});

test('pagina itens executados e autorizados sem perder o layout das folhas', () => {
  const itens = Array.from({ length: 11 }, (_, index) => ({ id: index + 1 }));
  const autorizados = Array.from({ length: 7 }, (_, index) => ({ id: index + 1 }));
  const paginas = paginateTissGuideItems(itens, autorizados, 4);
  assert.equal(paginas.length, 3);
  assert.deepEqual(paginas.map(pagina => pagina.itens.length), [4, 4, 3]);
  assert.deepEqual(paginas.map(pagina => pagina.itensAutorizados.length), [4, 3, 0]);
  assert.deepEqual(paginas.map(pagina => pagina.inicio), [1, 5, 9]);
});
