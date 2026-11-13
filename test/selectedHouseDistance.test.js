import test from 'node:test';
import assert from 'node:assert/strict';
import { DiaristaSearchService } from '../src/services/diarista/DiaristaSearchService.js';
import { diaristaSearchSchema } from '../src/schemas/apiSchemas.js';

function scenario() {
  const coordinates = {
    '11111111': { latitude: 0, longitude: 0 }, '22222222': { latitude: 0, longitude: 1 },
    '33333333': { latitude: 0, longitude: 0 }, '44444444': { latitude: 0, longitude: 1 },
  };
  const profiles = Array.from({ length: 13 }, (_, i) => ({
    id_diarista: i + 1, id_usuario: i + 100, usuario: { nome: `Teste ${i + 1}` },
    endereco: [{ cep: i < 10 ? '11111-111' : '22222-222' }],
    diarista_servico: [], avaliacao: [], agendamento: [], combo_base: [], avaliacao_media: i < 10 ? 5 : 1,
  }));
  profiles.push({ ...profiles[0], id_diarista: 99, endereco: [] });
  const geocoded = [], queried = [];
  const database = {
    endereco: { findUnique: async ({ where }) => where.id_endereco === 21 ? { id_cliente: 2, cep: '33333-333' }
      : where.id_endereco === 22 ? { id_cliente: 2, cep: '44444-444' } : { id_cliente: 999, cep: '33333-333' } },
    diarista: { findMany: async args => { queried.push(args); return profiles; } },
    servico: { findMany: async () => [] },
  };
  const service = new DiaristaSearchService(database, async cep => { geocoded.push(cep); return coordinates[String(cep).replace(/\D/g, '')] ?? null; });
  return { service, geocoded, queried };
}
const auth = { id_cliente: 2, id_usuario: 1 };

test('trocar casa recalcula a origem e muda a profissional mais próxima antes da paginação', async () => {
  const { service, geocoded } = scenario();
  const first = await service.list({ id_endereco_origem: 21, ordenar: 'distancia', limit: 1, page: 1 }, auth);
  assert.equal(first.data[0].id_diarista, 1);
  geocoded.length = 0;
  // O CEP antigo enviado pelo cliente não pode manter a busca na Casa 1.
  const second = await service.list({ id_endereco_origem: 22, cep_origem: '33333-333', ordenar: 'distancia', limit: 1, page: 1 }, auth);
  assert.equal(geocoded[0], '44444-444');
  assert.equal(second.data[0].id_diarista, 11);
  assert.equal(second.data[0].distancia_km, 0);
  assert.equal(second.pagination.total, 14);
});

test('filtro de raio é recalculado a partir da casa escolhida e distância desconhecida nunca vira zero', async () => {
  const { service } = scenario();
  const first = await service.list({ id_endereco_origem: 21, ordenar: 'distancia', distancia_max: 1, limit: 100 }, auth);
  assert.equal(first.data.length, 10);
  const second = await service.list({ id_endereco_origem: 22, ordenar: 'distancia', distancia_max: 1, limit: 100 }, auth);
  assert.deepEqual(second.data.map(profile => profile.id_diarista), [11, 12, 13]);
  const all = await service.list({ id_endereco_origem: 22, ordenar: 'distancia', limit: 100 }, auth);
  assert.equal(all.data.at(-1).id_diarista, 99);
  assert.equal(all.data.at(-1).distancia_km, null);
  assert.ok(all.data[3].distancia_km > 100);
});

test('não permite usar a casa de outra conta ou selecionar casa sem sessão de cliente', async () => {
  const { service, geocoded, queried } = scenario();
  await assert.rejects(() => service.list({ id_endereco_origem: 999 }, auth), error => error.statusCode === 403);
  await assert.rejects(() => service.list({ id_endereco_origem: 21 }), error => error.statusCode === 403);
  assert.equal(geocoded.length, 0);
  assert.equal(queried.length, 0);
});

test('schema aceita casa como origem sem CEP digitado e exige um identificador válido', () => {
  assert.equal(diaristaSearchSchema.safeParse({ id_endereco_origem: '22', ordenar: 'distancia' }).success, true);
  assert.equal(diaristaSearchSchema.safeParse({ id_endereco_origem: 0, ordenar: 'distancia' }).success, false);
  assert.equal(diaristaSearchSchema.safeParse({ ordenar: 'distancia' }).success, false);
});
