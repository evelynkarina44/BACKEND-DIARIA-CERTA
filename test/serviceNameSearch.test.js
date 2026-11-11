import test from 'node:test';
import assert from 'node:assert/strict';
import { DiaristaSearchService } from '../src/services/diarista/DiaristaSearchService.js';
import { diaristaSearchSchema } from '../src/schemas/apiSchemas.js';
import { serviceSearchTerms } from '../src/utils/serviceSearchTerms.js';

test('busca por texto valida tamanho e normaliza espaços', () => {
  assert.equal(diaristaSearchSchema.parse({ servico_nome: '  janelas  ' }).servico_nome, 'janelas');
  assert.equal(diaristaSearchSchema.safeParse({ servico_nome: 'x'.repeat(101) }).success, false);
});

test('pesquisa parte do nome de um serviço ativo e mantém os outros filtros', async () => {
  let query;
  const service = new DiaristaSearchService({
    diarista: { findMany: async args => { query = args; return []; } },
    servico: { findMany: async () => [] },
  });
  const result = await service.list({ servico_nome: '  janelas  ', nome: 'Ana', preco_max: 100, avaliacao_min: 4 });
  assert.deepEqual(query.where.AND[0].diarista_servico.some, {
    ativo: true, servico: { nome_servico: { contains: 'janelas' } }, preco: { lte: 100 },
  });
  assert.deepEqual(query.where.usuario.nome, { contains: 'Ana' });
  assert.deepEqual(query.where.avaliacao_media, { gte: 4 });
  assert.equal(result.pagination.total, 0, 'serviço inexistente não deve ignorar a pesquisa e retornar todas');
});

test('limpar texto remove apenas a restrição de serviço; filtro antigo por ID permanece compatível', async () => {
  let query;
  const service = new DiaristaSearchService({
    diarista: { findMany: async args => { query = args; return []; } },
    servico: { findMany: async () => [] },
  });
  await service.list({ servico_nome: '   ' });
  assert.equal(query.where.diarista_servico, undefined);
  await service.list({ id_servico: 3 });
  assert.deepEqual(query.where.diarista_servico.some, { id_servico: 3, ativo: true });
});

test('separa serviços, ignora termos vazios e repetidos e valida cada termo', () => {
  assert.deepEqual(serviceSearchTerms(' janelas, passar pano; lavar roupas\nJANELAS,, '), ['JANELAS', 'passar pano', 'lavar roupas']);
  assert.equal(diaristaSearchSchema.safeParse({ servico_nome: 'janelas, passar pano, lavar roupas' }).success, true);
  assert.equal(diaristaSearchSchema.safeParse({ servico_nome: Array.from({ length: 11 }, (_, index) => `serviço ${index}`).join(',') }).success, false);
  assert.equal(diaristaSearchSchema.safeParse({ servico_nome: 'a'.repeat(1001) }).success, false);
});

test('busca vários serviços com AND: somente quem oferece TODOS como ativos aparece', async () => {
  const candidates = [
    { id: 1, services: [{ name: 'Limpeza de janelas', ativo: true }, { name: 'Passar pano', ativo: true }] },
    { id: 2, services: [{ name: 'Limpeza de janelas', ativo: true }] },
    { id: 3, services: [{ name: 'Limpeza de janelas', ativo: true }, { name: 'Passar pano', ativo: false }] },
  ];
  let query;
  const service = new DiaristaSearchService({
    diarista: { findMany: async args => {
      query = args;
      return candidates.filter(candidate => args.where.AND.every(condition => candidate.services.some(offered =>
        offered.ativo === condition.diarista_servico.some.ativo && offered.name.includes(condition.diarista_servico.some.servico.nome_servico.contains))))
        .map(candidate => ({ id_diarista: candidate.id, usuario: { nome: String(candidate.id) }, endereco: [], diarista_servico: [], avaliacao: [], combo_base: [], avaliacao_media: null }));
    } },
    servico: { findMany: async () => [] },
  });
  const result = await service.list({ servico_nome: 'janelas, Passar pano', ordenar: 'nome' });
  assert.equal(query.where.AND.length, 2);
  assert.deepEqual(result.data.map(profile => profile.id_diarista), [1]);
  assert.equal(result.pagination.total, 1);
});
