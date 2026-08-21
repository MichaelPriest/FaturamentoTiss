import test from 'node:test';import assert from 'node:assert/strict';import { filterSearchOptions,normalizeOptionSearch } from './optionSearch.js';
test('normaliza acentos na busca de opções',()=>assert.equal(normalizeOptionSearch('João da SILVA'),'joao da silva'));
test('localiza paciente por nome ou CPF',()=>{const options=[{id:1,nome:'João Lima',cpf:'123'},{id:2,nome:'Maria Souza',cpf:'999'}];assert.deepEqual(filterSearchOptions(options,'joao').map(i=>i.id),[1]);assert.deepEqual(filterSearchOptions(options,'999').map(i=>i.id),[2])});
