import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateDiaristaService } from '../src/services/diarista/CreateDiaristaService.js';

test('cadastro da diarista grava perfil, preço individual, combo e vínculos em transação', async () => {
  const calls = [];
  const tx = {
    diarista: {
      create: async ({ data }) => { calls.push(['diarista', data]); return { id_diarista: 9 }; },
      findUnique: async () => ({ id_diarista: 9, diarista_servico: [], combo_base: [] }),
    },
    servico: {
      findUnique: async ({ where }) => ({ id_servico: where.id_servico }),
      create: async ({ data }) => { calls.push(['servico', data]); return { id_servico: 12 }; },
    },
    diarista_servico: {
      create: async ({ data }) => { calls.push(['diarista_servico', data]); return data; },
    },
    combo_base: {
      create: async ({ data }) => { calls.push(['combo_base', data]); return { id_combo_base: 15 }; },
    },
    combo_servico: {
      create: async ({ data }) => { calls.push(['combo_servico', data]); return data; },
    },
  };
  const database = { $transaction: async (callback) => callback(tx) };
  const repository = { findByIdUsuario: async () => null };
  const service = new CreateDiaristaService(repository, database);

  await service.execute({
    id_usuario: 3,
    descricao: 'Profissional experiente e organizada.',
    qtd_max_comodos: 8,
    endereco: { cep: '01001-000' },
    servicos: [
      { id_servico: 2, preco: 100, faz_parte_combo_base: true },
      { nome_servico: 'Janelas', preco: 40, faz_parte_combo_base: false },
    ],
    combo_base: { nome_combo: 'Completo', valor_base: 120, qtd_comodos_casa: 8 },
  }, { id_usuario: 3 });

  assert.equal(calls.filter(([model]) => model === 'diarista_servico').length, 2);
  assert.equal(calls.filter(([model]) => model === 'combo_base').length, 1);
  assert.deepEqual(calls.find(([model]) => model === 'combo_servico')?.[1], {
    id_combo_base: 15,
    id_servico: 2,
  });
});

test('cadastro da diarista retoma perfil parcial sem criar outra diarista', async () => {
  const calls = [];
  const tx = {
    diarista: {
      update: async ({ data }) => { calls.push(['diarista.update', data]); return { id_diarista: 9 }; },
      findUnique: async () => ({ id_diarista: 9, diarista_servico: [], combo_base: [] }),
    },
    endereco: {
      findFirst: async () => ({ id_endereco: 4 }),
      create: async ({ data }) => { calls.push(['endereco', data]); return data; },
    },
    servico: {
      findUnique: async ({ where }) => ({ id_servico: where.id_servico }),
    },
    diarista_servico: {
      create: async ({ data }) => { calls.push(['diarista_servico', data]); return data; },
    },
    combo_base: {
      create: async ({ data }) => { calls.push(['combo_base', data]); return { id_combo_base: 15 }; },
    },
    combo_servico: {
      create: async ({ data }) => { calls.push(['combo_servico', data]); return data; },
    },
  };
  const database = {
    diarista: {
      findUnique: async () => ({ id_diarista: 9, endereco: [{ id_endereco: 4 }], diarista_servico: [], combo_base: [] }),
    },
    $transaction: async (callback) => callback(tx),
  };
  const repository = { findByIdUsuario: async () => ({ id_diarista: 9, id_usuario: 3 }) };
  const service = new CreateDiaristaService(repository, database);

  await service.execute({
    id_usuario: 3,
    descricao: 'Profissional experiente e organizada.',
    qtd_max_comodos: 8,
    endereco: { cep: '01001-000' },
    servicos: [{ id_servico: 2, preco: 100, faz_parte_combo_base: true }],
    combo_base: { nome_combo: 'Completo', valor_base: 120, qtd_comodos_casa: 8 },
  }, { id_usuario: 3 });

  assert.equal(calls.some(([operation]) => operation === 'diarista.update'), true);
  assert.equal(calls.some(([operation]) => operation === 'diarista.create'), false);
  assert.equal(calls.filter(([operation]) => operation === 'diarista_servico').length, 1);
  assert.equal(calls.filter(([operation]) => operation === 'combo_base').length, 1);
});
