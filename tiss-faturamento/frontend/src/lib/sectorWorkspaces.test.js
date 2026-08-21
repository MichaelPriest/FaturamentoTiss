import test from 'node:test';
import assert from 'node:assert/strict';
import { filterMenuGroups, getWorkspace } from './sectorWorkspaces.js';

const groups = [{ id: 'g', items: [{ id: 'dashboard' }, { id: 'faturamento' }, { id: 'configuracoes' }] }];

test('retorna visão geral para um setor desconhecido', () => assert.equal(getWorkspace('inexistente').id, 'todos'));
test('filtra módulos pelo setor e pelas permissões', () => {
  const result = filterMenuGroups(groups, 'faturamento', id => id !== 'configuracoes');
  assert.deepEqual(result[0].items.map(item => item.id), ['dashboard', 'faturamento']);
});
